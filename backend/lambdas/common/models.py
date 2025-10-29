"""
Data models and validation for Lambda functions.
"""
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Dict, Any, Optional, List
from enum import Enum


class SubscriptionStatus(Enum):
    """Subscription status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"


class AIModel(Enum):
    """AI model enumeration."""
    CLAUDE_HAIKU = "anthropic.claude-3-haiku-20240307-v1:0"
    CLAUDE_SONNET = "anthropic.claude-3-sonnet-20240229-v1:0"
    CLAUDE_OPUS = "anthropic.claude-3-opus-20240229-v1:0"


@dataclass
class User:
    """User data model."""
    id: str
    email: str
    subscription_status: str = SubscriptionStatus.INACTIVE.value
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.id:
            raise ValueError("User ID is required")
        if not self.email:
            raise ValueError("User email is required")
        if not self._is_valid_email(self.email):
            raise ValueError("Invalid email format")
        if self.subscription_status not in [s.value for s in SubscriptionStatus]:
            raise ValueError(f"Invalid subscription status: {self.subscription_status}")
    
    @staticmethod
    def _is_valid_email(email: str) -> bool:
        """Basic email validation."""
        return "@" in email and "." in email.split("@")[-1]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        data = {
            'id': self.id,
            'email': self.email,
            'subscriptionStatus': self.subscription_status
        }
        
        if self.created_at:
            data['createdAt'] = self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        if self.updated_at:
            data['updatedAt'] = self.updated_at.isoformat() if isinstance(self.updated_at, datetime) else self.updated_at
            
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create User from dictionary."""
        created_at = data.get('createdAt')
        updated_at = data.get('updatedAt')
        
        # Parse datetime strings if needed
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except ValueError:
                created_at = None
        
        if isinstance(updated_at, str):
            try:
                updated_at = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            except ValueError:
                updated_at = None
        
        return cls(
            id=data['id'],
            email=data['email'],
            subscription_status=data.get('subscriptionStatus', SubscriptionStatus.INACTIVE.value),
            created_at=created_at,
            updated_at=updated_at
        )
    
    def has_active_subscription(self) -> bool:
        """Check if user has an active subscription."""
        return self.subscription_status == SubscriptionStatus.ACTIVE.value
    
    def has_mlops_access(self) -> bool:
        """Check if user has access to MLOps features."""
        # For now, all active subscribers have MLOps access
        # This can be extended later for tier-based access
        return self.has_active_subscription()
    
    def can_upload_to_kb(self) -> bool:
        """Check if user can upload documents to Knowledge Base."""
        # Only active subscribers can upload to KB
        # This can be extended for admin-only access
        return self.has_active_subscription()
    
    def can_analyze_documents(self) -> bool:
        """Check if user can analyze documents."""
        return self.has_active_subscription()
    
    def can_query_kb(self) -> bool:
        """Check if user can query the Knowledge Base."""
        return self.has_active_subscription()


