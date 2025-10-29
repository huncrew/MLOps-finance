"""
RAG (Retrieval-Augmented Generation) processor Lambda function.

Handles natural language queries against the Knowledge Base using
vector similarity search and Claude for response generation.
"""
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import boto3
from botocore.exceptions import ClientError
import math
from decimal import Decimal

# Import common utilities
from common.env import config
from common.logging import get_logger
from common.models import (
    RAGQuery, RAGResponse, QueryRecord, QueryType, AIModel,
    validate_rag_query_data
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


class RAGProcessor:
    """RAG query processing service."""
    
    def __init__(self):
        """Initialize the RAG processor."""
        self.kb_vectors_bucket = self._get_ssm_parameter('/mlops/kb-vectors-bucket-name')
        self.table_name = self._get_ssm_parameter('/database/table-name')
        self.table = dynamodb.Table(self.table_name) if dynamodb else None
        
        # RAG settings
        self.default_similarity_threshold = 0.7
        self.max_context_chunks = 5
        self.max_response_tokens = 1500
        
    def _get_ssm_parameter(self, param_name: str) -> str:
        """Get parameter from SSM Parameter Store."""
        try:
            full_param_name = f"/{config.project_name}/{config.stage}{param_name}"
            response = ssm_client.get_parameter(Name=full_param_name)
            return response['Parameter']['Value']
        except Exception as e:
            logger.error(f"Failed to get SSM parameter {param_name}: {e}")
            return ""
    
    def process_query(self, rag_query: RAGQuery) -> RAGResponse:
        """
        Process a RAG query against the Knowledge Base.
        
        Args:
            rag_query: RAG query with user question and parameters
            
        Returns:
            RAG response with answer and sources
        """
        start_time = datetime.utcnow()
        
        try:
            logger.info(f"Processing RAG query: {rag_query.query_id}")
            
            # Generate embedding for the query
            query_embedding = self._generate_embedding(rag_query.query_text)
            
            # Search Knowledge Base for relevant content
            kb_matches = self._search_knowledge_base(
                query_embedding, 
                rag_query.similarity_threshold,
                rag_query.max_results
            )
            
            logger.info(f"Found {len(kb_matches)} relevant KB chunks")
            
            # Generate response using Claude with retrieved context
            response_text, token_usage = self._generate_response(
                rag_query.query_text, 
                kb_matches, 
                rag_query.query_type
            )
            
            # Calculate processing time
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            # Calculate confidence score based on match quality
            confidence_score = self._calculate_confidence_score(kb_matches)
            
            # Prepare sources information
            sources = self._prepare_sources(kb_matches)
            
            # Create RAG response
            rag_response = RAGResponse(
                query_id=rag_query.query_id,
                response_text=response_text,
                sources=sources,
                confidence_score=confidence_score,
                processing_time_ms=processing_time_ms,
                token_usage=token_usage
            )
            
            # Store query history
            self._store_query_history(rag_query, rag_response)
            
            logger.info(f"Completed RAG query {rag_query.query_id} in {processing_time_ms}ms")
            return rag_response
            
        except Exception as e:
            logger.error(f"Error processing RAG query {rag_query.query_id}: {str(e)}")
            
            # Return error response
            processing_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            return RAGResponse(
                query_id=rag_query.query_id,
                response_text=f"I apologize, but I encountered an error while processing your query: {str(e)}",
                sources=[],
                confidence_score=0.0,
                processing_time_ms=processing_time_ms,
                token_usage={'input_tokens': 0, 'output_tokens': 0}
            )
    
    def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for query text using Bedrock Titan."""
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
            logger.error(f"Error generating query embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 1536
    
    def _search_knowledge_base(self, query_embedding: List[float], 
                              similarity_threshold: float, max_results: int) -> List[Dict[str, Any]]:
        """
        Search Knowledge Base for content similar to the query.
        
        Args:
            query_embedding: Query embedding vector
            similarity_threshold: Minimum similarity score
            max_results: Maximum number of results to return
            
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
                    
                    # Compare query with each KB chunk
                    for kb_chunk in kb_data.get('chunks', []):
                        similarity = self._calculate_cosine_similarity(
                            query_embedding, 
                            kb_chunk['embedding']
                        )
                        
                        if similarity >= similarity_threshold:
                            matches.append({
                                'document_id': kb_data['documentId'],
                                'chunk_id': kb_chunk['chunkId'],
                                'content': kb_chunk['content'],
                                'metadata': kb_chunk.get('metadata', {}),
                                'similarity_score': similarity,
                                'document_filename': kb_chunk.get('metadata', {}).get('document_filename', 'Unknown'),
                                'document_category': kb_chunk.get('metadata', {}).get('document_category', 'Unknown')
                            })
                
                except Exception as e:
                    logger.warning(f"Error processing KB document {obj['Key']}: {e}")
                    continue
            
            # Sort by similarity score and limit results
            matches.sort(key=lambda x: x['similarity_score'], reverse=True)
            return matches[:max_results]
            
        except Exception as e:
            logger.error(f"Error searching knowledge base: {e}")
            return []
    
    def _calculate_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        try:
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
    
    def _generate_response(self, query_text: str, kb_matches: List[Dict[str, Any]], 
                          query_type: str) -> Tuple[str, Dict[str, int]]:
        """
        Generate response using Claude with retrieved context.
        
        Args:
            query_text: Original user query
            kb_matches: Matching KB content
            query_type: Type of query (general, policy, etc.)
            
        Returns:
            Tuple of (response_text, token_usage)
        """
        try:
            # Prepare context from KB matches
            context = self._prepare_context(kb_matches)
            
            # Create prompt based on query type
            prompt = self._create_rag_prompt(query_text, context, query_type)
            
            # Call Claude for response generation
            response_text, token_usage = self._call_claude_rag(prompt)
            
            return response_text, token_usage
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"I apologize, but I couldn't generate a proper response: {str(e)}", {'input_tokens': 0, 'output_tokens': 0}
    
    def _prepare_context(self, kb_matches: List[Dict[str, Any]]) -> str:
        """Prepare context from KB matches for Claude."""
        if not kb_matches:
            return "No relevant information found in the Knowledge Base."
        
        context_parts = []
        for i, match in enumerate(kb_matches[:self.max_context_chunks]):
            context_parts.append(
                f"Source {i+1} (from {match['document_filename']}, Category: {match['document_category']}, Relevance: {match['similarity_score']:.2f}):\n"
                f"{match['content']}\n"
            )
        
        return "\n".join(context_parts)
    
    def _create_rag_prompt(self, query_text: str, context: str, query_type: str) -> str:
        """Create RAG prompt for Claude based on query type."""
        
        base_instructions = """You are a knowledgeable assistant helping users understand company policies, regulations, and financial compliance requirements. 

Your task is to answer the user's question based on the provided context from the company's Knowledge Base. 

Guidelines:
- Provide accurate, helpful answers based on the context
- If the context doesn't contain enough information, say so clearly
- Include specific references to the source documents when possible
- Be concise but comprehensive
- If asked about compliance or regulations, emphasize the importance of following proper procedures"""
        
        if query_type == QueryType.POLICY.value:
            specific_instructions = """
Focus on policy-related aspects of the question. Explain relevant policies clearly and mention any compliance requirements or procedures that users should follow."""
        
        elif query_type == QueryType.REGULATION.value:
            specific_instructions = """
Focus on regulatory requirements and compliance aspects. Highlight any legal or regulatory obligations and their implications."""
        
        elif query_type == QueryType.COMPLIANCE.value:
            specific_instructions = """
Focus on compliance requirements, procedures, and best practices. Emphasize risk management and proper adherence to policies and regulations."""
        
        else:  # GENERAL
            specific_instructions = """
Provide a comprehensive answer that covers all relevant aspects of the question based on the available context."""
        
        return f"""{base_instructions}

{specific_instructions}

CONTEXT FROM KNOWLEDGE BASE:
{context}

USER QUESTION: {query_text}

Please provide a helpful answer based on the context above. If you reference specific information, mention which source it comes from."""
    
    def _call_claude_rag(self, prompt: str) -> Tuple[str, Dict[str, int]]:
        """Call Claude for RAG response generation."""
        try:
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": self.max_response_tokens,
                "temperature": 0.1,  # Low temperature for factual responses
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
            response_text = response_body['content'][0]['text']
            
            # Extract token usage if available
            usage = response_body.get('usage', {})
            token_usage = {
                'input_tokens': usage.get('input_tokens', 0),
                'output_tokens': usage.get('output_tokens', 0)
            }
            
            return response_text, token_usage
            
        except Exception as e:
            logger.error(f"Error calling Claude for RAG: {e}")
            return f"I apologize, but I encountered an error generating the response: {str(e)}", {'input_tokens': 0, 'output_tokens': 0}
    
    def _calculate_confidence_score(self, kb_matches: List[Dict[str, Any]]) -> float:
        """Calculate confidence score based on match quality."""
        if not kb_matches:
            return 0.0
        
        # Use average similarity of top matches, weighted by position
        total_score = 0.0
        total_weight = 0.0
        
        for i, match in enumerate(kb_matches[:3]):  # Top 3 matches
            weight = 1.0 / (i + 1)  # Decreasing weight for lower-ranked matches
            total_score += match['similarity_score'] * weight
            total_weight += weight
        
        confidence = total_score / total_weight if total_weight > 0 else 0.0
        
        # Adjust confidence based on number of matches
        if len(kb_matches) >= 3:
            confidence *= 1.0  # Full confidence with multiple matches
        elif len(kb_matches) == 2:
            confidence *= 0.9  # Slight reduction with fewer matches
        else:
            confidence *= 0.8  # Lower confidence with single match
        
        return min(1.0, max(0.0, confidence))
    
    def _prepare_sources(self, kb_matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prepare sources information for response."""
        sources = []
        
        for match in kb_matches[:self.max_context_chunks]:
            sources.append({
                'documentId': match['document_id'],
                'documentName': match['document_filename'],
                'category': match['document_category'],
                'chunkId': match['chunk_id'],
                'relevanceScore': match['similarity_score'],
                'excerpt': match['content'][:200] + "..." if len(match['content']) > 200 else match['content']
            })
        
        return sources
    
    def _store_query_history(self, rag_query: RAGQuery, rag_response: RAGResponse) -> None:
        """Store query and response in DynamoDB for history."""
        try:
            query_record = QueryRecord(
                pk=f"USER#{rag_query.user_id}",
                sk=f"QUERY#{rag_query.query_id}",
                gsi1pk=f"QUERY_DATE#{datetime.utcnow().strftime('%Y-%m-%d')}",
                gsi1sk=f"USER#{rag_query.user_id}",
                query_id=rag_query.query_id,
                user_id=rag_query.user_id,
                query_text=rag_query.query_text,
                query_type=rag_query.query_type,
                response_text=rag_response.response_text,
                sources=rag_response.sources,
                confidence_score=rag_response.confidence_score,
                created_date=datetime.utcnow(),
                token_usage=rag_response.token_usage
            )
            
            item = self._convert_to_dynamo_value(query_record.to_dynamodb_item())
            self.table.put_item(Item=item)
            logger.info(f"Stored query history for {rag_query.query_id}")
        
        except Exception as e:
            logger.error(f"Error storing query history: {e}")
            # Don't raise exception as this is not critical for the response

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
    Lambda handler for RAG processing.
    
    Args:
        event: Lambda event (API Gateway or direct invocation)
        context: Lambda context
        
    Returns:
        RAG response
    """
    try:
        logger.info(f"RAG processor invoked with event: {json.dumps(event)}")
        
        processor = RAGProcessor()
        
        # Handle direct invocation with RAG query
        if 'ragQuery' in event:
            query_data = event['ragQuery']
            
            # Validate query data
            validation_errors = validate_rag_query_data(query_data)
            if validation_errors:
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'success': False,
                        'error': 'Invalid query data',
                        'details': validation_errors
                    })
                }
            
            # Create RAG query object
            rag_query = RAGQuery.from_dict(query_data)
            
            # Process query
            rag_response = processor.process_query(rag_query)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'response': rag_response.to_dict()
                })
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
        logger.error(f"RAG processor error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
