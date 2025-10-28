"""
RAG query API handler.

Provides REST endpoints for querying the Knowledge Base using natural language,
including query processing, history retrieval, and query management.
"""
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import boto3
from botocore.exceptions import ClientError

# Import common utilities
from common.env import config
from common.logging import get_logger
from common.models import (
    RAGQuery, RAGResponse, QueryRecord, QueryType,
    validate_rag_query_data, User
)
from common.response import (
    success_response,
    error_response,
    cors_preflight_response,
    authentication_error_response,
)
from boto3.dynamodb.conditions import Key

logger = get_logger(__name__)

# Initialize AWS clients
try:
    lambda_client = boto3.client('lambda', region_name=config.aws_region)
    dynamodb = boto3.resource('dynamodb', region_name=config.aws_region)
    ssm_client = boto3.client('ssm', region_name=config.aws_region)
except Exception as e:
    logger.warning(f"AWS clients not available: {e}")
    lambda_client = None
    dynamodb = None
    ssm_client = None


class RAGManager:
    """RAG query management service."""
    
    def __init__(self):
        """Initialize the RAG manager."""
        self.table_name = self._get_ssm_parameter('/database/table-name')
        self.table = dynamodb.Table(self.table_name) if dynamodb else None
        self.rag_processor_function = f"{config.project_name}-{config.stage}-rag-processor"
        
        # Rate limiting settings
        self.max_queries_per_hour = 100
        self.max_queries_per_day = 500
    
    def _get_ssm_parameter(self, param_name: str) -> str:
        """Get parameter from SSM Parameter Store."""
        try:
            full_param_name = f"/{config.project_name}/{config.stage}{param_name}"
            response = ssm_client.get_parameter(Name=full_param_name)
            return response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Failed to get SSM parameter {param_name}: {e}")
            return ""
    
    def process_query(self, user_id: str, query_text: str, query_type: str = QueryType.GENERAL.value,
                     max_results: int = 5, similarity_threshold: float = 0.7) -> Dict[str, Any]:
        """
        Process a natural language query against the Knowledge Base.
        
        Args:
            user_id: User ID making the query
            query_text: Natural language query
            query_type: Type of query (general, policy, regulation, compliance)
            max_results: Maximum number of results to return
            similarity_threshold: Minimum similarity threshold for matches
            
        Returns:
            Query processing result with response and sources
        """
        try:
            # Check rate limits
            rate_limit_check = self._check_rate_limits(user_id)
            if not rate_limit_check['allowed']:
                return {
                    'success': False,
                    'error': 'Rate limit exceeded',
                    'details': rate_limit_check
                }
            
            # Generate query ID
            query_id = str(uuid.uuid4())
            
            # Create RAG query object
            rag_query = RAGQuery(
                query_id=query_id,
                user_id=user_id,
                query_text=query_text,
                query_type=query_type,
                max_results=max_results,
                similarity_threshold=similarity_threshold
            )
            
            # Invoke RAG processor Lambda
            payload = {
                'ragQuery': rag_query.to_dict()
            }
            
            response = lambda_client.invoke(
                FunctionName=self.rag_processor_function,
                InvocationType='RequestResponse',  # Synchronous invocation
                Payload=json.dumps(payload)
            )
            
            # Parse response
            response_payload = json.loads(response['Payload'].read())
            
            if response_payload.get('statusCode') == 200:
                body = json.loads(response_payload['body'])
                if body['success']:
                    return {
                        'success': True,
                        'queryId': query_id,
                        'response': body['response']
                    }
                else:
                    return {
                        'success': False,
                        'error': body.get('error', 'Query processing failed')
                    }
            else:
                return {
                    'success': False,
                    'error': 'Query processing failed',
                    'details': response_payload
                }
            
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_query_history(self, user_id: str, limit: int = 50, 
                         last_key: Optional[str] = None, 
                         date_filter: Optional[str] = None) -> Dict[str, Any]:
        """
        Get user's query history.
        
        Args:
            user_id: User ID
            limit: Maximum number of queries to return
            last_key: Pagination key
            date_filter: Optional date filter (YYYY-MM-DD)
            
        Returns:
            List of user queries with pagination info
        """
        try:
            if not self.table:
                raise ValueError("DynamoDB table not configured")

            limit = min(limit, 100)
            pagination_key = _decode_history_pagination_key(last_key, user_id)

            query_kwargs: Dict[str, Any] = {
                'KeyConditionExpression': Key('pk').eq(f"USER#{user_id}") & Key('sk').begins_with('QUERY#'),
                'ScanIndexForward': False,
                'Limit': limit,
            }

            if pagination_key:
                query_kwargs['ExclusiveStartKey'] = pagination_key

            response = self.table.query(**query_kwargs)
            
            # Convert DynamoDB items to query summaries
            queries = []
            for item in response.get('Items', []):
                try:
                    # Apply date filter if specified
                    if date_filter:
                        query_date = item.get('createdDate', '')[:10]  # Extract YYYY-MM-DD
                        if query_date != date_filter:
                            continue
                    
                    query = {
                        'queryId': item['queryId'],
                        'queryText': item['queryText'],
                        'queryType': item['queryType'],
                        'responseText': item['responseText'][:200] + "..." if len(item['responseText']) > 200 else item['responseText'],
                        'confidenceScore': item['confidenceScore'],
                        'createdDate': item['createdDate'],
                        'sourcesCount': len(item.get('sources', [])),
                        'tokenUsage': item.get('tokenUsage', {})
                    }
                    
                    queries.append(query)
                    
                except Exception as e:
                    logger.warning(f"Error parsing query item: {e}")
                    continue
            
            result = {
                'success': True,
                'queries': queries,
                'count': len(queries)
            }
            
            # Add pagination info if available
            if 'LastEvaluatedKey' in response:
                result['lastKey'] = json.dumps(response['LastEvaluatedKey'])
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting query history: {e}")
            raise
    
    def get_query_details(self, user_id: str, query_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific query.
        
        Args:
            user_id: User ID
            query_id: Query identifier
            
        Returns:
            Detailed query information including full response and sources
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f"USER#{user_id}",
                    'sk': f"QUERY#{query_id}"
                }
            )
            
            if 'Item' not in response:
                return {
                    'success': False,
                    'error': 'Query not found'
                }
            
            item = response['Item']
            
            query_details = {
                'queryId': item['queryId'],
                'queryText': item['queryText'],
                'queryType': item['queryType'],
                'responseText': item['responseText'],
                'sources': item.get('sources', []),
                'confidenceScore': item['confidenceScore'],
                'createdDate': item['createdDate'],
                'tokenUsage': item.get('tokenUsage', {})
            }
            
            return {
                'success': True,
                'query': query_details
            }
            
        except Exception as e:
            logger.error(f"Error getting query details: {e}")
            raise
    
    def delete_query(self, user_id: str, query_id: str) -> Dict[str, Any]:
        """
        Delete a query from user's history.
        
        Args:
            user_id: User ID
            query_id: Query identifier
            
        Returns:
            Deletion result
        """
        try:
            # Verify query exists and belongs to user
            query_details = self.get_query_details(user_id, query_id)
            if not query_details['success']:
                return query_details
            
            # Delete from DynamoDB
            self.table.delete_item(
                Key={
                    'pk': f"USER#{user_id}",
                    'sk': f"QUERY#{query_id}"
                }
            )
            
            return {
                'success': True,
                'queryId': query_id,
                'message': 'Query deleted successfully'
            }
            
        except Exception as e:
            logger.error(f"Error deleting query: {e}")
            raise
    
    def get_query_statistics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get query statistics for a user.
        
        Args:
            user_id: User ID
            days: Number of days to include in statistics
            
        Returns:
            Query statistics including counts, types, and trends
        """
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Query user's queries within date range
            response = self.table.query(
                KeyConditionExpression=Key('pk').eq(f"USER#{user_id}") & Key('sk').begins_with('QUERY#'),
                ScanIndexForward=False
            )
            
            # Process statistics
            total_queries = 0
            query_types = {}
            daily_counts = {}
            total_tokens = 0
            avg_confidence = 0.0
            
            for item in response.get('Items', []):
                try:
                    created_date = datetime.fromisoformat(item['createdDate'].replace('Z', '+00:00'))
                    
                    # Skip queries outside date range
                    if created_date < start_date:
                        continue
                    
                    total_queries += 1
                    
                    # Count by query type
                    query_type = item.get('queryType', 'general')
                    query_types[query_type] = query_types.get(query_type, 0) + 1
                    
                    # Count by day
                    day_key = created_date.strftime('%Y-%m-%d')
                    daily_counts[day_key] = daily_counts.get(day_key, 0) + 1
                    
                    # Sum tokens
                    token_usage = item.get('tokenUsage', {})
                    total_tokens += token_usage.get('input_tokens', 0) + token_usage.get('output_tokens', 0)
                    
                    # Sum confidence scores
                    avg_confidence += item.get('confidenceScore', 0.0)
                    
                except Exception as e:
                    logger.warning(f"Error processing query item for statistics: {e}")
                    continue
            
            # Calculate averages
            if total_queries > 0:
                avg_confidence = avg_confidence / total_queries
            
            return {
                'success': True,
                'statistics': {
                    'totalQueries': total_queries,
                    'dateRange': {
                        'startDate': start_date.isoformat(),
                        'endDate': end_date.isoformat(),
                        'days': days
                    },
                    'queryTypes': query_types,
                    'dailyCounts': daily_counts,
                    'totalTokens': total_tokens,
                    'averageConfidence': round(avg_confidence, 3),
                    'averageQueriesPerDay': round(total_queries / days, 2) if days > 0 else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting query statistics: {e}")
            raise
    
    def _check_rate_limits(self, user_id: str) -> Dict[str, Any]:
        """
        Check if user has exceeded rate limits.
        
        Args:
            user_id: User ID
            
        Returns:
            Rate limit check result
        """
        try:
            now = datetime.utcnow()
            hour_ago = now - timedelta(hours=1)
            day_ago = now - timedelta(days=1)
            
            # Query recent queries using GSI
            response = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression=Key('gsi1pk').eq(f"QUERY_DATE#{now.strftime('%Y-%m-%d')}") &
                Key('gsi1sk').eq(f"USER#{user_id}")
            )
            
            # Count queries in different time windows
            hourly_count = 0
            daily_count = len(response.get('Items', []))
            
            for item in response.get('Items', []):
                try:
                    created_date = datetime.fromisoformat(item['createdDate'].replace('Z', '+00:00'))
                    if created_date >= hour_ago:
                        hourly_count += 1
                except:
                    continue
            
            # Check limits
            hourly_exceeded = hourly_count >= self.max_queries_per_hour
            daily_exceeded = daily_count >= self.max_queries_per_day
            
            return {
                'allowed': not (hourly_exceeded or daily_exceeded),
                'hourlyCount': hourly_count,
                'hourlyLimit': self.max_queries_per_hour,
                'dailyCount': daily_count,
                'dailyLimit': self.max_queries_per_day,
                'hourlyExceeded': hourly_exceeded,
                'dailyExceeded': daily_exceeded
            }
            
        except Exception as e:
            logger.error(f"Error checking rate limits: {e}")
            # Allow query on error to avoid blocking users
            return {'allowed': True}


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
    """Parse incoming JSON body safely."""
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
    """Decode pagination key supplied by the client."""
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


def _decode_history_pagination_key(raw_key: Optional[Any], user_id: str) -> Optional[Dict[str, Any]]:
    """Decode pagination key for query history requests."""
    decoded_key = _decode_pagination_key(raw_key)
    if decoded_key:
        return decoded_key

    if isinstance(raw_key, str) and raw_key:
        return {
            'pk': f"USER#{user_id}",
            'sk': f"QUERY#{raw_key}"
        }

    return None


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for RAG query API.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API response
    """
    try:
        method = _get_http_method(event)
        path = _get_request_path(event)
        logger.info(f"RAG handler invoked: {method} {path}")

        if method == 'OPTIONS':
            return cors_preflight_response()

        body = _parse_json_body(event)
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}

        user_id = _extract_user_id(event)
        if not user_id:
            return authentication_error_response()
        
        rag_manager = RAGManager()
        
        # Route requests
        if method == 'POST' and path.endswith('/query'):
            # Process natural language query
            validation_errors = validate_rag_query_data(body)
            if validation_errors:
                return error_response(
                    "Invalid query data",
                    status_code=400,
                    error_code="VALIDATION_ERROR",
                    details=validation_errors,
                )
            
            result = rag_manager.process_query(
                user_id=user_id,
                query_text=body['queryText'],
                query_type=body.get('queryType', QueryType.GENERAL.value),
                max_results=body.get('maxResults', 5),
                similarity_threshold=body.get('similarityThreshold', 0.7)
            )
            
            if result['success']:
                return success_response(result)
            else:
                status_code = 429 if 'rate limit' in result.get('error', '').lower() else 400
                return error_response(result.get('error', 'Query processing failed'), status_code)
        
        elif method == 'GET' and path.endswith('/query/history'):
            # Get query history
            result = rag_manager.get_query_history(
                user_id=user_id,
                limit=int(query_params.get('limit', 50)),
                last_key=query_params.get('lastKey'),
                date_filter=query_params.get('date')
            )
            return success_response(result)
        
        elif method == 'GET' and path.endswith('/query/statistics'):
            # Get query statistics
            days = int(query_params.get('days', 30))
            result = rag_manager.get_query_statistics(user_id, days)
            return success_response(result)
        
        elif method == 'GET' and '/query/' in path:
            # Get specific query details
            query_id = path_params.get('queryId')
            if not query_id:
                return error_response("Query ID is required", 400)
            
            result = rag_manager.get_query_details(user_id, query_id)
            if result['success']:
                return success_response(result)
            else:
                status_code = 404 if 'not found' in result.get('error', '').lower() else 400
                return error_response(result.get('error', 'Query error'), status_code)
        
        elif method == 'DELETE' and '/query/' in path:
            # Delete query from history
            query_id = path_params.get('queryId')
            if not query_id:
                return error_response("Query ID is required", 400)
            
            result = rag_manager.delete_query(user_id, query_id)
            return success_response(result)
        
        else:
            return error_response("Endpoint not found", 404)
            
    except Exception as e:
        logger.error(f"RAG handler error: {str(e)}")
        return error_response(f"Internal server error: {str(e)}", 500)
