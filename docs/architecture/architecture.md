# MLOps Finance  

## AI Compliance & Financial Report Analysis Pipeline



## Overview

This system automates **document verification and analysis** for financial and compliance workflows.  

It distinguishes between two core data domains:



1. **Company Knowledge Base (KB):**  

   Regulatory documents, company policies, compliance rules, and financial standards that form the reference dataset.  

   These documents are embedded and stored once to provide context for analysis and retrieval.  



2. **User-Uploaded Documents:**  

   Dynamic uploads such as financial statements, reports, or marketing materials that are **analysed against** the Company Knowledge Base.  

   These are processed separately and never merged with the KB unless explicitly approved.



Using **AWS Bedrock**, **LangChain**, and **serverless AWS services**, the system provides a scalable foundation for compliance automation and AI-assisted decision-making.



---



## Business Value

- **Automated compliance verification** – reduces manual review effort for analysts and compliance teams.  

- **Instant insights** – users upload a document and instantly receive an AI-generated compliance summary.  

- **Reusable knowledge base** – company policies and regulations are embedded once and reused for future analysis.  

- **Separation of datasets** – keeps regulatory data (KB) isolated from user uploads for data integrity and security.  

- **Scalable foundation** – enables future AI-driven decision-making and governance systems.



---



## Architecture Overview



### A) Company Knowledge Base (Policies / Regulations)

This is the reference dataset used for search and analysis.





Company Docs (Policies / Regulations)

|

v

[S3: kb-raw/]

|

v

[Lambda: Chunk + Preprocess]

|

v

[Bedrock Titan: Generate Embeddings]

|

v

[S3: kb-vectors/] or [OpenSearch / S3 Vectors]

- Stored once, reused by all analysis and query workflows.  

- Long-lived data with strict access controls (read-only).  



---



### B) Query & Retrieval (RAG)

Provides natural-language access to the **Company Knowledge Base** only.



[React Frontend] <—> [API Gateway + Lambda]

|

v

[LangChain / LangGraph Orchestrator]

|— Vectorize query (Bedrock Titan)

|— Retrieve top matches from KB vectors

|— Combine with context and metadata

v

[Bedrock Claude LLM → Generate Answer + Citations]

- No user-uploaded documents are involved in this path.  

- Returns grounded answers with relevant citations from the KB.



---



### C) Automated Analysis (User Upload Path)

This path analyses **user-uploaded documents** against the **Company Knowledge Base**.



User Upload → React FE → API Gateway → Lambda

|

v

[LangChain Pipeline]

|— Chunk & Embed uploaded document (Titan)

|— Retrieve matching KB embeddings

|— Compare and analyze using Bedrock Claude

|— Generate compliance summary + risk flags

v

[Return AI Analysis → React FE / DynamoDB]

- Each uploaded document is embedded temporarily (optionally stored in a separate `uploads-vectors` bucket).  

- Analysis is contextualized using the **KB embeddings**, not other uploads.  

- Results are stored as structured JSON summaries or reports.



---



## Core AWS Components

| Component | Purpose |

|------------|----------|

| **Amazon S3** | Separate storage for KB (`kb-raw`, `kb-vectors`) and user uploads (`uploads-raw`, `uploads-vectors`) |

| **AWS Lambda** | Handles chunking, embedding, retrieval, and orchestration |

| **Amazon Bedrock** | Titan for embeddings, Claude for document analysis |

| **LangChain / LangGraph** | Manages the workflow between embedding, retrieval, and LLM calls |

| **Amazon Cognito** | Authentication and access control |

| **Amazon CloudFront + API Gateway** | Secure entry point for frontend |

| **Optional:** OpenSearch / S3 Vectors | Vector storage for semantic search |

| **DynamoDB (Optional)** | Stores analysis summaries and compliance results |



---



## Technical Steps



### 1. Company Knowledge Base Ingestion

- Upload policies/regulations to `s3://kb-raw/`.  

- Trigger `lambda-chunk-preprocess` for text extraction and cleaning.  

- Generate embeddings with **Bedrock Titan**.  

- Store vectors and metadata in `s3://kb-vectors/` or **OpenSearch**.



### 2. User Document Upload

- User uploads file via React frontend using a presigned URL.  

- File saved to `s3://uploads-raw/{tenant}/{session}/`.  

- S3 triggers a Lambda for preprocessing and optional embedding.



### 3. Automated Analysis

- Lambda embeds uploaded document with **Titan**.  

- Searches **KB vectors** for relevant context.  

- Runs **Claude** analysis to compare document content vs. policies/regulations.  

- Returns structured JSON output with:

  - Summary  

  - Detected policy references  

  - Potential compliance gaps  

  - Confidence scores  



### 4. Query & Search (RAG)

- User queries via chat interface.  

- Query vectorized using **Titan** and compared against **KB embeddings**.  

- Top results combined and passed to **Claude** for response generation with citations.



---



## Data Separation Model



| Dataset | Purpose | Bucket | Access | Lifecycle |

|----------|----------|---------|---------|-----------|

| **KB Raw Docs** | Policies, regulations, static refs | `s3://kb-raw/` | Read-only | Long-term |

| **KB Embeddings** | Searchable vector store | `s3://kb-vectors/` | Read-only | Long-term |

| **User Uploads** | New documents for analysis | `s3://uploads-raw/{tenant}/{session}/` | Private | Short-term |

| **Upload Embeddings** | Temporary embeddings for analysis | `s3://uploads-vectors/` | Private | Ephemeral |

| **Reports / Results** | Analysis summaries | `s3://analysis-reports/` or DynamoDB | Private | Configurable |



---