# MLOps Finance Platform

AI-powered financial compliance and document analysis platform.

## Essential Context

When working on this project, always reference these key documents:

1. **docs/context/context.md** - Business domain and financial compliance vocabulary
2. **docs/architecture/architecture.md** - Technical architecture and data flows
3. **backend/lambdas/common/models.py** - Data models and validation patterns
4. **docs/api/mlops-endpoints.md** - API specifications and contracts

## What We're Building

**MLOps Finance** - Enterprise-grade compliance platform that uses AI to analyze financial documents, ensure regulatory adherence, and provide intelligent insights through RAG-powered knowledge base queries.

### Core Features
- **Document Analysis**: AI-powered compliance analysis against regulatory frameworks (Basel III, GDPR, SOX)
- **Knowledge Base**: RAG system for querying regulatory documents and policies
- **Real-time Processing**: Serverless architecture with AWS Bedrock and S3-based vector search
- **Enterprise Security**: Multi-tenant data isolation with audit trails

## Architecture

### Backend Stack
- **Python 3.11** Lambda functions for all API endpoints
- **AWS Bedrock** for Claude AI analysis and Titan embeddings
- **S3** for document storage and vector database
- **DynamoDB** for metadata and user data persistence
- **Terraform** for infrastructure as code

### Frontend Stack
- **Next.js** with TypeScript for the web application
- **Tailwind CSS** for professional financial services UI
- **Real-time API integration** with comprehensive error handling

## Development Principles

- **Real AWS integrations** - No mocks, use actual AWS services
- **Clean, typed code** - Python type hints, proper error handling
- **Serverless-first** - Lambda functions with S3/DynamoDB persistence
- **Security by design** - User isolation, least-privilege IAM
- **Cost-effective** - S3 vectors instead of expensive vector databases

## Key Workflows

### Document Analysis Pipeline
1. User uploads financial document → S3 presigned URL
2. Lambda extracts text and chunks content
3. Bedrock Titan generates embeddings
4. Claude analyzes against KB for compliance gaps
5. Results stored in DynamoDB + S3 for retrieval

### RAG Query System
1. User asks compliance question
2. Query embedded with Titan
3. S3 vector search finds relevant KB content
4. Claude generates contextual response
5. Query history stored for user

## Current Status

✅ **Production-ready core functionality**
- Real AWS service integrations (S3, DynamoDB, Bedrock)
- Complete document analysis pipeline
- Working RAG query system
- Multi-tenant user isolation
- Professional frontend UI

🔄 **Enhancement opportunities**
- PDF/DOCX text extraction libraries
- Advanced document processing (OCR, tables)
- Performance optimizations