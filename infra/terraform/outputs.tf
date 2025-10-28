output "api_gateway_url" {
  description = "API Gateway base URL"
  value       = module.api_gateway.api_url
}

output "uploads_bucket_name" {
  description = "S3 uploads bucket name"
  value       = module.uploads_bucket.bucket_name
}

output "uploads_bucket_arn" {
  description = "S3 uploads bucket ARN"
  value       = module.uploads_bucket.bucket_arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.main.arn
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "ssm_parameter_prefix" {
  description = "SSM parameter prefix for this environment"
  value       = "/${var.project_name}/${var.stage}"
}

# MLOps bucket outputs
output "kb_raw_bucket_name" {
  description = "MLOps Knowledge Base raw documents bucket name"
  value       = module.kb_raw_bucket.bucket_name
}

output "kb_vectors_bucket_name" {
  description = "MLOps Knowledge Base vectors bucket name"
  value       = module.kb_vectors_bucket.bucket_name
}

output "uploads_raw_bucket_name" {
  description = "MLOps user uploads raw documents bucket name"
  value       = module.uploads_raw_bucket.bucket_name
}

output "analysis_reports_bucket_name" {
  description = "MLOps analysis reports bucket name"
  value       = module.analysis_reports_bucket.bucket_name
}