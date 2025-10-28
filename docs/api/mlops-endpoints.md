# MLOps API Endpoints

This document describes the REST API endpoints for the MLOps Finance pipeline.

## Base URL

```
https://api.{domain}/mlops
```

## Authentication

All endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Knowledge Base Management

### Upload Document to KB

**POST** `/mlops/kb/upload`

Create a presigned URL for uploading documents to the Knowledge Base.

**Request Body:**
```json
{
  "filename": "policy_document.pdf",
  "contentType": "application/pdf",
  "category": "policies",
  "metadata": {
    "department": "compliance",
    "version": "1.0",
    "effective_date": "2024-01-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/...",
    "documentId": "doc_123",
    "s3Key": "policies/doc_123_policy_document.pdf",
    "expiresIn": 3600
  }
}
```

### Trigger Document Processing

**POST** `/mlops/kb/process`

Trigger processing of an uploaded KB document.

**Request Body:**
```json
{
  "documentId": "doc_123",
  "filename": "policy_document.pdf",
  "contentType": "application/pdf",
  "size": 1024000,
  "category": "policies",
  "s3Key": "policies/doc_123_policy_document.pdf"
}
```

### List KB Documents

**GET** `/mlops/kb/documents`

List documents in the Knowledge Base.

**Query Parameters:**
- `category` (optional): Filter by document category
- `limit` (optional): Maximum number of documents (default: 50, max: 100)
- `lastKey` (optional): Pagination key

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_123",
        "filename": "policy_document.pdf",
        "category": "policies",
        "status": "processed",
        "chunkCount": 15,
        "uploadDate": "2024-01-01T00:00:00Z"
      }
    ],
    "count": 1,
    "lastKey": "doc_456"
  }
}
```

### Get KB Document

**GET** `/mlops/kb/documents/{documentId}`

Get details of a specific KB document.

### Delete KB Document

**DELETE** `/mlops/kb/documents/{documentId}`

Delete a KB document and its associated data.

## Document Analysis

### Upload Document for Analysis

**POST** `/mlops/analyze/upload`

Create a presigned URL for uploading documents for analysis.

**Request Body:**
```json
{
  "filename": "financial_report.pdf",
  "contentType": "application/pdf"
}
```

### Start Document Analysis

**POST** `/mlops/analyze`

Start analysis of an uploaded document.

**Request Body:**
```json
{
  "documentId": "upload_123",
  "filename": "financial_report.pdf",
  "analysisType": "compliance",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_456",
    "status": "pending",
    "estimatedCompletion": "2024-01-01T00:05:00Z"
  }
}
```

### List User Analyses

**GET** `/mlops/analyze`

List user's document analyses.

**Query Parameters:**
- `limit` (optional): Maximum number of analyses (default: 50)
- `lastKey` (optional): Pagination key

### Get Analysis Status

**GET** `/mlops/analyze/{analysisId}`

Get analysis status and results.

**Response:**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_456",
    "status": "completed",
    "createdDate": "2024-01-01T00:00:00Z",
    "completedDate": "2024-01-01T00:03:00Z",
    "results": {
      "overallScore": 0.85,
      "policyMatches": [
        {
          "policyId": "policy_789",
          "policyName": "Financial Reporting Standards",
          "matchScore": 0.92,
          "relevantSections": ["Section 3.1", "Section 4.2"]
        }
      ],
      "complianceGaps": [
        {
          "gapType": "missing_disclosure",
          "severity": "medium",
          "description": "Missing risk disclosure statement",
          "recommendation": "Add risk disclosure in section 2"
        }
      ],
      "riskFlags": [],
      "recommendations": [
        "Add required risk disclosures",
        "Include quarterly comparison data"
      ],
      "confidenceScore": 0.88
    }
  }
}
```

### Get Detailed Analysis Report

**GET** `/mlops/analyze/{analysisId}/report`

Get detailed analysis report with full context.

### Delete Analysis

**DELETE** `/mlops/analyze/{analysisId}`

Delete an analysis and its associated data.

## RAG Queries

### Submit Query

**POST** `/mlops/query`

Submit a natural language query to the Knowledge Base.

**Request Body:**
```json
{
  "queryText": "What are the requirements for quarterly financial reporting?",
  "queryType": "policy",
  "maxResults": 5,
  "similarityThreshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "queryId": "query_789",
    "response": {
      "queryId": "query_789",
      "responseText": "Based on company policies, quarterly financial reporting requires...",
      "sources": [
        {
          "documentId": "doc_123",
          "documentName": "Financial Reporting Policy",
          "category": "policies",
          "chunkId": "chunk_456",
          "relevanceScore": 0.94,
          "excerpt": "Quarterly reports must include..."
        }
      ],
      "confidenceScore": 0.89,
      "processingTimeMs": 1250,
      "tokenUsage": {
        "inputTokens": 150,
        "outputTokens": 300
      }
    }
  }
}
```

### Get Query History

**GET** `/mlops/query/history`

Get user's query history.

**Query Parameters:**
- `limit` (optional): Maximum number of queries (default: 50)
- `lastKey` (optional): Pagination key
- `date` (optional): Filter by date (YYYY-MM-DD)

### Get Query Statistics

**GET** `/mlops/query/statistics`

Get query statistics for the user.

**Query Parameters:**
- `days` (optional): Number of days to include (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalQueries": 45,
      "dateRange": {
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-01-31T00:00:00Z",
        "days": 30
      },
      "queryTypes": {
        "general": 20,
        "policy": 15,
        "compliance": 10
      },
      "dailyCounts": {
        "2024-01-15": 3,
        "2024-01-16": 5
      },
      "totalTokens": 12500,
      "averageConfidence": 0.82,
      "averageQueriesPerDay": 1.5
    }
  }
}
```

### Get Query Details

**GET** `/mlops/query/{queryId}`

Get detailed information about a specific query.

### Delete Query

**DELETE** `/mlops/query/{queryId}`

Delete a query from user's history.

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "fieldName"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Invalid request data
- `AUTHENTICATION_ERROR` (401): Authentication required
- `AUTHORIZATION_ERROR` (403): Insufficient permissions
- `SUBSCRIPTION_ERROR` (403): Active subscription required
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_ERROR` (429): Rate limit exceeded
- `INTERNAL_ERROR` (500): Internal server error

## Rate Limits

- **RAG Queries**: 100 per hour, 500 per day per user
- **Document Analysis**: 50 per hour, 200 per day per user
- **KB Management**: 20 uploads per hour per user

## Subscription Requirements

Different features require different subscription tiers:

- **Starter**: Basic RAG queries (up to 50/day)
- **Professional**: Full RAG access, document analysis (up to 100 analyses/month)
- **Enterprise**: Unlimited access, KB management, priority processing