@dataclass
class Subscription:
    """Subscription data model."""
    id: str
    user_id: str
    stripe_subscription_id: str
    status: str
    plan_id: str
    current_period_start: datetime
    current_period_end: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.id:
            raise ValueError("Subscription ID is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if not self.stripe_subscription_id:
            raise ValueError("Stripe subscription ID is required")
        if not self.plan_id:
            raise ValueError("Plan ID is required")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'stripeSubscriptionId': self.stripe_subscription_id,
            'status': self.status,
            'planId': self.plan_id,
            'currentPeriodStart': self.current_period_start.isoformat() if isinstance(self.current_period_start, datetime) else self.current_period_start,
            'currentPeriodEnd': self.current_period_end.isoformat() if isinstance(self.current_period_end, datetime) else self.current_period_end,
            'createdAt': self.created_at.isoformat() if self.created_at and isinstance(self.created_at, datetime) else self.created_at,
            'updatedAt': self.updated_at.isoformat() if self.updated_at and isinstance(self.updated_at, datetime) else self.updated_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Subscription':
        """Create Subscription from dictionary."""
        def parse_datetime(dt_str):
            if isinstance(dt_str, str):
                try:
                    return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                except ValueError:
                    return datetime.utcnow()
            return dt_str or datetime.utcnow()
        
        return cls(
            id=data['id'],
            user_id=data['userId'],
            stripe_subscription_id=data['stripeSubscriptionId'],
            status=data['status'],
            plan_id=data['planId'],
            current_period_start=parse_datetime(data['currentPeriodStart']),
            current_period_end=parse_datetime(data['currentPeriodEnd']),
            created_at=parse_datetime(data.get('createdAt')),
            updated_at=parse_datetime(data.get('updatedAt'))
        )
    
    def is_active(self) -> bool:
        """Check if subscription is active."""
        return self.status == SubscriptionStatus.ACTIVE.value and self.current_period_end > datetime.utcnow()


@dataclass
class AISession:
    """AI session data model."""
    id: str
    user_id: str
    prompt: str
    response: str
    model: str
    tokens_used: int
    created_at: datetime
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.id:
            raise ValueError("Session ID is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if not self.prompt:
            raise ValueError("Prompt is required")
        if not self.model:
            raise ValueError("Model is required")
        if self.tokens_used < 0:
            raise ValueError("Tokens used cannot be negative")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'prompt': self.prompt,
            'response': self.response,
            'model': self.model,
            'tokensUsed': self.tokens_used,
            'createdAt': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AISession':
        """Create AISession from dictionary."""
        created_at = data.get('createdAt')
        if isinstance(created_at, str):
            try:
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            except ValueError:
                created_at = datetime.utcnow()
        elif not created_at:
            created_at = datetime.utcnow()
        
        return cls(
            id=data['id'],
            user_id=data['userId'],
            prompt=data['prompt'],
            response=data['response'],
            model=data['model'],
            tokens_used=data.get('tokensUsed', 0),
            created_at=created_at
        )


@dataclass
class StripeCheckoutRequest:
    """Stripe checkout request model."""
    price_id: str
    user_id: Optional[str] = None
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.price_id:
            raise ValueError("Price ID is required")
        if not self.price_id.startswith(('price_', 'plan_')):
            raise ValueError("Invalid price ID format")
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'StripeCheckoutRequest':
        """Create from dictionary."""
        return cls(
            price_id=data['priceId'],
            user_id=data.get('userId')
        )


@dataclass
class AIGenerationRequest:
    """AI generation request model."""
    prompt: str
    model: str = AIModel.CLAUDE_HAIKU.value
    max_tokens: int = 1000
    temperature: float = 0.7
    user_id: Optional[str] = None
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.prompt:
            raise ValueError("Prompt is required")
        if len(self.prompt) > 10000:
            raise ValueError("Prompt too long (max 10000 characters)")
        if self.max_tokens < 1 or self.max_tokens > 4000:
            raise ValueError("Max tokens must be between 1 and 4000")
        if self.temperature < 0 or self.temperature > 1:
            raise ValueError("Temperature must be between 0 and 1")
        if self.model not in [m.value for m in AIModel]:
            raise ValueError(f"Invalid model: {self.model}")
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AIGenerationRequest':
        """Create from dictionary."""
        return cls(
            prompt=data['prompt'],
            model=data.get('model', AIModel.CLAUDE_HAIKU.value),
            max_tokens=data.get('maxTokens', 1000),
            temperature=data.get('temperature', 0.7),
            user_id=data.get('userId')
        )


# Validation functions
def validate_user_data(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate user data and return validation errors.
    
    Args:
        data: User data dictionary
        
    Returns:
        Dictionary of field errors (empty if valid)
    """
    errors = {}
    
    if not data.get('id'):
        errors['id'] = "User ID is required"
    
    email = data.get('email', '')
    if not email:
        errors['email'] = "Email is required"
    elif not User._is_valid_email(email):
        errors['email'] = "Invalid email format"
    
    subscription_status = data.get('subscriptionStatus')
    if subscription_status and subscription_status not in [s.value for s in SubscriptionStatus]:
        errors['subscriptionStatus'] = f"Invalid subscription status: {subscription_status}"
    
    return errors


def validate_ai_request(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate AI generation request and return validation errors.
    
    Args:
        data: AI request data dictionary
        
    Returns:
        Dictionary of field errors (empty if valid)
    """
    errors = {}
    
    prompt = data.get('prompt', '')
    if not prompt:
        errors['prompt'] = "Prompt is required"
    elif len(prompt) > 10000:
        errors['prompt'] = "Prompt too long (max 10000 characters)"
    
    max_tokens = data.get('maxTokens', 1000)
    if not isinstance(max_tokens, int) or max_tokens < 1 or max_tokens > 4000:
        errors['maxTokens'] = "Max tokens must be between 1 and 4000"
    
    temperature = data.get('temperature', 0.7)
    if not isinstance(temperature, (int, float)) or temperature < 0 or temperature > 1:
        errors['temperature'] = "Temperature must be between 0 and 1"
    
    model = data.get('model', AIModel.CLAUDE_HAIKU.value)
    if model not in [m.value for m in AIModel]:
        errors['model'] = f"Invalid model: {model}"
    
    return errors


# MLOps-specific enums and models

class DocumentCategory(Enum):
    """Document category enumeration for Knowledge Base."""
    POLICIES = "policies"
    REGULATIONS = "regulations"
    STANDARDS = "standards"
    PROCEDURES = "procedures"


class EmbeddingStatus(Enum):
    """Embedding processing status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalysisStatus(Enum):
    """Document analysis status enumeration."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class AnalysisType(Enum):
    """Document analysis type enumeration."""
    COMPLIANCE = "compliance"
    RISK = "risk"
    POLICY_MATCH = "policy_match"


class QueryType(Enum):
    """RAG query type enumeration."""
    GENERAL = "general"
    POLICY = "policy"
    REGULATION = "regulation"
    COMPLIANCE = "compliance"


@dataclass
class KBDocument:
    """Knowledge Base document data model."""
    id: str
    filename: str
    content_type: str
    size: int
    category: str
    upload_date: datetime
    processed_date: Optional[datetime] = None
    chunk_count: int = 0
    embedding_status: str = EmbeddingStatus.PENDING.value
    s3_key: str = ""
    metadata: Optional[Dict[str, Any]] = None
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.id:
            raise ValueError("Document ID is required")
        if not self.filename:
            raise ValueError("Filename is required")
        if not self.content_type:
            raise ValueError("Content type is required")
        if self.size <= 0:
            raise ValueError("File size must be positive")
        if self.category not in [c.value for c in DocumentCategory]:
            raise ValueError(f"Invalid category: {self.category}")
        if self.embedding_status not in [s.value for s in EmbeddingStatus]:
            raise ValueError(f"Invalid embedding status: {self.embedding_status}")
        if self.chunk_count < 0:
            raise ValueError("Chunk count cannot be negative")
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'id': self.id,
            'filename': self.filename,
            'contentType': self.content_type,
            'size': self.size,
            'category': self.category,
            'uploadDate': self.upload_date.isoformat() if isinstance(self.upload_date, datetime) else self.upload_date,
            'processedDate': self.processed_date.isoformat() if self.processed_date and isinstance(self.processed_date, datetime) else self.processed_date,
            'chunkCount': self.chunk_count,
            'embeddingStatus': self.embedding_status,
            's3Key': self.s3_key,
            'metadata': self.metadata or {}
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'KBDocument':
        """Create KBDocument from dictionary."""
        def parse_datetime(dt_str):
            if isinstance(dt_str, str):
                try:
                    return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                except ValueError:
                    return datetime.utcnow()
            return dt_str or datetime.utcnow()
        
        return cls(
            id=data['id'],
            filename=data['filename'],
            content_type=data['contentType'],
            size=data['size'],
            category=data['category'],
            upload_date=parse_datetime(data['uploadDate']),
            processed_date=parse_datetime(data.get('processedDate')) if data.get('processedDate') else None,
            chunk_count=data.get('chunkCount', 0),
            embedding_status=data.get('embeddingStatus', EmbeddingStatus.PENDING.value),
            s3_key=data.get('s3Key', ''),
            metadata=data.get('metadata', {})
        )


@dataclass
class DocumentChunk:
    """Document chunk data model for vector storage."""
    document_id: str
    chunk_id: str
    content: str
    embedding: List[float]
    metadata: Optional[Dict[str, Any]] = None
    page_number: Optional[int] = None
    section: Optional[str] = None
    start_char: int = 0
    end_char: int = 0
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.document_id:
            raise ValueError("Document ID is required")
        if not self.chunk_id:
            raise ValueError("Chunk ID is required")
        if not self.content:
            raise ValueError("Content is required")
        if not self.embedding or len(self.embedding) != 1536:
            raise ValueError("Embedding must be a list of 1536 floats")
        if self.start_char < 0 or self.end_char < 0:
            raise ValueError("Character positions cannot be negative")
        if self.end_char < self.start_char:
            raise ValueError("End character must be >= start character")
        if self.metadata is None:
            self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'documentId': self.document_id,
            'chunkId': self.chunk_id,
            'content': self.content,
            'embedding': self.embedding,
            'metadata': self.metadata or {},
            'pageNumber': self.page_number,
            'section': self.section,
            'startChar': self.start_char,
            'endChar': self.end_char
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DocumentChunk':
        """Create DocumentChunk from dictionary."""
        return cls(
            document_id=data['documentId'],
            chunk_id=data['chunkId'],
            content=data['content'],
            embedding=data['embedding'],
            metadata=data.get('metadata', {}),
            page_number=data.get('pageNumber'),
            section=data.get('section'),
            start_char=data.get('startChar', 0),
            end_char=data.get('endChar', 0)
        )


@dataclass
class AnalysisRequest:
    """Document analysis request data model."""
    user_id: str
    document_id: str
    filename: str
    analysis_type: str = AnalysisType.COMPLIANCE.value
    priority: str = "normal"
    s3_key: Optional[str] = None
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.user_id:
            raise ValueError("User ID is required")
        if not self.document_id:
            raise ValueError("Document ID is required")
        if not self.filename:
            raise ValueError("Filename is required")
        if self.analysis_type not in [t.value for t in AnalysisType]:
            raise ValueError(f"Invalid analysis type: {self.analysis_type}")
        if self.priority not in ["low", "normal", "high"]:
            raise ValueError(f"Invalid priority: {self.priority}")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        data: Dict[str, Any] = {
            'userId': self.user_id,
            'documentId': self.document_id,
            'filename': self.filename,
            'analysisType': self.analysis_type,
            'priority': self.priority
        }
        if self.s3_key:
            data['s3Key'] = self.s3_key
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AnalysisRequest':
        """Create AnalysisRequest from dictionary."""
        return cls(
            user_id=data['userId'],
            document_id=data['documentId'],
            filename=data['filename'],
            analysis_type=data.get('analysisType', AnalysisType.COMPLIANCE.value),
            priority=data.get('priority', 'normal'),
            s3_key=data.get('s3Key')
        )


@dataclass
class ComplianceAnalysis:
    """Compliance analysis result data model."""
    document_id: str
    user_id: str
    analysis_date: datetime
    overall_score: float
    policy_matches: List[Dict[str, Any]]
    compliance_gaps: List[Dict[str, Any]]
    risk_flags: List[Dict[str, Any]]
    recommendations: List[str]
    confidence_score: float
    processing_time_ms: int
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.document_id:
            raise ValueError("Document ID is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if not (0.0 <= self.overall_score <= 1.0):
            raise ValueError("Overall score must be between 0.0 and 1.0")
        if not (0.0 <= self.confidence_score <= 1.0):
            raise ValueError("Confidence score must be between 0.0 and 1.0")
        if self.processing_time_ms < 0:
            raise ValueError("Processing time cannot be negative")
        if not isinstance(self.policy_matches, list):
            raise ValueError("Policy matches must be a list")
        if not isinstance(self.compliance_gaps, list):
            raise ValueError("Compliance gaps must be a list")
        if not isinstance(self.risk_flags, list):
            raise ValueError("Risk flags must be a list")
        if not isinstance(self.recommendations, list):
            raise ValueError("Recommendations must be a list")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'documentId': self.document_id,
            'userId': self.user_id,
            'analysisDate': self.analysis_date.isoformat() if isinstance(self.analysis_date, datetime) else self.analysis_date,
            'overallScore': self.overall_score,
            'policyMatches': self.policy_matches,
            'complianceGaps': self.compliance_gaps,
            'riskFlags': self.risk_flags,
            'recommendations': self.recommendations,
            'confidenceScore': self.confidence_score,
            'processingTimeMs': self.processing_time_ms
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ComplianceAnalysis':
        """Create ComplianceAnalysis from dictionary."""
        def parse_datetime(dt_str):
            if isinstance(dt_str, str):
                try:
                    return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                except ValueError:
                    return datetime.utcnow()
            return dt_str or datetime.utcnow()
        
        return cls(
            document_id=data['documentId'],
            user_id=data['userId'],
            analysis_date=parse_datetime(data['analysisDate']),
            overall_score=data['overallScore'],
            policy_matches=data.get('policyMatches', []),
            compliance_gaps=data.get('complianceGaps', []),
            risk_flags=data.get('riskFlags', []),
            recommendations=data.get('recommendations', []),
            confidence_score=data['confidenceScore'],
            processing_time_ms=data['processingTimeMs']
        )


@dataclass
class RAGQuery:
    """RAG query data model."""
    query_id: str
    user_id: str
    query_text: str
    query_type: str = QueryType.GENERAL.value
    max_results: int = 5
    similarity_threshold: float = 0.7
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.query_id:
            raise ValueError("Query ID is required")
        if not self.user_id:
            raise ValueError("User ID is required")
        if not self.query_text:
            raise ValueError("Query text is required")
        if len(self.query_text) > 5000:
            raise ValueError("Query text too long (max 5000 characters)")
        if self.query_type not in [t.value for t in QueryType]:
            raise ValueError(f"Invalid query type: {self.query_type}")
        if not (1 <= self.max_results <= 20):
            raise ValueError("Max results must be between 1 and 20")
        if not (0.0 <= self.similarity_threshold <= 1.0):
            raise ValueError("Similarity threshold must be between 0.0 and 1.0")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'queryId': self.query_id,
            'userId': self.user_id,
            'queryText': self.query_text,
            'queryType': self.query_type,
            'maxResults': self.max_results,
            'similarityThreshold': self.similarity_threshold
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RAGQuery':
        """Create RAGQuery from dictionary."""
        return cls(
            query_id=data['queryId'],
            user_id=data['userId'],
            query_text=data['queryText'],
            query_type=data.get('queryType', QueryType.GENERAL.value),
            max_results=data.get('maxResults', 5),
            similarity_threshold=data.get('similarityThreshold', 0.7)
        )


@dataclass
class RAGResponse:
    """RAG response data model."""
    query_id: str
    response_text: str
    sources: List[Dict[str, Any]]
    confidence_score: float
    processing_time_ms: int
    token_usage: Dict[str, int]
    
    def __post_init__(self):
        """Post-initialization validation."""
        if not self.query_id:
            raise ValueError("Query ID is required")
        if not self.response_text:
            raise ValueError("Response text is required")
        if not (0.0 <= self.confidence_score <= 1.0):
            raise ValueError("Confidence score must be between 0.0 and 1.0")
        if self.processing_time_ms < 0:
            raise ValueError("Processing time cannot be negative")
        if not isinstance(self.sources, list):
            raise ValueError("Sources must be a list")
        if not isinstance(self.token_usage, dict):
            raise ValueError("Token usage must be a dictionary")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        return {
            'queryId': self.query_id,
            'responseText': self.response_text,
            'sources': self.sources,
            'confidenceScore': self.confidence_score,
            'processingTimeMs': self.processing_time_ms,
            'tokenUsage': self.token_usage
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RAGResponse':
        """Create RAGResponse from dictionary."""
        return cls(
            query_id=data['queryId'],
            response_text=data['responseText'],
            sources=data.get('sources', []),
            confidence_score=data['confidenceScore'],
            processing_time_ms=data['processingTimeMs'],
            token_usage=data.get('tokenUsage', {})
        )


# DynamoDB record models for MLOps

@dataclass
class KBDocumentRecord:
    """Knowledge Base document record for DynamoDB."""
    pk: str  # "KB_DOC#{document_id}"
    sk: str  # "METADATA"
    gsi1pk: str  # "KB_CATEGORY#{category}"
    gsi1sk: str  # "UPLOAD_DATE#{upload_date}"
    document_id: str
    filename: str
    category: str
    content_type: str
    size: int
    upload_date: datetime
    processed_date: Optional[datetime]
    chunk_count: int
    embedding_status: str
    s3_key: str
    metadata: Dict[str, Any]
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Convert to DynamoDB item format."""
        item = {
            'pk': self.pk,
            'sk': self.sk,
            'gsi1pk': self.gsi1pk,
            'gsi1sk': self.gsi1sk,
            'documentId': self.document_id,
            'filename': self.filename,
            'category': self.category,
            'contentType': self.content_type,
            'size': self.size,
            'uploadDate': self.upload_date.isoformat() if isinstance(self.upload_date, datetime) else self.upload_date,
            'chunkCount': self.chunk_count,
            'embeddingStatus': self.embedding_status,
            's3Key': self.s3_key,
            'metadata': self.metadata
        }
        
        if self.processed_date:
            item['processedDate'] = self.processed_date.isoformat() if isinstance(self.processed_date, datetime) else self.processed_date
        
        return item


@dataclass
class AnalysisRecord:
    """Document analysis record for DynamoDB."""
    pk: str  # "USER#{user_id}"
    sk: str  # "ANALYSIS#{analysis_id}"
    gsi1pk: str  # "ANALYSIS_STATUS#{status}"
    gsi1sk: str  # "CREATED_DATE#{created_date}"
    analysis_id: str
    user_id: str
    document_id: str
    filename: str
    analysis_type: str
    status: str
    created_date: datetime
    completed_date: Optional[datetime]
    results: Optional[Dict[str, Any]]
    error_message: Optional[str]
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Convert to DynamoDB item format."""
        item = {
            'pk': self.pk,
            'sk': self.sk,
            'gsi1pk': self.gsi1pk,
            'gsi1sk': self.gsi1sk,
            'analysisId': self.analysis_id,
            'userId': self.user_id,
            'documentId': self.document_id,
            'filename': self.filename,
            'analysisType': self.analysis_type,
            'status': self.status,
            'createdDate': self.created_date.isoformat() if isinstance(self.created_date, datetime) else self.created_date
        }
        
        if self.completed_date:
            item['completedDate'] = self.completed_date.isoformat() if isinstance(self.completed_date, datetime) else self.completed_date
        if self.results:
            item['results'] = self.results
        if self.error_message:
            item['errorMessage'] = self.error_message
        
        return item


@dataclass
class QueryRecord:
    """RAG query record for DynamoDB."""
    pk: str  # "USER#{user_id}"
    sk: str  # "QUERY#{query_id}"
    gsi1pk: str  # "QUERY_DATE#{date}"
    gsi1sk: str  # "USER#{user_id}"
    query_id: str
    user_id: str
    query_text: str
    query_type: str
    response_text: str
    sources: List[Dict[str, Any]]
    confidence_score: float
    created_date: datetime
    token_usage: Dict[str, int]
    
    def to_dynamodb_item(self) -> Dict[str, Any]:
        """Convert to DynamoDB item format."""
        return {
            'pk': self.pk,
            'sk': self.sk,
            'gsi1pk': self.gsi1pk,
            'gsi1sk': self.gsi1sk,
            'queryId': self.query_id,
            'userId': self.user_id,
            'queryText': self.query_text,
            'queryType': self.query_type,
            'responseText': self.response_text,
            'sources': self.sources,
            'confidenceScore': self.confidence_score,
            'createdDate': self.created_date.isoformat() if isinstance(self.created_date, datetime) else self.created_date,
            'tokenUsage': self.token_usage
        }


# MLOps validation functions

def validate_kb_document_data(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate KB document data and return validation errors.
    
    Args:
        data: KB document data dictionary
        
    Returns:
        Dictionary of field errors (empty if valid)
    """
    errors = {}
    
    if not data.get('filename'):
        errors['filename'] = "Filename is required"
    
    if not data.get('contentType'):
        errors['contentType'] = "Content type is required"
    
    size = data.get('size', 0)
    if not isinstance(size, int) or size <= 0:
        errors['size'] = "Size must be a positive integer"
    elif size > 50 * 1024 * 1024:  # 50MB limit
        errors['size'] = "File too large (max 50MB)"
    
    category = data.get('category')
    if category and category not in [c.value for c in DocumentCategory]:
        errors['category'] = f"Invalid category: {category}"
    
    return errors


def validate_analysis_request_data(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate analysis request data and return validation errors.
    
    Args:
        data: Analysis request data dictionary
        
    Returns:
        Dictionary of field errors (empty if valid)
    """
    errors = {}
    
    if not data.get('userId'):
        errors['userId'] = "User ID is required"
    
    if not data.get('documentId'):
        errors['documentId'] = "Document ID is required"
    
    if not data.get('filename'):
        errors['filename'] = "Filename is required"
    
    analysis_type = data.get('analysisType')
    if analysis_type and analysis_type not in [t.value for t in AnalysisType]:
        errors['analysisType'] = f"Invalid analysis type: {analysis_type}"
    
    priority = data.get('priority', 'normal')
    if priority not in ['low', 'normal', 'high']:
        errors['priority'] = f"Invalid priority: {priority}"
    
    return errors


def validate_rag_query_data(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Validate RAG query data and return validation errors.
    
    Args:
        data: RAG query data dictionary
        
    Returns:
        Dictionary of field errors (empty if valid)
    """
    errors = {}
    
    query_text = data.get('queryText', '')
    if not query_text:
        errors['queryText'] = "Query text is required"
    elif len(query_text) > 5000:
        errors['queryText'] = "Query text too long (max 5000 characters)"
    
    query_type = data.get('queryType')
    if query_type and query_type not in [t.value for t in QueryType]:
        errors['queryType'] = f"Invalid query type: {query_type}"
    
    max_results = data.get('maxResults', 5)
    if not isinstance(max_results, int) or not (1 <= max_results <= 20):
        errors['maxResults'] = "Max results must be between 1 and 20"
    
    similarity_threshold = data.get('similarityThreshold', 0.7)
    if not isinstance(similarity_threshold, (int, float)) or not (0.0 <= similarity_threshold <= 1.0):
        errors['similarityThreshold'] = "Similarity threshold must be between 0.0 and 1.0"
    
    return errors
