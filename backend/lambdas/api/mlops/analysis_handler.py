"""
Document analysis API handler.

Provides REST endpoints for document analysis including upload triggering,
status checking, and results retrieval.
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
    AnalysisRequest, AnalysisRecord, AnalysisStatus, AnalysisType,
    validate_analysis_request_data, User
)
from common.response import success_response, error_response, cors_preflight_response, authentication_error_response
from boto3.dynamodb.conditions import Key

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


class AnalysisManager:
    """Document analysis management service."""
    
    def __init__(self):
        """Initialize the analysis manager."""
        self.uploads_raw_bucket = self._get_ssm_parameter('/mlops/uploads-raw-bucket-name')
        self.analysis_reports_bucket = self._get_ssm_parameter('/mlops/analysis-reports-bucket-name')
        self.table_name = self._get_ssm_parameter('/database/table-name')
        self.table = dynamodb.Table(self.table_name) if dynamodb else None
        self.analyzer_function = f"{config.project_name}-{config.stage}-document-analyzer"
    
    def _get_ssm_parameter(self, param_name: str) -> str:
        """Get parameter from SSM Parameter Store."""
        try:
            full_param_name = f"/{config.project_name}/{config.stage}{param_name}"
            response = ssm_client.get_parameter(Name=full_param_name)
            return response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Failed to get SSM parameter {param_name}: {e}")
            return ""
    
    def create_upload_url(self, user_id: str, filename: str, content_type: str) -> Dict[str, Any]:
        """
        Create presigned URL for document upload.
        
        Args:
            user_id: User ID requesting upload
            filename: Name of the file to upload
            content_type: MIME type of the file
            
        Returns:
            Presigned URL and upload information
        """
        try:
            # Validate inputs
            if not filename or not content_type:
                raise ValueError("Filename and content type are required")
            
            # Generate document ID and S3 key with tenant isolation
            document_id = str(uuid.uuid4())
            # Use user hash for privacy
            import hashlib
            user_hash = hashlib.sha256(user_id.encode()).hexdigest()[:16]
            session_id = str(uuid.uuid4())[:8]
            s3_key = f"uploads/{user_hash}/{session_id}/{document_id}_{filename}"
            
            # Create presigned URL for upload
            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.uploads_raw_bucket,
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
    
    def start_analysis(self, user_id: str, document_id: str, filename: str, 
                      analysis_type: str = AnalysisType.COMPLIANCE.value,
                      priority: str = "normal",
                      s3_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Start document analysis.
        
        Args:
            user_id: User ID requesting analysis
            document_id: Document identifier
            filename: Original filename
            analysis_type: Type of analysis to perform
            priority: Analysis priority
            
        Returns:
            Analysis start result with analysis ID
        """
        try:
            # Create analysis request
            analysis_request = AnalysisRequest(
                user_id=user_id,
                document_id=document_id,
                filename=filename,
                analysis_type=analysis_type,
                priority=priority,
                s3_key=s3_key
            )
            
            # Trigger analysis Lambda
            payload = {
                'analysisRequest': analysis_request.to_dict()
            }
            
            response = lambda_client.invoke(
                FunctionName=self.analyzer_function,
                InvocationType='Event',  # Asynchronous invocation
                Payload=json.dumps(payload)
            )
            
            # Generate analysis ID for tracking
            analysis_id = str(uuid.uuid4())
            
            return {
                'success': True,
                'analysisId': analysis_id,
                'status': AnalysisStatus.PENDING.value,
                'estimatedCompletion': self._estimate_completion_time(priority)
            }
            
        except Exception as e:
            logger.error(f"Error starting analysis: {e}")
            raise
    
    def get_analysis_status(self, user_id: str, analysis_id: str) -> Dict[str, Any]:
        """
        Get analysis status and results.
        
        Args:
            user_id: User ID
            analysis_id: Analysis identifier
            
        Returns:
            Analysis status and results if completed
        """
        try:
            # Get analysis record from DynamoDB
            response = self.table.get_item(
                Key={
                    'pk': f"USER#{user_id}",
                    'sk': f"ANALYSIS#{analysis_id}"
                }
            )
            
            if 'Item' not in response:
                return {
                    'success': False,
                    'error': 'Analysis not found'
                }
            
            item = response['Item']
            
            result = {
                'success': True,
                'analysisId': analysis_id,
                'status': item.get('status', AnalysisStatus.PENDING.value),
                'createdDate': item.get('createdDate'),
                'completedDate': item.get('completedDate'),
                'analysisType': item.get('analysisType'),
                'filename': item.get('filename')
            }
            
            # Add results if completed
            if item.get('status') == AnalysisStatus.COMPLETED.value and item.get('results'):
                result['results'] = item['results']
            
            # Add error message if failed
            if item.get('status') == AnalysisStatus.FAILED.value and item.get('errorMessage'):
                result['error'] = item['errorMessage']
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting analysis status: {e}")
            raise
    
    def list_user_analyses(self, user_id: str, limit: int = 50, 
                          last_key: Optional[str] = None) -> Dict[str, Any]:
        """
        List user's document analyses.
        
        Args:
            user_id: User ID
            limit: Maximum number of analyses to return
            last_key: Pagination key
            
        Returns:
            List of user analyses with pagination info
        """
        try:
            query_params = {
                'KeyConditionExpression': Key('pk').eq(f"USER#{user_id}") & Key('sk').begins_with('ANALYSIS#'),
                'ScanIndexForward': False,
                'Limit': min(limit, 100),
            }
            
            if last_key:
                query_params['ExclusiveStartKey'] = {
                    'pk': f"USER#{user_id}",
                    'sk': f"ANALYSIS#{last_key}"
                }
            
            response = self.table.query(**query_params)
            
            # Convert DynamoDB items to analysis summaries
            analyses = []
            for item in response.get('Items', []):
                try:
                    analysis = {
                        'analysisId': item['analysisId'],
                        'filename': item['filename'],
                        'analysisType': item['analysisType'],
                        'status': item['status'],
                        'createdDate': item['createdDate'],
                        'completedDate': item.get('completedDate')
                    }
                    
                    # Add summary results if completed
                    if item.get('status') == AnalysisStatus.COMPLETED.value and item.get('results'):
                        results = item['results']
                        analysis['summary'] = {
                            'overallScore': results.get('overallScore', 0.0),
                            'complianceGapsCount': len(results.get('complianceGaps', [])),
                            'riskFlagsCount': len(results.get('riskFlags', [])),
                            'confidenceScore': results.get('confidenceScore', 0.0)
                        }
                    
                    analyses.append(analysis)
                    
                except Exception as e:
                    logger.warning(f"Error parsing analysis item: {e}")
                    continue
            
            result = {
                'success': True,
                'analyses': analyses,
                'count': len(analyses)
            }
            
            # Add pagination info if available
            if 'LastEvaluatedKey' in response:
                result['lastKey'] = response['LastEvaluatedKey']['sk'].replace('ANALYSIS#', '')
            
            return result
            
        except Exception as e:
            logger.error(f"Error listing user analyses: {e}")
            raise
    
    def get_analysis_report(self, user_id: str, analysis_id: str) -> Dict[str, Any]:
        """
        Get detailed analysis report from S3.
        
        Args:
            user_id: User ID
            analysis_id: Analysis identifier
            
        Returns:
            Detailed analysis report
        """
        try:
            # First verify the analysis belongs to the user
            status_result = self.get_analysis_status(user_id, analysis_id)
            if not status_result['success']:
                return status_result
            
            if status_result['status'] != AnalysisStatus.COMPLETED.value:
                return {
                    'success': False,
                    'error': 'Analysis not completed yet'
                }
            
            # Get detailed report from S3
            try:
                s3_key = f"analyses/{analysis_id}.json"
                response = s3_client.get_object(
                    Bucket=self.analysis_reports_bucket,
                    Key=s3_key
                )
                
                report_data = json.loads(response['Body'].read())
                
                return {
                    'success': True,
                    'analysisId': analysis_id,
                    'report': report_data
                }
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    # Fall back to DynamoDB results if S3 report not found
                    return {
                        'success': True,
                        'analysisId': analysis_id,
                        'report': {
                            'analysisId': analysis_id,
                            'results': status_result.get('results', {}),
                            'source': 'dynamodb_fallback'
                        }
                    }
                else:
                    raise
            
        except Exception as e:
            logger.error(f"Error getting analysis report: {e}")
            raise
    
    def delete_analysis(self, user_id: str, analysis_id: str) -> Dict[str, Any]:
        """
        Delete analysis and its associated data.
        
        Args:
            user_id: User ID
            analysis_id: Analysis identifier
            
        Returns:
            Deletion result
        """
        try:
            # Verify analysis exists and belongs to user
            status_result = self.get_analysis_status(user_id, analysis_id)
            if not status_result['success']:
                return status_result
            
            # Delete from S3 (analysis report)
            try:
                s3_key = f"analyses/{analysis_id}.json"
                s3_client.delete_object(
                    Bucket=self.analysis_reports_bucket,
                    Key=s3_key
                )
            except ClientError as e:
                if e.response['Error']['Code'] != 'NoSuchKey':
                    logger.warning(f"Error deleting S3 report: {e}")
            
            # Delete from DynamoDB
            self.table.delete_item(
                Key={
                    'pk': f"USER#{user_id}",
                    'sk': f"ANALYSIS#{analysis_id}"
                }
            )
            
            return {
                'success': True,
                'analysisId': analysis_id,
                'message': 'Analysis deleted successfully'
            }
            
        except Exception as e:
            logger.error(f"Error deleting analysis: {e}")
            raise
    
    def _estimate_completion_time(self, priority: str) -> str:
        """Estimate analysis completion time based on priority."""
        from datetime import timedelta
        
        if priority == "high":
            eta = datetime.utcnow() + timedelta(minutes=2)
        elif priority == "low":
            eta = datetime.utcnow() + timedelta(minutes=10)
        else:  # normal
            eta = datetime.utcnow() + timedelta(minutes=5)
        
        return eta.isoformat()


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
    """Parse JSON body safely."""
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
    """
    Extract authenticated user identifier from the event.

    Supports API Gateway v2 JWT authorizers, Cognito authorizers,
    and a development header fallback.
    """
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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for document analysis API.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API response
    """
    try:
        method = _get_http_method(event)
        path = _get_request_path(event)
        logger.info(f"Analysis handler invoked: {method} {path}")

        if method == 'OPTIONS':
            return cors_preflight_response()

        body = _parse_json_body(event)
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}

        user_id = _extract_user_id(event)
        if not user_id:
            return authentication_error_response()
        
        analysis_manager = AnalysisManager()
        
        # Route requests
        if method == 'POST' and path.endswith('/analyze/upload'):
            # Create upload URL for document analysis
            result = analysis_manager.create_upload_url(
                user_id=user_id,
                filename=body.get('filename'),
                content_type=body.get('contentType')
            )
            return success_response(result)
        
        elif method == 'POST' and path.endswith('/analyze'):
            # Start document analysis
            body['userId'] = user_id  # ensure validation sees user id
            validation_errors = validate_analysis_request_data(body)
            if validation_errors:
                return error_response(
                    "Invalid analysis request",
                    status_code=400,
                    error_code="VALIDATION_ERROR",
                    details=validation_errors,
                )
            
            result = analysis_manager.start_analysis(
                user_id=user_id,
                document_id=body['documentId'],
                filename=body['filename'],
                analysis_type=body.get('analysisType', AnalysisType.COMPLIANCE.value),
                priority=body.get('priority', 'normal'),
                s3_key=body.get('s3Key')
            )
            return success_response(result)
        
        elif method == 'GET' and path.endswith('/analyze'):
            # List user analyses
            result = analysis_manager.list_user_analyses(
                user_id=user_id,
                limit=int(query_params.get('limit', 50)),
                last_key=query_params.get('lastKey')
            )
            return success_response(result)
        
        elif method == 'GET' and '/analyze/' in path:
            # Get specific analysis status/results
            analysis_id = path_params.get('analysisId')
            if not analysis_id:
                return error_response("Analysis ID is required", 400)
            
            # Check if requesting detailed report
            if path.endswith('/report'):
                result = analysis_manager.get_analysis_report(user_id, analysis_id)
            else:
                result = analysis_manager.get_analysis_status(user_id, analysis_id)
            
            if result['success']:
                return success_response(result)
            else:
                status_code = 404 if 'not found' in result.get('error', '').lower() else 400
                return error_response(result.get('error', 'Analysis error'), status_code)
        
        elif method == 'DELETE' and '/analyze/' in path:
            # Delete analysis
            analysis_id = path_params.get('analysisId')
            if not analysis_id:
                return error_response("Analysis ID is required", 400)
            
            result = analysis_manager.delete_analysis(user_id, analysis_id)
            return success_response(result)
        
        else:
            return error_response("Endpoint not found", 404)
            
    except Exception as e:
        logger.error(f"Analysis handler error: {str(e)}")
        return error_response(f"Internal server error: {str(e)}", 500)
