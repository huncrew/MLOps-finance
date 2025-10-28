variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "simple-saas-template"
}

variable "stage" {
  description = "Deployment stage (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "uploads_bucket_name" {
  description = "Name for the S3 uploads bucket"
  type        = string
  default     = ""
}

variable "allowed_origins" {
  description = "Allowed CORS origins for API Gateway"
  type        = list(string)
  default = [
    "http://localhost:3000",
    "https://localhost:3000"
  ]
}

variable "kms_key_id" {
  description = "KMS key ID for S3 encryption (optional)"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

variable "lambda_timeout" {
  description = "Default Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Default Lambda function memory size in MB"
  type        = number
  default     = 512
}