"""
Knowledge Base management API handler.

Provides REST endpoints for KB document management including upload,
listing, and status checking.
"""
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import boto3
from botocore.exceptions import ClientError

# Import common utilities
from common.env import config
from common.logging import get_logger
from common.models import (
    KBDocument, KBDocumentRecord, DocumentCategory, EmbeddingStatus,
    validate_kb_document_data, User
)
from common.response import success_response, error_response, cors_preflight_response, authentication_error_response
from boto3.dynamodb.conditions import Key, Attr

logger = get_logger(__name__)

# Initialize AWS clients
try:
    s3_client = boto3.client('s3', region_name=config.aws_region)
    lambda_client = boto3.client('lambda', region_name=config.aws_region)
    dynamodb = boto3.resource('dynamodb', region_name=config.aws_region)
    ssm_client = boto3.client('ssm', region_name=config.aws_region)
except Exception as e:
    logger.warning(f"AWS clients not available: {e}")
    s3_client = None
    lambda_client = None
    dynamodb = None
    ssm_client = None


class KBManager:
    """Knowledge Base management service."""
    
    def __init__(self):
        """Initialize the KB manager."""
        self.kb_raw_bucket = self._get_ssm_parameter('/mlops/kb-raw-bucket-name')
        self.table_name = self._get_ssm_parameter('/database/table-name')
        self.table = dynamodb.Table(self.table_name) if dynamodb else None
        self.kb_processor_function = f"{config.project_name}-{config.stage}-kb-processor"
    
    def _get_ssm_parameter(self, param_name: str) -> str:
        """Get parameter from SSM Parameter Store."""
        try:
            full_param_name = f"/{config.project_name}/{config.stage}{param_name}"
            response = ssm_client.get_parameter(Name=full_param_name)
            return response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Failed to get SSM parameter {param_name}: {e}")
            return ""
    
    def create_upload_url(self, user_id: str, filename: str, content_type: str, 
                         category: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create presigned URL for KB document upload.
        
        Args:
            user_id: User ID requesting upload
            filename: Name of the file to upload
            content_type: MIME type of the file
            category: Document category
            metadata: Optional metadata
            
        Returns:
            Presigned URL and upload information
        """
        try:
            # Validate inputs
            if not filename or not content_type or not category:
                raise ValueError("Filename, content type, and category are required")
            
            if category not in [c.value for c in DocumentCategory]:
                raise ValueError(f"Invalid category: {category}")
            
            # Generate document ID and S3 key
            document_id = str(uuid.uuid4())
            s3_key = f"{category}/{document_id}_{filename}"
            
            # Create presigned URL for upload
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.kb_raw_bucket,
                    'Key': s3_key,
                    'ContentType': content_type
                },
                ExpiresIn=3600  # 1 hour
            )
            
            return {
                'success': True,
                'uploadUrl': presigned_url,
                'documentId': document_id,
                's3Key': s3_key,
                'expiresIn': 3600
            }
            
        except Exception as e:
            logger.error(f"Error creating upload URL: {e}")
            raise
    
    def trigger_processing(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger document processing after upload.
        
        Args:
            document_data: Document metadata
            
        Returns:
            Processing trigger result
        """
        try:
            # Invoke KB processor Lambda
            payload = {
                'documentData': document_data
            }
            
            response = lambda_client.invoke(
                FunctionName=self.kb_processor_function,
                InvocationType='Event',  # Asynchronous invocation
                Payload=json.dumps(payload)
            )
            
            return {
                'success': True,
                'processingTriggered': True,
                'documentId': document_data.get('documentId')
            }
            
        except Exception as e:
            logger.error(f"Error triggering processing: {e}")
            raise
    
    def list_documents(self, category: Optional[str] = None, 
                      limit: int = 50, last_key: Optional[str] = None) -> Dict[str, Any]:
        """
        List KB documents with optional filtering.
        
        Args:
            category: Optional category filter
            limit: Maximum number of documents to return
            last_key: Pagination key
            
        Returns:
            List of documents with pagination info
        """
        try:
            if not self.table:
                raise ValueError("DynamoDB table not configured")

            limit = min(limit, 100)
            pagination_key = _decode_pagination_key(last_key)

            if category:
                query_kwargs: Dict[str, Any] = {
                    'IndexName': 'GSI1',
                    'KeyConditionExpression': Key('gsi1pk').eq(f"KB_CATEGORY#{category}"),
                    'Limit': limit,
                    'ScanIndexForward': False,
                }
                if pagination_key:
                    query_kwargs['ExclusiveStartKey'] = pagination_key
                response = self.table.query(**query_kwargs)
            else:
                scan_kwargs: Dict[str, Any] = {
                    'FilterExpression': Attr('pk').begins_with('KB_DOC#'),
                    'Limit': limit,
                }
                if pagination_key:
                    scan_kwargs['ExclusiveStartKey'] = pagination_key
                response = self.table.scan(**scan_kwargs)
            
            # Convert DynamoDB items to document objects
            documents = []
            for item in response.get('Items', []):
                try:
                    doc = KBDocument(
                        id=item['documentId'],
                        filename=item['filename'],
                        content_type=item['contentType'],
                        size=item['size'],
                        category=item['category'],
                        upload_date=datetime.fromisoformat(item['uploadDate'].replace('Z', '+00:00')),
                        processed_date=datetime.fromisoformat(item['processedDate'].replace('Z', '+00:00')) if item.get('processedDate') else None,
                        chunk_count=item.get('chunkCount', 0),
                        embedding_status=item.get('embeddingStatus', EmbeddingStatus.PENDING.value),
                        s3_key=item.get('s3Key', ''),
                        metadata=item.get('metadata', {})
                    )
                    documents.append(doc.to_dict())
                except Exception as e:
                    logger.warning(f"Error parsing document item: {e}")
                    continue
            
            result = {
                'success': True,
                'documents': documents,
                'count': len(documents)
            }
            
            # Add pagination info if available
            if 'LastEvaluatedKey' in response:
                result['lastKey'] = json.dumps(response['LastEvaluatedKey'])
            
            return result
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            raise
    
    def get_document(self, document_id: str) -> Dict[str, Any]:
        """
        Get specific KB document by ID.
        
        Args:
            document_id: Document identifier
            
        Returns:
            Document information
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f"KB_DOC#{document_id}",
                    'sk': 'METADATA'
                }
            )
            
            if 'Item' not in response:
                return {
                    'success': False,
                    'error': 'Document not found'
                }
            
            item = response['Item']
            doc = KBDocument(
                id=item['documentId'],
                filename=item['filename'],
                content_type=item['contentType'],
                size=item['size'],
                category=item['category'],
                upload_date=datetime.fromisoformat(item['uploadDate'].replace('Z', '+00:00')),
                processed_date=datetime.fromisoformat(item['processedDate'].replace('Z', '+00:00')) if item.get('processedDate') else None,
                chunk_count=item.get('chunkCount', 0),
                embedding_status=item.get('embeddingStatus', EmbeddingStatus.PENDING.value),
                s3_key=item.get('s3Key', ''),
                metadata=item.get('metadata', {})
            )
            
            return {
                'success': True,
                'document': doc.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Error getting document {document_id}: {e}")
            raise
    
    def delete_document(self, document_id: str) -> Dict[str, Any]:
        """
        Delete KB document and its associated data.
        
        Args:
            document_id: Document identifier
            
        Returns:
            Deletion result
        """
        try:
            # Get document info first
            doc_response = self.get_document(document_id)
            if not doc_response['success']:
                return doc_response
            
            document = doc_response['document']
            
            # Delete from S3 (raw document and embeddings)
            try:
                if document.get('s3Key'):
                    s3_client.delete_object(Bucket=self.kb_raw_bucket, Key=document['s3Key'])
                
                # Delete embeddings
                kb_vectors_bucket = self._get_ssm_parameter('/mlops/kb-vectors-bucket-name')
                s3_client.delete_object(Bucket=kb_vectors_bucket, Key=f"embeddings/{document_id}.json")
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchKey':
                    logger.warning(f"Error deleting S3 objects: {e}")
            
            # Delete from DynamoDB
            self.table.delete_item(
                Key={
                    'pk': f"KB_DOC#{document_id}",
                    'sk': 'METADATA'
                }
            )
            
            return {
                'success': True,
                'documentId': document_id,
                'message': 'Document deleted successfully'
            }
            
        except Exception as e:
            logger.error(f"Error deleting document {document_id}: {e}")
            raise


def _get_http_method(event: Dict[str, Any]) -> str:
    """Extract HTTP method compatible with API Gateway v1/v2 events."""
    request_context = event.get('requestContext', {}) or {}
    http_info = request_context.get('http', {}) or {}

    method = http_info.get('method') or event.get('httpMethod')
    return method.upper() if isinstance(method, str) else ''


def _get_request_path(event: Dict[str, Any]) -> str:
    """Extract request path compatible with API Gateway v1/v2 events."""
    request_context = event.get('requestContext', {}) or {}
    http_info = request_context.get('http', {}) or {}

    path = http_info.get('path') or event.get('path')
    return path or ''


def _parse_json_body(event: Dict[str, Any]) -> Dict[str, Any]:
    """Parse event body into a dictionary."""
    body = event.get('body')
    if not body:
        return {}

    if isinstance(body, dict):
        return body

    if isinstance(body, str):
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON body")
            return {}

    return {}


def _extract_user_id(event: Dict[str, Any]) -> Optional[str]:
    """Extract authenticated user identifier from the event."""
    request_context = event.get('requestContext', {}) or {}
    authorizer = request_context.get('authorizer', {}) or {}

    claims: Dict[str, Any] = {}
    jwt_data = authorizer.get('jwt')
    if isinstance(jwt_data, dict):
        claims = jwt_data.get('claims', {}) or {}
    elif isinstance(authorizer.get('claims'), dict):
        claims = authorizer.get('claims', {}) or {}

    user_id = (
        claims.get('sub')
        or claims.get('cognito:username')
        or claims.get('username')
    )

    if not user_id and isinstance(authorizer.get('principalId'), str):
        user_id = authorizer['principalId']

    if not user_id:
        headers = event.get('headers') or {}
        user_id = headers.get('x-user-id') or headers.get('X-User-Id')

    return user_id


def _decode_pagination_key(raw_key: Optional[Any]) -> Optional[Dict[str, Any]]:
    """Decode pagination token provided by the client."""
    if not raw_key:
        return None

    if isinstance(raw_key, dict):
        return raw_key

    if isinstance(raw_key, str):
        try:
            return json.loads(raw_key)
        except json.JSONDecodeError:
            logger.warning("Invalid pagination key")
            return None

    return None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for KB management API.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API response
    """
    try:
        method = _get_http_method(event)
        path = _get_request_path(event)
        logger.info(f"KB handler invoked: {method} {path}")

        if method == 'OPTIONS':
            return cors_preflight_response()

        body = _parse_json_body(event)
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}

        user_id = _extract_user_id(event)
        if not user_id:
            return authentication_error_response()
        
        kb_manager = KBManager()
        
        # Route requests
        if method == 'POST' and path.endswith('/kb/upload'):
            # Create upload URL
            result = kb_manager.create_upload_url(
                user_id=user_id,
                filename=body.get('filename'),
                content_type=body.get('contentType'),
                category=body.get('category'),
                metadata=body.get('metadata')
            )
            return success_response(result)
        
        elif method == 'POST' and path.endswith('/kb/process'):
            # Trigger document processing
            result = kb_manager.trigger_processing(body)
            return success_response(result)
        
        elif method == 'GET' and path.endswith('/kb/documents'):
            # List documents
            result = kb_manager.list_documents(
                category=query_params.get('category'),
                limit=int(query_params.get('limit', 50)),
                last_key=query_params.get('lastKey')
            )
            return success_response(result)
        
        elif method == 'GET' and '/kb/documents/' in path:
            # Get specific document
            document_id = path_params.get('documentId')
            if not document_id:
                return error_response("Document ID is required", 400)
            
            result = kb_manager.get_document(document_id)
            status_code = 200 if result['success'] else 404
            return success_response(result) if result['success'] else error_response(result.get('error', 'Document not found'), 404)
        
        elif method == 'DELETE' and '/kb/documents/' in path:
            # Delete document
            document_id = path_params.get('documentId')
            if not document_id:
                return error_response("Document ID is required", 400)
            
            result = kb_manager.delete_document(document_id)
            return success_response(result)
        
        else:
            return error_response("Endpoint not found", 404)
            
    except Exception as e:
        logger.error(f"KB handler error: {str(e)}")
        return error_response(f"Internal server error: {str(e)}", 500)
