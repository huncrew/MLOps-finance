"""
Document analysis Lambda function.

Processes user-uploaded documents and performs compliance analysis
against the Knowledge Base using vector similarity and Claude analysis.
"""
import json
import uuid
import hashlib
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple
import boto3
from botocore.exceptions import ClientError
import math

# Import common utilities
from common.env import config
from common.logging import get_logger
from common.models import (
    AnalysisRequest, ComplianceAnalysis, AnalysisRecord, DocumentChunk,
    AnalysisStatus, AnalysisType, AIModel, validate_analysis_request_data
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


class DocumentAnalyzer:
    """Document analysis service."""
    
    def __init__(self):
        """Initialize the document analyzer."""
        self.uploads_raw_bucket = self._get_ssm_parameter('/mlops/uploads-raw-bucket-name')
        self.kb_vectors_bucket = self._get_ssm_parameter('/mlops/kb-vectors-bucket-name')
        self.analysis_reports_bucket = self._get_ssm_parameter('/mlops/analysis-reports-bucket-name')
        self.table_name = self._get_ssm_parameter('/database/table-name')
        self.table = dynamodb.Table(self.table_name) if dynamodb else None
        
        # Analysis settings
        self.max_chunk_size = 1000
        self.chunk_overlap = 200
        self.similarity_threshold = 0.7
        self.max_kb_matches = 10
        
    def _get_ssm_parameter(self, param_name: str) -> str:
        """Get parameter from SSM Parameter Store."""
        try:
            full_param_name = f"/{config.project_name}/{config.stage}{param_name}"
            response = ssm_client.get_parameter(Name=full_param_name)
            return response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Failed to get SSM parameter {param_name}: {e}")
            return ""
    
    def analyze_document(self, analysis_request: AnalysisRequest) -> Dict[str, Any]:
        """
        Analyze a user-uploaded document against the Knowledge Base.
        
        Args:
            analysis_request: Analysis request with document information
            
        Returns:
            Analysis result with compliance findings
        """
        analysis_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        try:
            logger.info(f"Starting analysis {analysis_id} for document {analysis_request.document_id}")
            
            # Create initial analysis record
            analysis_record = self._create_analysis_record(analysis_id, analysis_request, start_time)
            self._store_analysis_record(analysis_record)
            
            # Extract text from uploaded document
            s3_key = analysis_request.s3_key
            if not s3_key:
                s3_key = f"documents/{analysis_request.document_id}_{analysis_request.filename}"
            document_text = self._extract_document_text(s3_key, analysis_request.filename)
            
            if not document_text:
                raise ValueError("No text content extracted from document")
            
            # Chunk the document text
            document_chunks = self._chunk_text(document_text)
            logger.info(f"Created {len(document_chunks)} chunks from document")
            
            # Generate embeddings for document chunks
            document_embeddings = []
            for i, chunk_text in enumerate(document_chunks):
                embedding = self._generate_embedding(chunk_text)
                document_embeddings.append({
                    'chunk_index': i,
                    'text': chunk_text,
                    'embedding': embedding
                })
            
            # Search Knowledge Base for similar content
            kb_matches = self._search_knowledge_base(document_embeddings)
            logger.info(f"Found {len(kb_matches)} KB matches above threshold")
            
            # Perform compliance analysis using Claude
            compliance_analysis = self._perform_compliance_analysis(
                analysis_request,
                document_text,
                document_chunks,
                kb_matches
            )
            
            # Calculate processing time
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            compliance_analysis.processing_time_ms = processing_time_ms
            
            # Store analysis results
            self._store_analysis_results(analysis_id, compliance_analysis)
            
            # Update analysis record to completed
            analysis_record.status = AnalysisStatus.COMPLETED.value
            analysis_record.completed_date = datetime.utcnow()
            analysis_record.results = compliance_analysis.to_dict()
            analysis_record.gsi1pk = f"ANALYSIS_STATUS#{analysis_record.status}"
            self._store_analysis_record(analysis_record)
            
            logger.info(f"Completed analysis {analysis_id} in {processing_time_ms}ms")
            
            return {
                'success': True,
                'analysisId': analysis_id,
                'results': compliance_analysis.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Error in document analysis {analysis_id}: {str(e)}")
            
            # Update analysis record to failed
            try:
                if 'analysis_record' in locals():
                    analysis_record.status = AnalysisStatus.FAILED.value
                    analysis_record.error_message = str(e)
                    analysis_record.completed_date = datetime.utcnow()
                    analysis_record.gsi1pk = f"ANALYSIS_STATUS#{analysis_record.status}"
                    self._store_analysis_record(analysis_record)
            except:
                pass
            
            return {
                'success': False,
                'analysisId': analysis_id,
                'error': str(e)
            }
    
    def _create_analysis_record(self, analysis_id: str, request: AnalysisRequest, 
                              created_date: datetime) -> AnalysisRecord:
        """Create initial analysis record."""
        return AnalysisRecord(
            pk=f"USER#{request.user_id}",
            sk=f"ANALYSIS#{analysis_id}",
            gsi1pk=f"ANALYSIS_STATUS#{AnalysisStatus.PROCESSING.value}",
            gsi1sk=f"CREATED_DATE#{created_date.isoformat()}",
            analysis_id=analysis_id,
            user_id=request.user_id,
            document_id=request.document_id,
            filename=request.filename,
            analysis_type=request.analysis_type,
            status=AnalysisStatus.PROCESSING.value,
            created_date=created_date,
            completed_date=None,
            results=None,
            error_message=None
        )
    
    def _extract_document_text(self, s3_key: str, filename: str) -> str:
        """
        Extract text from uploaded document.
        
        Args:
            document_id: Document identifier
            filename: Original filename
            
        Returns:
            Extracted text content
        """
        try:
            # Download document from S3
            response = s3_client.get_object(Bucket=self.uploads_raw_bucket, Key=s3_key)
            document_bytes = response['Body'].read()
            
            # Determine content type from filename
            if filename.lower().endswith('.txt'):
                return document_bytes.decode('utf-8')
            elif filename.lower().endswith('.pdf'):
                return self._extract_pdf_text(document_bytes)
            elif filename.lower().endswith(('.doc', '.docx')):
                return self._extract_docx_text(document_bytes)
            else:
                # Try to decode as text
                try:
                    return document_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    raise ValueError(f"Unsupported file type: {filename}")
                    
        except Exception as e:
            logger.error(f"Error extracting text from {s3_key}: {e}")
            raise
    
    def _extract_pdf_text(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes (placeholder implementation)."""
        logger.warning("PDF text extraction not fully implemented - using placeholder")
        return f"PDF document content - {len(pdf_bytes)} bytes. This would contain the actual extracted text in production."
    
    def _extract_docx_text(self, docx_bytes: bytes) -> str:
        """Extract text from DOCX bytes (placeholder implementation)."""
        logger.warning("DOCX text extraction not fully implemented - using placeholder")
        return f"DOCX document content - {len(docx_bytes)} bytes. This would contain the actual extracted text in production."
    
    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for analysis."""
        if len(text) <= self.max_chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.max_chunk_size
            
            # Try to break at sentence boundary
            if end < len(text):
                sentence_end = text.rfind('.', start, end - self.chunk_overlap)
                if sentence_end > start:
                    end = sentence_end + 1
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - self.chunk_overlap if end < len(text) else end
        
        return chunks
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding using Bedrock Titan."""
        try:
            request_body = {"inputText": text}
            
            response = bedrock_client.invoke_model(
                modelId="amazon.titan-embed-text-v1",
                body=json.dumps(request_body),
                contentType="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            embedding = response_body.get('embedding', [])
            
            if len(embedding) != 1536:
                raise ValueError(f"Expected 1536-dimensional embedding, got {len(embedding)}")
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 1536
    
    def _search_knowledge_base(self, document_embeddings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Search Knowledge Base for similar content.
        
        Args:
            document_embeddings: List of document chunk embeddings
            
        Returns:
            List of matching KB chunks with similarity scores
        """
        try:
            matches = []
            
            # List all KB embedding files
            response = s3_client.list_objects_v2(
                Bucket=self.kb_vectors_bucket,
                Prefix="embeddings/"
            )
            
            if 'Contents' not in response:
                logger.warning("No KB embeddings found")
                return matches
            
            # Process each KB document
            for obj in response['Contents']:
                if not obj['Key'].endswith('.json'):
                    continue
                
                try:
                    # Load KB document embeddings
                    kb_response = s3_client.get_object(Bucket=self.kb_vectors_bucket, Key=obj['Key'])
                    kb_data = json.loads(kb_response['Body'].read())
                    
                    # Compare each document chunk with KB chunks
                    for doc_chunk in document_embeddings:
                        for kb_chunk in kb_data.get('chunks', []):
                            similarity = self._calculate_cosine_similarity(
                                doc_chunk['embedding'], 
                                kb_chunk['embedding']
                            )
                            
                            if similarity >= self.similarity_threshold:
                                matches.append({
                                    'kb_document_id': kb_data['documentId'],
                                    'kb_chunk_id': kb_chunk['chunkId'],
                                    'kb_content': kb_chunk['content'],
                                    'kb_metadata': kb_chunk.get('metadata', {}),
                                    'doc_chunk_index': doc_chunk['chunk_index'],
                                    'doc_content': doc_chunk['text'],
                                    'similarity_score': similarity
                                })
                
                except Exception as e:
                    logger.warning(f"Error processing KB document {obj['Key']}: {e}")
                    continue
            
            # Sort by similarity score and limit results
            matches.sort(key=lambda x: x['similarity_score'], reverse=True)
            return matches[:self.max_kb_matches]
            
        except Exception as e:
            logger.error(f"Error searching knowledge base: {e}")
            return []
    
    def _calculate_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        try:
            # Use pure Python math to avoid native dependency packaging issues
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            norm_a = math.sqrt(sum(a * a for a in vec1))
            norm_b = math.sqrt(sum(b * b for b in vec2))
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
            
            similarity = dot_product / (norm_a * norm_b)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0
    
    def _perform_compliance_analysis(
        self,
        analysis_request: AnalysisRequest,
        document_text: str,
        document_chunks: List[str],
        kb_matches: List[Dict[str, Any]]
    ) -> ComplianceAnalysis:
        """
        Perform compliance analysis using Claude.
        
        Args:
            document_text: Full document text
            document_chunks: Document text chunks
            kb_matches: Matching KB content
            analysis_type: Type of analysis to perform
            
        Returns:
            Compliance analysis results
        """
        try:
            # Prepare context from KB matches
            kb_context = self._prepare_kb_context(kb_matches)
            
            # Create analysis prompt
            prompt = self._create_analysis_prompt(document_text, kb_context, analysis_request.analysis_type)
            
            # Call Claude for analysis
            claude_response = self._call_claude_analysis(prompt)
            
            # Parse Claude response into structured format
            analysis_results = self._parse_claude_response(claude_response, kb_matches)
            
            return ComplianceAnalysis(
                document_id=analysis_request.document_id,
                user_id=analysis_request.user_id,
                analysis_date=datetime.utcnow(),
                overall_score=analysis_results.get('overall_score', 0.5),
                policy_matches=analysis_results.get('policy_matches', []),
                compliance_gaps=analysis_results.get('compliance_gaps', []),
                risk_flags=analysis_results.get('risk_flags', []),
                recommendations=analysis_results.get('recommendations', []),
                confidence_score=analysis_results.get('confidence_score', 0.5),
                processing_time_ms=0  # Will be set by caller
            )
            
        except Exception as e:
            logger.error(f"Error in compliance analysis: {e}")
            # Return default analysis on error
            return ComplianceAnalysis(
                document_id=analysis_request.document_id,
                user_id=analysis_request.user_id,
                analysis_date=datetime.utcnow(),
                overall_score=0.0,
                policy_matches=[],
                compliance_gaps=[{
                    'gap_type': 'analysis_error',
                    'severity': 'high',
                    'description': f'Analysis failed: {str(e)}',
                    'recommendation': 'Please try again or contact support'
                }],
                risk_flags=[],
                recommendations=['Review document manually due to analysis error'],
                confidence_score=0.0,
                processing_time_ms=0
            )
    
    def _prepare_kb_context(self, kb_matches: List[Dict[str, Any]]) -> str:
        """Prepare Knowledge Base context for Claude analysis."""
        if not kb_matches:
            return "No relevant policy or regulatory content found in Knowledge Base."
        
        context_parts = []
        for i, match in enumerate(kb_matches[:5]):  # Limit to top 5 matches
            context_parts.append(
                f"Policy Reference {i+1} (Similarity: {match['similarity_score']:.2f}):\n"
                f"{match['kb_content']}\n"
            )
        
        return "\n".join(context_parts)
    
    def _create_analysis_prompt(self, document_text: str, kb_context: str, analysis_type: str) -> str:
        """Create analysis prompt for Claude."""
        if analysis_type == AnalysisType.COMPLIANCE.value:
            return f"""
You are a compliance analyst reviewing a financial document against company policies and regulations.

DOCUMENT TO ANALYZE:
{document_text[:3000]}...  # Truncate for prompt limits

RELEVANT POLICIES AND REGULATIONS:
{kb_context}

Please analyze the document for compliance and provide a structured assessment including:

1. Overall compliance score (0.0 to 1.0)
2. Policy matches found in the document
3. Compliance gaps or violations
4. Risk flags that need attention
5. Specific recommendations for improvement
6. Confidence level in your analysis (0.0 to 1.0)

Format your response as JSON with the following structure:
{{
    "overall_score": 0.85,
    "policy_matches": [
        {{
            "policy_name": "Financial Reporting Standards",
            "match_score": 0.92,
            "relevant_sections": ["Section 3.1"],
            "document_reference": "Page 2, paragraph 3"
        }}
    ],
    "compliance_gaps": [
        {{
            "gap_type": "missing_disclosure",
            "severity": "medium",
            "description": "Missing risk disclosure statement",
            "recommendation": "Add comprehensive risk disclosure in executive summary"
        }}
    ],
    "risk_flags": [
        {{
            "risk_type": "regulatory",
            "severity": "high",
            "description": "Potential SEC reporting violation",
            "impact": "Could result in regulatory penalties"
        }}
    ],
    "recommendations": [
        "Add required risk disclosures",
        "Include quarterly comparison data",
        "Verify all financial figures"
    ],
    "confidence_score": 0.88
}}
"""
        else:
            # Default analysis prompt
            return f"""
Analyze this document against the provided policies and regulations:

DOCUMENT: {document_text[:2000]}...
POLICIES: {kb_context}

Provide a compliance assessment in JSON format.
"""
    
    def _call_claude_analysis(self, prompt: str) -> str:
        """Call Claude for document analysis."""
        try:
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 2000,
                "temperature": 0.1,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            response = bedrock_client.invoke_model(
                modelId=AIModel.CLAUDE_HAIKU.value,
                body=json.dumps(request_body),
                contentType="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            return response_body['content'][0]['text']
            
        except Exception as e:
            logger.error(f"Error calling Claude: {e}")
            return '{"overall_score": 0.0, "error": "Analysis failed"}'
    
    def _parse_claude_response(self, claude_response: str, kb_matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse Claude response into structured format."""
        try:
            # Try to parse as JSON
            result = json.loads(claude_response)
            
            # Validate and set defaults
            return {
                'overall_score': max(0.0, min(1.0, result.get('overall_score', 0.5))),
                'policy_matches': result.get('policy_matches', []),
                'compliance_gaps': result.get('compliance_gaps', []),
                'risk_flags': result.get('risk_flags', []),
                'recommendations': result.get('recommendations', []),
                'confidence_score': max(0.0, min(1.0, result.get('confidence_score', 0.5)))
            }
            
        except json.JSONDecodeError:
            logger.warning("Failed to parse Claude response as JSON, using fallback")
            return {
                'overall_score': 0.5,
                'policy_matches': [],
                'compliance_gaps': [{
                    'gap_type': 'analysis_incomplete',
                    'severity': 'medium',
                    'description': 'Unable to complete full compliance analysis',
                    'recommendation': 'Manual review recommended'
                }],
                'risk_flags': [],
                'recommendations': ['Conduct manual compliance review'],
                'confidence_score': 0.3
            }
    
    def _store_analysis_results(self, analysis_id: str, compliance_analysis: ComplianceAnalysis) -> None:
        """Store analysis results in S3."""
        try:
            results_data = {
                'analysisId': analysis_id,
                'results': compliance_analysis.to_dict(),
                'createdDate': datetime.utcnow().isoformat()
            }
            
            s3_key = f"analyses/{analysis_id}.json"
            s3_client.put_object(
                Bucket=self.analysis_reports_bucket,
                Key=s3_key,
                Body=json.dumps(results_data),
                ContentType='application/json'
            )
            
            logger.info(f"Stored analysis results at {s3_key}")
            
        except Exception as e:
            logger.error(f"Error storing analysis results: {e}")
            raise
    
    def _store_analysis_record(self, analysis_record: AnalysisRecord) -> None:
        """Store analysis record in DynamoDB."""
        try:
            item = self._convert_to_dynamo_value(analysis_record.to_dynamodb_item())
            self.table.put_item(Item=item)
            logger.info(f"Stored analysis record for {analysis_record.analysis_id}")
        except Exception as e:
            logger.error(f"Error storing analysis record: {e}")
            raise

    def _convert_to_dynamo_value(self, value: Any) -> Any:
        """Recursively convert floats to Decimal for DynamoDB compatibility."""
        if isinstance(value, float):
            return Decimal(str(value))
        if isinstance(value, list):
            return [self._convert_to_dynamo_value(v) for v in value]
        if isinstance(value, dict):
            return {k: self._convert_to_dynamo_value(v) for k, v in value.items()}
        return value


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for document analysis.
    
    Args:
        event: Lambda event (API Gateway or direct invocation)
        context: Lambda context
        
    Returns:
        Analysis result
    """
    try:
        logger.info(f"Document analyzer invoked with event: {json.dumps(event)}")
        
        analyzer = DocumentAnalyzer()
        
        # Handle direct invocation with analysis request
        if 'analysisRequest' in event:
            request_data = event['analysisRequest']
            
            # Validate request data
            validation_errors = validate_analysis_request_data(request_data)
            if validation_errors:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'success': False,
                        'error': 'Invalid request data',
                        'details': validation_errors
                    })
                }
            
            # Create analysis request object
            analysis_request = AnalysisRequest.from_dict(request_data)
            
            # Perform analysis
            result = analyzer.analyze_document(analysis_request)
            
            return {
                'statusCode': 200 if result['success'] else 500,
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
        logger.error(f"Document analyzer error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
