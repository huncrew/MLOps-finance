"""
MLOps health check handler.

Provides health check endpoints for monitoring the MLOps pipeline
components and their dependencies.
"""
import json
from datetime import datetime
from typing import Dict, Any
import boto3
from botocore.exceptions import ClientError

# Import common utilities
from common.env import config
from common.logging import get_logger
from common.mlops_errors import HealthChecker, MLOpsErrorHandler, extract_correlation_id
from common.response import success_response, error_response

logger = get_logger(__name__)

# Initialize AWS clients
try:
    s3_client = boto3.client('s3', region_name=config.aws_region)
    bedrock_client = boto3.client('bedrock-runtime', region_name=config.aws_region)
    dynamodb = boto3.resource('dynamodb', region_name=config.aws_region)
    ssm_client = boto3.client('ssm', region_name=config.aws_region)
except Exception as e:
    logger.warning(f"AWS clients not available: {e}")
    s3_client = None
    bedrock_client = None
    dynamodb = None
    ssm_client = None


class MLOpsHealthChecker:
    """MLOps system health checker."""
    
    def __init__(self):
        """Initialize health checker."""
        self.error_handler = MLOpsErrorHandler("health-checker")
        self.health_checker = HealthChecker("mlops-pipeline")
        
        # Get configuration
        self.kb_raw_bucket = self._get_ssm_parameter('/mlops/kb-raw-bucket-name')
        self.kb_vectors_bucket = self._get_ssm_parameter('/mlops/kb-vectors-bucket-name')
        self.table_name = self._get_ssm_parameter('/database/table-name')
        
        # Add health checks
        self._setup_health_checks()
    
    def _get_ssm_parameter(self, param_name: str) -> str:
        """Get parameter from SSM Parameter Store."""
        try:
            full_param_name = f"/{config.project_name}/{config.stage}{param_name}"
            response = ssm_client.get_parameter(Name=full_param_name)
            return response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Failed to get SSM parameter {param_name}: {e}")
            return ""
    
    def _setup_health_checks(self):
        """Setup all health check functions."""
        self.health_checker.add_check("dynamodb", self._check_dynamodb)
        self.health_checker.add_check("s3_kb_raw", self._check_s3_kb_raw)
        self.health_checker.add_check("s3_kb_vectors", self._check_s3_kb_vectors)
        self.health_checker.add_check("bedrock_titan", self._check_bedrock_titan)
        self.health_checker.add_check("bedrock_claude", self._check_bedrock_claude)
    
    def _check_dynamodb(self):
        """Check DynamoDB connectivity and table status."""
        if not dynamodb or not self.table_name:
            raise Exception("DynamoDB not configured")
        
        table = dynamodb.Table(self.table_name)
        
        # Check table status
        response = table.meta.client.describe_table(TableName=self.table_name)
        status = response['Table']['TableStatus']
        
        if status != 'ACTIVE':
            raise Exception(f"DynamoDB table status: {status}")
        
        # Test read operation
        try:
            table.get_item(Key={'pk': 'HEALTH_CHECK', 'sk': 'TEST'})
        except ClientError as e:
            if e.response['Error']['Code'] not in ['ResourceNotFoundException']:
                raise
    
    def _check_s3_kb_raw(self):
        """Check S3 KB raw bucket accessibility."""
        if not s3_client or not self.kb_raw_bucket:
            raise Exception("S3 KB raw bucket not configured")
        
        # Test bucket access
        s3_client.head_bucket(Bucket=self.kb_raw_bucket)
    
    def _check_s3_kb_vectors(self):
        """Check S3 KB vectors bucket accessibility."""
        if not s3_client or not self.kb_vectors_bucket:
            raise Exception("S3 KB vectors bucket not configured")
        
        # Test bucket access
        s3_client.head_bucket(Bucket=self.kb_vectors_bucket)
    
    def _check_bedrock_titan(self):
        """Check Bedrock Titan embeddings model availability."""
        if not bedrock_client:
            raise Exception("Bedrock client not configured")
        
        # Test Titan embeddings with a simple request
        request_body = {"inputText": "health check"}
        
        try:
            response = bedrock_client.invoke_model(
                modelId="amazon.titan-embed-text-v1",
                body=json.dumps(request_body),
                contentType="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            embedding = response_body.get('embedding', [])
            
            if len(embedding) != 1536:
                raise Exception(f"Unexpected embedding dimension: {len(embedding)}")
                
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            raise Exception(f"Bedrock Titan error: {error_code}")
    
    def _check_bedrock_claude(self):
        """Check Bedrock Claude model availability."""
        if not bedrock_client:
            raise Exception("Bedrock client not configured")
        
        # Test Claude with a simple request
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10,
            "temperature": 0.1,
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'OK' if you can respond."
                }
            ]
        }
        
        try:
            response = bedrock_client.invoke_model(
                modelId="anthropic.claude-3-haiku-20240307-v1:0",
                body=json.dumps(request_body),
                contentType="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            content = response_body.get('content', [])
            
            if not content or not content[0].get('text'):
                raise Exception("No response from Claude")
                
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            raise Exception(f"Bedrock Claude error: {error_code}")
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health status."""
        try:
            health_results = self.health_checker.run_health_checks()
            
            # Add system information
            health_results['system_info'] = {
                'service': 'mlops-pipeline',
                'version': '1.0.0',
                'environment': config.stage,
                'region': config.aws_region
            }
            
            # Add configuration status
            health_results['configuration'] = {
                'kb_raw_bucket': bool(self.kb_raw_bucket),
                'kb_vectors_bucket': bool(self.kb_vectors_bucket),
                'database_table': bool(self.table_name),
                'aws_clients': {
                    's3': bool(s3_client),
                    'bedrock': bool(bedrock_client),
                    'dynamodb': bool(dynamodb),
                    'ssm': bool(ssm_client)
                }
            }
            
            return health_results
            
        except Exception as e:
            logger.error(f"Error getting system health: {e}")
            return {
                'service': 'mlops-pipeline',
                'timestamp': datetime.utcnow().isoformat(),
                'overall_status': 'unhealthy',
                'error': str(e),
                'checks': []
            }
    
    def get_component_health(self, component: str) -> Dict[str, Any]:
        """Get health status for a specific component."""
        component_checks = {
            'kb': ['dynamodb', 's3_kb_raw', 's3_kb_vectors'],
            'analysis': ['dynamodb', 'bedrock_titan', 'bedrock_claude'],
            'rag': ['dynamodb', 's3_kb_vectors', 'bedrock_titan', 'bedrock_claude'],
            'storage': ['dynamodb', 's3_kb_raw', 's3_kb_vectors'],
            'ai': ['bedrock_titan', 'bedrock_claude']
        }
        
        if component not in component_checks:
            return {
                'component': component,
                'status': 'unknown',
                'error': f"Unknown component: {component}"
            }
        
        # Run only the checks for this component
        relevant_checks = component_checks[component]
        all_results = self.health_checker.run_health_checks()
        
        component_result = {
            'component': component,
            'timestamp': all_results['timestamp'],
            'status': 'healthy',
            'checks': []
        }
        
        for check in all_results['checks']:
            if check['name'] in relevant_checks:
                component_result['checks'].append(check)
                if check['status'] != 'healthy':
                    component_result['status'] = 'unhealthy'
        
        return component_result


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for MLOps health checks.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        Health check response
    """
    correlation_id = extract_correlation_id(event)
    
    try:
        logger.info(f"Health check invoked [{correlation_id}]: {event.get('httpMethod')} {event.get('path')}")
        
        # Extract request info
        method = event.get('httpMethod', '')
        path = event.get('path', '')
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}
        
        health_checker = MLOpsHealthChecker()
        
        # Route health check requests
        if method == 'GET' and path.endswith('/health'):
            # Overall system health
            result = health_checker.get_system_health()
            status_code = 200 if result['overall_status'] == 'healthy' else 503
            return {
                'statusCode': status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': correlation_id
                },
                'body': json.dumps(result)
            }
        
        elif method == 'GET' and '/health/' in path:
            # Component-specific health
            component = path_params.get('component')
            if not component:
                return error_response("Component name is required", 400)
            
            result = health_checker.get_component_health(component)
            status_code = 200 if result['status'] == 'healthy' else 503
            return {
                'statusCode': status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': correlation_id
                },
                'body': json.dumps(result)
            }
        
        else:
            return error_response("Health check endpoint not found", 404)
            
    except Exception as e:
        logger.error(f"Health check error [{correlation_id}]: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': correlation_id
            },
            'body': json.dumps({
                'service': 'mlops-pipeline',
                'timestamp': datetime.utcnow().isoformat(),
                'overall_status': 'unhealthy',
                'error': str(e),
                'correlationId': correlation_id
            })
        }
