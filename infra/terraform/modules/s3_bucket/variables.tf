variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (optional)"
  type        = string
  default     = ""
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "enable_lifecycle" {
  description = "Enable lifecycle configuration"
  type        = bool
  default     = false
}

variable "lifecycle_expiration_days" {
  description = "Days after which objects expire"
  type        = number
  default     = 365
}

variable "lifecycle_noncurrent_version_expiration_days" {
  description = "Days after which noncurrent versions expire"
  type        = number
  default     = 30
}

variable "lambda_function_arn" {
  description = "Lambda function ARN for S3 event notifications"
  type        = string
  default     = ""
}

variable "event_filter_prefix" {
  description = "S3 event filter prefix"
  type        = string
  default     = ""
}

variable "event_filter_suffix" {
  description = "S3 event filter suffix"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}