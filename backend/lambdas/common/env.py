"""
Environment configuration and SSM parameter management for Lambda functions.
"""
import os
import boto3
from typing import Optional, Dict, Any
from functools import lru_cache


class Config:
    """Configuration manager for Lambda functions."""
    
    def __init__(self):
        self.aws_region = os.environ.get('AWS_REGION', 'us-east-1')
        self.stage = os.environ.get('STAGE', 'dev')
        self.project_name = os.environ.get('PROJECT_NAME', 'simple-saas-template')
        
        # Direct environment variables (for local development)
        self.database_table_name = os.environ.get('DATABASE_TABLE_NAME')
        self.api_url = os.environ.get('API_URL')
        self.uploads_bucket_name = os.environ.get('UPLOADS_BUCKET_NAME')
        
        # SSM client for parameter retrieval
        self._ssm_client = None
        self._parameter_cache: Dict[str, str] = {}
    
    @property
    def ssm_client(self):
        """Lazy initialization of SSM client."""
        if self._ssm_client is None:
            self._ssm_client = boto3.client('ssm', region_name=self.aws_region)
        return self._ssm_client
    
    @property
    def ssm_prefix(self) -> str:
        """SSM parameter prefix for this environment."""
        return f"/{self.project_name}/{self.stage}"
    
    @lru_cache(maxsize=32)
    def get_ssm_parameter(self, name: str, decrypt: bool = True) -> Optional[str]:
        """
        Retrieve parameter from SSM Parameter Store with caching.
        
        Args:
            name: Parameter name (without prefix)
            decrypt: Whether to decrypt SecureString parameters
            
        Returns:
            Parameter value or None if not found
        """
        try:
            full_name = f"{self.ssm_prefix}/{name}"
            
            # Check cache first
            if full_name in self._parameter_cache:
                return self._parameter_cache[full_name]
            
            response = self.ssm_client.get_parameter(
                Name=full_name,
                WithDecryption=decrypt
            )
            
            value = response['Parameter']['Value']
            self._parameter_cache[full_name] = value
            return value
            
        except Exception as e:
            print(f"Error retrieving SSM parameter {name}: {str(e)}")
            return None
    
    def get_database_table_name(self) -> str:
        """Get DynamoDB table name from environment or SSM."""
        if self.database_table_name:
            return self.database_table_name
        
        table_name = self.get_ssm_parameter('database/table-name', decrypt=False)
        if table_name:
            return table_name
            
        # Fallback for development
        return f"{self.project_name}-{self.stage}-database"
    
    def get_uploads_bucket_name(self) -> str:
        """Get S3 uploads bucket name from environment or SSM."""
        if self.uploads_bucket_name:
            return self.uploads_bucket_name
            
        bucket_name = self.get_ssm_parameter('s3/uploads-bucket-name', decrypt=False)
        if bucket_name:
            return bucket_name
            
        # Fallback for development
        return f"{self.project_name}-{self.stage}-uploads"
    
    def get_stripe_secret_key(self) -> Optional[str]:
        """Get Stripe secret key from environment or SSM."""
        env_key = os.environ.get('STRIPE_SECRET_KEY')
        if env_key and not env_key.startswith('placeholder'):
            return env_key
            
        return self.get_ssm_parameter('stripe/secret-key', decrypt=True)
    
    def get_stripe_webhook_secret(self) -> Optional[str]:
        """Get Stripe webhook secret from environment or SSM."""
        env_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
        if env_secret and not env_secret.startswith('placeholder'):
            return env_secret
            
        return self.get_ssm_parameter('stripe/webhook-secret', decrypt=True)
    
    def get_nextauth_secret(self) -> Optional[str]:
        """Get NextAuth secret from environment or SSM."""
        env_secret = os.environ.get('NEXTAUTH_SECRET')
        if env_secret and not env_secret.startswith('placeholder'):
            return env_secret
            
        return self.get_ssm_parameter('nextauth/secret', decrypt=True)


# Global config instance
config = Config()