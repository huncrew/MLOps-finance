"""
DynamoDB service layer for Lambda functions.
"""
import boto3
from datetime import datetime
from typing import Dict, Any, Optional, List
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from .env import config
from .logging import get_logger

logger = get_logger(__name__)


class DynamoDBService:
    """Service class for DynamoDB operations."""
    
    def __init__(self, table_name: Optional[str] = None):
        """
        Initialize DynamoDB service.
        
        Args:
            table_name: DynamoDB table name (uses config if not provided)
        """
        self.table_name = table_name or config.get_database_table_name()
        self.dynamodb = boto3.resource('dynamodb', region_name=config.aws_region)
        self.table = self.dynamodb.Table(self.table_name)
        
        logger.info(f"Initialized DynamoDB service with table: {self.table_name}")
    
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            User data or None if not found
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'PROFILE'
                }
            )
            
            item = response.get('Item')
            if item:
                # Convert DynamoDB item to user format
                return self._dynamodb_to_user(item)
            
            return None
            
        except ClientError as e:
            logger.error(f"Error getting user {user_id}: {str(e)}")
            raise
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user.
        
        Args:
            user_data: User data dictionary
            
        Returns:
            Created user data
        """
        try:
            user_id = user_data.get('id')
            if not user_id:
                raise ValueError("User ID is required")
            
            now = datetime.utcnow().isoformat()
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': 'PROFILE',
                'id': user_id,
                'email': user_data.get('email', ''),
                'subscriptionStatus': user_data.get('subscriptionStatus', 'inactive'),
                'createdAt': now,
                'updatedAt': now,
                'gsi1pk': f'USER#{user_id}',
                'gsi1sk': 'PROFILE'
            }
            
            # Add any additional fields
            for key, value in user_data.items():
                if key not in ['id', 'email', 'subscriptionStatus']:
                    item[key] = value
            
            self.table.put_item(Item=item)
            
            logger.info(f"Created user: {user_id}")
            return self._dynamodb_to_user(item)
            
        except ClientError as e:
            logger.error(f"Error creating user: {str(e)}")
            raise
    
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user data.
        
        Args:
            user_id: User ID
            updates: Dictionary of fields to update
            
        Returns:
            Updated user data
        """
        try:
            # Build update expression
            update_expression = "SET updatedAt = :updated_at"
            expression_values = {':updated_at': datetime.utcnow().isoformat()}
            
            for key, value in updates.items():
                if key not in ['pk', 'sk', 'id', 'createdAt']:
                    update_expression += f", {key} = :{key}"
                    expression_values[f':{key}'] = value
            
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'PROFILE'
                },
                UpdateExpression=update_expression,
                ExpressionAttributeValues=expression_values,
                ReturnValues='ALL_NEW'
            )
            
            logger.info(f"Updated user: {user_id}")
            return self._dynamodb_to_user(response['Attributes'])
            
        except ClientError as e:
            logger.error(f"Error updating user {user_id}: {str(e)}")
            raise
    
    def get_subscription(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user subscription.
        
        Args:
            user_id: User ID
            
        Returns:
            Subscription data or None if not found
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'SUBSCRIPTION'
                }
            )
            
            item = response.get('Item')
            if item:
                return self._dynamodb_to_subscription(item)
            
            return None
            
        except ClientError as e:
            logger.error(f"Error getting subscription for user {user_id}: {str(e)}")
            raise
    
    def create_subscription(self, subscription_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new subscription.
        
        Args:
            subscription_data: Subscription data dictionary
            
        Returns:
            Created subscription data
        """
        try:
            user_id = subscription_data.get('userId')
            subscription_id = subscription_data.get('id')
            
            if not user_id or not subscription_id:
                raise ValueError("User ID and subscription ID are required")
            
            now = datetime.utcnow().isoformat()
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': 'SUBSCRIPTION',
                'id': subscription_id,
                'userId': user_id,
                'stripeSubscriptionId': subscription_data.get('stripeSubscriptionId', ''),
                'status': subscription_data.get('status', 'active'),
                'planId': subscription_data.get('planId', ''),
                'currentPeriodStart': subscription_data.get('currentPeriodStart', now),
                'currentPeriodEnd': subscription_data.get('currentPeriodEnd', now),
                'createdAt': now,
                'updatedAt': now,
                'gsi1pk': f'SUBSCRIPTION#{subscription_id}',
                'gsi1sk': f'USER#{user_id}'
            }
            
            self.table.put_item(Item=item)
            
            logger.info(f"Created subscription: {subscription_id} for user: {user_id}")
            return self._dynamodb_to_subscription(item)
            
        except ClientError as e:
            logger.error(f"Error creating subscription: {str(e)}")
            raise
    
    def store_ai_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Store AI session data.
        
        Args:
            session_data: AI session data
            
        Returns:
            Stored session data
        """
        try:
            user_id = session_data.get('userId')
            session_id = session_data.get('id')
            
            if not user_id or not session_id:
                raise ValueError("User ID and session ID are required")
            
            now = datetime.utcnow().isoformat()
            
            item = {
                'pk': f'USER#{user_id}',
                'sk': f'AI_SESSION#{session_id}',
                'id': session_id,
                'userId': user_id,
                'prompt': session_data.get('prompt', ''),
                'response': session_data.get('response', ''),
                'model': session_data.get('model', ''),
                'tokensUsed': session_data.get('tokens', 0),
                'createdAt': now,
                'gsi1pk': f'AI_SESSION#{session_id}',
                'gsi1sk': now  # For time-based sorting
            }
            
            self.table.put_item(Item=item)
            
            logger.info(f"Stored AI session: {session_id} for user: {user_id}")
            return self._dynamodb_to_ai_session(item)
            
        except ClientError as e:
            logger.error(f"Error storing AI session: {str(e)}")
            raise
    
    def get_ai_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get AI session history for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of sessions to return
            
        Returns:
            List of AI sessions
        """
        try:
            response = self.table.query(
                KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & 
                                     Key('sk').begins_with('AI_SESSION#'),
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
            
            sessions = []
            for item in response.get('Items', []):
                sessions.append(self._dynamodb_to_ai_session(item))
            
            logger.info(f"Retrieved {len(sessions)} AI sessions for user: {user_id}")
            return sessions
            
        except ClientError as e:
            logger.error(f"Error getting AI history for user {user_id}: {str(e)}")
            raise
    
    def _dynamodb_to_user(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert DynamoDB item to user format."""
        return {
            'id': item.get('id', ''),
            'email': item.get('email', ''),
            'subscriptionStatus': item.get('subscriptionStatus', 'inactive'),
            'createdAt': item.get('createdAt'),
            'updatedAt': item.get('updatedAt')
        }
    
    def _dynamodb_to_subscription(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert DynamoDB item to subscription format."""
        return {
            'id': item.get('id', ''),
            'userId': item.get('userId', ''),
            'stripeSubscriptionId': item.get('stripeSubscriptionId', ''),
            'status': item.get('status', ''),
            'planId': item.get('planId', ''),
            'currentPeriodStart': item.get('currentPeriodStart'),
            'currentPeriodEnd': item.get('currentPeriodEnd'),
            'createdAt': item.get('createdAt'),
            'updatedAt': item.get('updatedAt')
        }
    
    def _dynamodb_to_ai_session(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Convert DynamoDB item to AI session format."""
        return {
            'id': item.get('id', ''),
            'userId': item.get('userId', ''),
            'prompt': item.get('prompt', ''),
            'response': item.get('response', ''),
            'model': item.get('model', ''),
            'tokensUsed': item.get('tokensUsed', 0),
            'createdAt': item.get('createdAt')
        }


# Global service instance
dynamodb_service = DynamoDBService()