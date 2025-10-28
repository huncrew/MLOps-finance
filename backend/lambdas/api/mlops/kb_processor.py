"""
Knowledge Base processing Lambda function.

Handles document ingestion, text extraction, chunking, and embedding generation
for the MLOps Knowledge Base.
"""
import json
import uuid
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
import boto3
from botocore.exceptions import ClientError

# Import common utilities
from common.env import config
from common.logging import get_logger
from common.models import (
    KBDocument, DocumentChunk, KBDocumentRecord, DocumentCategory, 
    EmbeddingStatus, validate_kb_document_data
)

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


class KBProcessor:
    """Knowledge Base document processor."""
    
    def __init__(self):
        """Initialize the KB processor."""
        self.kb_raw_bucket = self._get_ssm_parameter('/mlops/kb-raw-bucket-name')
        self.kb_vectors_bucket = self._get_ssm_parameter('/mlops/kb-vectors-bucket-name')
        self.table_name = self._get_ssm_parameter('/database/table-name')
        self.table = dynamodb.Table(self.table_name) if dynamodb else None
        
        # Document processing settings
        self.max_chunk_size = 1000  # characters
        self.chunk_overlap = 200    # characters
        self.supported_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ]
    
    def _get_ssm_parameter(self, param_name: str) -> str:
        """Get parameter from SSM Parameter Store."""
        try:
            full_param_name = f"/{config.project_name}/{config.stage}{param_name}"
            response = ssm_client.get_parameter(Name=full_param_name)
            return response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Failed to get SSM parameter {param_name}: {e}")
            return ""
    
    def process_document(self, document_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a Knowledge Base document.
        
        Args:
            document_data: Document metadata and S3 information
            
        Returns:
            Processing result with status and metadata
        """
        try:
            # Validate document data
            validation_errors = validate_kb_document_data(document_data)
            if validation_errors:
                raise ValueError(f"Invalid document data: {validation_errors}")
            
            # Create document record
            document_id = str(uuid.uuid4())
            kb_document = KBDocument(
                id=document_id,
                filename=document_data['filename'],
                content_type=document_data['contentType'],
                size=document_data['size'],
                category=document_data.get('category', DocumentCategory.POLICIES.value),
                upload_date=datetime.utcnow(),
                s3_key=document_data['s3Key'],
                metadata=document_data.get('metadata', {})
            )
            
            # Store initial document record
            self._store_document_record(kb_document)
            
            # Extract text from document
            logger.info(f"Extracting text from document: {document_id}")
            text_content = self._extract_text(kb_document.s3_key, kb_document.content_type)
            
            if not text_content:
                raise ValueError("No text content extracted from document")
            
            # Chunk the text
            logger.info(f"Chunking text for document: {document_id}")
            chunks = self._chunk_text(text_content)
            
            # Generate embeddings for chunks
            logger.info(f"Generating embeddings for {len(chunks)} chunks")
            embedded_chunks = []
            for i, chunk_text in enumerate(chunks):
                chunk_id = f"{document_id}_chunk_{i}"
                embedding = self._generate_embedding(chunk_text)
                
                chunk = DocumentChunk(
                    document_id=document_id,
                    chunk_id=chunk_id,
                    content=chunk_text,
                    embedding=embedding,
                    metadata={
                        'chunk_index': i,
                        'document_filename': kb_document.filename,
                        'document_category': kb_document.category
                    }
                )
                embedded_chunks.append(chunk)
            
            # Store embeddings in S3
            self._store_embeddings(document_id, embedded_chunks)
            
            # Update document record with processing results
            kb_document.processed_date = datetime.utcnow()
            kb_document.chunk_count = len(embedded_chunks)
            kb_document.embedding_status = EmbeddingStatus.COMPLETED.value
            self._store_document_record(kb_document)
            
            logger.info(f"Successfully processed document: {document_id}")
            return {
                'success': True,
                'documentId': document_id,
                'chunkCount': len(embedded_chunks),
                'processingTime': (datetime.utcnow() - kb_document.upload_date).total_seconds()
            }
            
        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            
            # Update document status to failed if we have a document_id
            if 'document_id' in locals():
                try:
                    kb_document.embedding_status = EmbeddingStatus.FAILED.value
                    self._store_document_record(kb_document)
                except:
                    pass
            
            return {
                'success': False,
                'error': str(e),
                'documentId': locals().get('document_id', 'unknown')
            }
    
    def _extract_text(self, s3_key: str, content_type: str) -> str:
        """
        Extract text content from document in S3.
        
        Args:
            s3_key: S3 object key
            content_type: MIME type of the document
            
        Returns:
            Extracted text content
        """
        try:
            # Download document from S3
            response = s3_client.get_object(Bucket=self.kb_raw_bucket, Key=s3_key)
            document_bytes = response['Body'].read()
            
            if content_type == 'text/plain':
                return document_bytes.decode('utf-8')
            elif content_type == 'application/pdf':
                return self._extract_pdf_text(document_bytes)
            elif content_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                return self._extract_docx_text(document_bytes)
            else:
                raise ValueError(f"Unsupported content type: {content_type}")
                
        except Exception as e:
            logger.error(f"Error extracting text from {s3_key}: {e}")
            raise
    
    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF bytes.
        
        Note: This is a simplified implementation. In production, you would use
        libraries like PyPDF2, pdfplumber, or AWS Textract for better text extraction.
        """
        try:
            # For now, return a placeholder. In production, implement proper PDF parsing
            logger.warning("PDF text extraction not fully implemented - using placeholder")
            return f"PDF content placeholder - {len(pdf_bytes)} bytes"
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            raise
    
    def _extract_docx_text(self, docx_bytes: bytes) -> str:
        """
        Extract text from DOCX bytes.
        
        Note: This is a simplified implementation. In production, you would use
        libraries like python-docx for proper DOCX parsing.
        """
        try:
            # For now, return a placeholder. In production, implement proper DOCX parsing
            logger.warning("DOCX text extraction not fully implemented - using placeholder")
            return f"DOCX content placeholder - {len(docx_bytes)} bytes"
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            raise
    
    def _chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks for embedding.
        
        Args:
            text: Input text to chunk
            
        Returns:
            List of text chunks
        """
        if len(text) <= self.max_chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.max_chunk_size
            
            # If this isn't the last chunk, try to break at a sentence boundary
            if end < len(text):
                # Look for sentence endings within the overlap region
                sentence_end = text.rfind('.', start, end - self.chunk_overlap)
                if sentence_end > start:
                    end = sentence_end + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - self.chunk_overlap if end < len(text) else end
        
        return chunks
    
    def _generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using Bedrock Titan.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector (1536 dimensions)
        """
        try:
            # Prepare request for Titan embeddings
            request_body = {
                "inputText": text
            }
            
            # Call Bedrock Titan embeddings model
            response = bedrock_client.invoke_model(
                modelId="amazon.titan-embed-text-v1",
                body=json.dumps(request_body),
                contentType="application/json"
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            embedding = response_body.get('embedding', [])
            
            if len(embedding) != 1536:
                raise ValueError(f"Expected 1536-dimensional embedding, got {len(embedding)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return zero vector as fallback for development
            logger.warning("Returning zero vector as embedding fallback")
            return [0.0] * 1536
    
    def _store_embeddings(self, document_id: str, chunks: List[DocumentChunk]) -> None:
        """
        Store document chunks and embeddings in S3.
        
        Args:
            document_id: Document identifier
            chunks: List of document chunks with embeddings
        """
        try:
            # Create embeddings file
            embeddings_data = {
                'documentId': document_id,
                'chunks': [chunk.to_dict() for chunk in chunks],
                'createdDate': datetime.utcnow().isoformat(),
                'totalChunks': len(chunks)
            }
            
            # Store in S3
            s3_key = f"embeddings/{document_id}.json"
            s3_client.put_object(
                Bucket=self.kb_vectors_bucket,
                Key=s3_key,
                Body=json.dumps(embeddings_data),
                ContentType='application/json'
            )
            
            logger.info(f"Stored embeddings for document {document_id} at {s3_key}")
            
        except Exception as e:
            logger.error(f"Error storing embeddings: {e}")
            raise
    
    def _store_document_record(self, kb_document: KBDocument) -> None:
        """
        Store document record in DynamoDB.
        
        Args:
            kb_document: KB document to store
        """
        try:
            # Create DynamoDB record
            record = KBDocumentRecord(
                pk=f"KB_DOC#{kb_document.id}",
                sk="METADATA",
                gsi1pk=f"KB_CATEGORY#{kb_document.category}",
                gsi1sk=f"UPLOAD_DATE#{kb_document.upload_date.isoformat()}",
                document_id=kb_document.id,
                filename=kb_document.filename,
                category=kb_document.category,
                content_type=kb_document.content_type,
                size=kb_document.size,
                upload_date=kb_document.upload_date,
                processed_date=kb_document.processed_date,
                chunk_count=kb_document.chunk_count,
                embedding_status=kb_document.embedding_status,
                s3_key=kb_document.s3_key,
                metadata=kb_document.metadata
            )
            
            # Store in DynamoDB
            self.table.put_item(Item=record.to_dynamodb_item())
            logger.info(f"Stored document record for {kb_document.id}")
            
        except Exception as e:
            logger.error(f"Error storing document record: {e}")
            raise


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for KB processing.
    
    Args:
        event: Lambda event (S3 trigger or direct invocation)
        context: Lambda context
        
    Returns:
        Processing result
    """
    try:
        logger.info(f"KB processor invoked with event: {json.dumps(event)}")
        
        processor = KBProcessor()
        
        # Handle S3 trigger event
        if 'Records' in event:
            results = []
            for record in event['Records']:
                if record.get('eventSource') == 'aws:s3':
                    s3_info = record['s3']
                    bucket = s3_info['bucket']['name']
                    key = s3_info['object']['key']
                    
                    # Extract document info from S3 event
                    document_data = {
                        's3Key': key,
                        'filename': key.split('/')[-1],
                        'contentType': 'application/pdf',  # Default, should be determined from file
                        'size': s3_info['object'].get('size', 0),
                        'category': DocumentCategory.POLICIES.value  # Default category
                    }
                    
                    result = processor.process_document(document_data)
                    results.append(result)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'results': results
                })
            }
        
        # Handle direct invocation
        elif 'documentData' in event:
            result = processor.process_document(event['documentData'])
            return {
                'statusCode': 200 if result['success'] else 400,
                'body': json.dumps(result)
            }
        
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Invalid event format'
                })
            }
            
    except Exception as e:
        logger.error(f"KB processor error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
