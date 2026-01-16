locals {
  # Generate bucket name if not provided
  uploads_bucket_name = var.uploads_bucket_name != "" ? var.uploads_bucket_name : "${var.project_name}-${var.stage}-uploads-${random_id.bucket_suffix.hex}"

  # Common tags
  common_tags = {
    Project     = var.project_name
    Environment = var.stage
    ManagedBy   = "terraform"
  }

  # SSM parameter prefix
  ssm_prefix = "/${var.project_name}/${var.stage}"

  # Vector search resources
  vector_bucket_name         = "${var.project_name}-${var.stage}-vectors-${random_id.bucket_suffix.hex}"
  vector_index_name          = "${var.project_name}-${var.stage}-kb-index"
  frontend_domain_parts      = split(".", var.frontend_domain_name)
  frontend_root_domain_parts = slice(local.frontend_domain_parts, length(local.frontend_domain_parts) - 2, length(local.frontend_domain_parts))
  frontend_root_domain       = join(".", local.frontend_root_domain_parts)
  frontend_subdomain         = length(local.frontend_domain_parts) > length(local.frontend_root_domain_parts) ? join(".", slice(local.frontend_domain_parts, 0, length(local.frontend_domain_parts) - length(local.frontend_root_domain_parts))) : ""
  frontend_bucket_name       = join("-", local.frontend_domain_parts)
}

data "aws_caller_identity" "current" {}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# DynamoDB table (equivalent to SST Dynamo)
resource "aws_dynamodb_table" "main" {
  name         = "${var.project_name}-${var.stage}-database"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  attribute {
    name = "gsi1pk"
    type = "S"
  }

  attribute {
    name = "gsi1sk"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1pk"
    range_key       = "gsi1sk"
    projection_type = "ALL"
  }

  tags = local.common_tags
}

# Cognito User Pool (equivalent to SST CognitoUserPool)
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.stage}-user-pool"

  username_attributes = ["email"]

  username_configuration {
    case_sensitive = false
  }

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.project_name}-${var.stage}-user-pool-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  callback_urls = [
    "http://localhost:3000/api/auth/callback/cognito",
    "https://localhost:3000/api/auth/callback/cognito"
  ]

  logout_urls = [
    "http://localhost:3000",
    "https://localhost:3000"
  ]

  supported_identity_providers = ["COGNITO"]
}

# API Gateway HTTP API
module "api_gateway" {
  source = "./modules/api_gateway_http"

  project_name       = var.project_name
  stage              = var.stage
  allowed_origins    = var.allowed_origins
  log_retention_days = var.log_retention_days
  tags               = local.common_tags
}

# S3 bucket for uploads
module "uploads_bucket" {
  source = "./modules/s3_bucket"

  bucket_name                                  = local.uploads_bucket_name
  kms_key_id                                   = var.kms_key_id
  allowed_origins                              = var.allowed_origins
  enable_lifecycle                             = true
  lifecycle_expiration_days                    = 365
  lifecycle_noncurrent_version_expiration_days = 30
  tags                                         = local.common_tags
}

# MLOps S3 Buckets
module "kb_raw_bucket" {
  source = "./modules/s3_bucket"

  bucket_name      = "${var.project_name}-${var.stage}-kb-raw-${random_id.bucket_suffix.hex}"
  kms_key_id       = var.kms_key_id
  allowed_origins  = var.allowed_origins
  enable_lifecycle = false # KB documents are long-term storage
  tags = merge(local.common_tags, {
    Purpose = "MLOps Knowledge Base Raw Documents"
  })
}

module "kb_vectors_bucket" {
  source = "./modules/s3_bucket"

  bucket_name      = "${var.project_name}-${var.stage}-kb-vectors-${random_id.bucket_suffix.hex}"
  kms_key_id       = var.kms_key_id
  allowed_origins  = var.allowed_origins
  enable_lifecycle = false # Vector embeddings are long-term storage
  tags = merge(local.common_tags, {
    Purpose = "MLOps Knowledge Base Vector Embeddings"
  })
}

module "uploads_raw_bucket" {
  source = "./modules/s3_bucket"

  bucket_name                                  = "${var.project_name}-${var.stage}-uploads-raw-${random_id.bucket_suffix.hex}"
  kms_key_id                                   = var.kms_key_id
  allowed_origins                              = var.allowed_origins
  enable_lifecycle                             = true
  lifecycle_expiration_days                    = 90 # User uploads expire after 90 days
  lifecycle_noncurrent_version_expiration_days = 7
  tags = merge(local.common_tags, {
    Purpose = "MLOps User Document Uploads"
  })
}

module "analysis_reports_bucket" {
  source = "./modules/s3_bucket"

  bucket_name                                  = "${var.project_name}-${var.stage}-analysis-reports-${random_id.bucket_suffix.hex}"
  kms_key_id                                   = var.kms_key_id
  allowed_origins                              = var.allowed_origins
  enable_lifecycle                             = true
  lifecycle_expiration_days                    = 365 # Analysis reports kept for 1 year
  lifecycle_noncurrent_version_expiration_days = 30
  tags = merge(local.common_tags, {
    Purpose = "MLOps Document Analysis Reports"
  })
}

# SSM Parameters for configuration
resource "aws_ssm_parameter" "database_table_name" {
  name  = "${local.ssm_prefix}/database/table-name"
  type  = "String"
  value = aws_dynamodb_table.main.name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "api_url" {
  name  = "${local.ssm_prefix}/api/url"
  type  = "String"
  value = module.api_gateway.api_url
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "uploads_bucket_name" {
  name  = "${local.ssm_prefix}/s3/uploads-bucket-name"
  type  = "String"
  value = module.uploads_bucket.bucket_name
  tags  = local.common_tags
}

# MLOps S3 bucket parameters
resource "aws_ssm_parameter" "kb_raw_bucket_name" {
  name  = "${local.ssm_prefix}/mlops/kb-raw-bucket-name"
  type  = "String"
  value = module.kb_raw_bucket.bucket_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "kb_vectors_bucket_name" {
  name  = "${local.ssm_prefix}/mlops/kb-vectors-bucket-name"
  type  = "String"
  value = module.kb_vectors_bucket.bucket_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "vector_bucket_name" {
  name  = "${local.ssm_prefix}/mlops/vector-bucket-name"
  type  = "String"
  value = local.vector_bucket_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "vector_index_name" {
  name  = "${local.ssm_prefix}/mlops/vector-index-name"
  type  = "String"
  value = local.vector_index_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "uploads_raw_bucket_name" {
  name  = "${local.ssm_prefix}/mlops/uploads-raw-bucket-name"
  type  = "String"
  value = module.uploads_raw_bucket.bucket_name
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "analysis_reports_bucket_name" {
  name  = "${local.ssm_prefix}/mlops/analysis-reports-bucket-name"
  type  = "String"
  value = module.analysis_reports_bucket.bucket_name
  tags  = local.common_tags
}

# Frontend hosting resources
data "aws_route53_zone" "frontend" {
  name         = "${local.frontend_root_domain}."
  private_zone = false
}

resource "aws_acm_certificate" "frontend" {
  domain_name       = var.frontend_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.frontend.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "frontend" {
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for record in aws_route53_record.frontend_cert_validation : record.fqdn]
}

resource "aws_s3_bucket" "frontend" {
  bucket        = local.frontend_bucket_name
  force_destroy = true
  tags          = local.common_tags
}

resource "aws_s3_bucket_ownership_controls" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-${var.stage}-frontend-oac"
  description                       = "OAC for ${var.frontend_domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  aliases             = [var.frontend_domain_name]
  price_class         = "PriceClass_100"
  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "frontend-s3-origin"
    viewer_protocol_policy = "redirect-to-https"

    compress = true

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.frontend.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  tags = merge(local.common_tags, {
    Component = "frontend"
  })

  depends_on = [aws_acm_certificate_validation.frontend]
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipalReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = ["s3:GetObject"]
        Resource = ["${aws_s3_bucket.frontend.arn}/*"]
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })

  depends_on = [
    aws_cloudfront_distribution.frontend,
    aws_s3_bucket_public_access_block.frontend,
    aws_s3_bucket_ownership_controls.frontend
  ]
}

resource "aws_route53_record" "frontend" {
  zone_id         = data.aws_route53_zone.frontend.zone_id
  name            = local.frontend_subdomain != "" ? local.frontend_subdomain : local.frontend_root_domain
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_ssm_parameter" "cognito_user_pool_id" {
  name  = "${local.ssm_prefix}/cognito/user-pool-id"
  type  = "String"
  value = aws_cognito_user_pool.main.id
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "cognito_user_pool_client_id" {
  name  = "${local.ssm_prefix}/cognito/user-pool-client-id"
  type  = "String"
  value = aws_cognito_user_pool_client.main.id
  tags  = local.common_tags
}

# Placeholder SSM parameters for secrets (to be set manually)
resource "aws_ssm_parameter" "stripe_secret_key" {
  name  = "${local.ssm_prefix}/stripe/secret-key"
  type  = "SecureString"
  value = "placeholder-change-me"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "stripe_webhook_secret" {
  name  = "${local.ssm_prefix}/stripe/webhook-secret"
  type  = "SecureString"
  value = "placeholder-change-me"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "nextauth_secret" {
  name  = "${local.ssm_prefix}/nextauth/secret"
  type  = "SecureString"
  value = "placeholder-change-me"
  tags  = local.common_tags

  lifecycle {
    ignore_changes = [value]
  }
}

# Lambda Functions

# Authentication Lambda
module "auth_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "auth"
  zip_file_path = "../../backend/dist/auth.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.base_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# API Gateway Routes for Authentication
resource "aws_apigatewayv2_integration" "auth" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.auth_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "auth_session" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /auth/session"
  target    = "integrations/${aws_apigatewayv2_integration.auth.id}"
}

# Stripe Checkout Lambda
module "stripe_checkout_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "stripe-checkout"
  zip_file_path = "../../backend/dist/stripe-checkout.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.base_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# Stripe Webhook Lambda
module "stripe_webhook_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "stripe-webhook"
  zip_file_path = "../../backend/dist/stripe-webhook.zip"
  handler       = "webhook.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.base_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# API Gateway Routes for Stripe
resource "aws_apigatewayv2_integration" "stripe_checkout" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.stripe_checkout_lambda.invoke_arn
}

resource "aws_apigatewayv2_integration" "stripe_webhook" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.stripe_webhook_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "stripe_checkout" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /stripe/checkout"
  target    = "integrations/${aws_apigatewayv2_integration.stripe_checkout.id}"
}

resource "aws_apigatewayv2_route" "stripe_webhook" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /stripe/webhook"
  target    = "integrations/${aws_apigatewayv2_integration.stripe_webhook.id}"
}

# Subscription Lambda
module "subscription_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "subscription"
  zip_file_path = "../../backend/dist/subscription.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.base_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# API Gateway Routes for Subscription
resource "aws_apigatewayv2_integration" "subscription" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.subscription_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "subscription_status" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /subscription/status"
  target    = "integrations/${aws_apigatewayv2_integration.subscription.id}"
}

# AI Generation Lambda
module "ai_generate_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "ai-generate"
  zip_file_path = "../../backend/dist/ai-generate.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.ai_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# AI History Lambda
module "ai_history_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "ai-history"
  zip_file_path = "../../backend/dist/ai-history.zip"
  handler       = "history.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.base_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# API Gateway Routes for AI
resource "aws_apigatewayv2_integration" "ai_generate" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.ai_generate_lambda.invoke_arn
}

resource "aws_apigatewayv2_integration" "ai_history" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.ai_history_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "ai_generate" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /ai/generate"
  target    = "integrations/${aws_apigatewayv2_integration.ai_generate.id}"
}

resource "aws_apigatewayv2_route" "ai_history" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /ai/history"
  target    = "integrations/${aws_apigatewayv2_integration.ai_history.id}"
}

# Upload Presigned URL Lambda
module "upload_url_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "upload-url"
  zip_file_path = "../../backend/dist/upload-url.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    UPLOADS_BUCKET_NAME = module.uploads_bucket.bucket_name
  }

  policy_statements = local.upload_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# MLOps Lambda Functions

# Knowledge Base Processor Lambda
module "kb_processor_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "kb-processor"
  zip_file_path = "../../backend/dist/kb-processor.zip"
  handler       = "handler.handler"
  timeout       = 300  # 5 minutes for document processing
  memory_size   = 1024 # More memory for document processing

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.mlops_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# Knowledge Base Management API Lambda
module "kb_handler_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "kb-handler"
  zip_file_path = "../../backend/dist/kb-handler.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.mlops_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# Document Analyzer Lambda
module "document_analyzer_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "document-analyzer"
  zip_file_path = "../../backend/dist/document-analyzer.zip"
  handler       = "handler.handler"
  timeout       = 900  # Allow up to 15 minutes for full document analysis
  memory_size   = 2048 # Extra memory headroom for embeddings

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.mlops_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# Analysis Handler Lambda
module "analysis_handler_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "analysis-handler"
  zip_file_path = "../../backend/dist/analysis-handler.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.mlops_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# RAG Processor Lambda
module "rag_processor_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "rag-processor"
  zip_file_path = "../../backend/dist/rag-processor.zip"
  handler       = "handler.handler"
  timeout       = 120  # 2 minutes for RAG processing
  memory_size   = 1024 # More memory for vector operations

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.mlops_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# RAG Handler Lambda
module "rag_handler_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "rag-handler"
  zip_file_path = "../../backend/dist/rag-handler.zip"
  handler       = "handler.handler"
  timeout       = var.lambda_timeout
  memory_size   = var.lambda_memory_size

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.mlops_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# MLOps Health Check Lambda
module "mlops_health_lambda" {
  source = "./modules/lambda_function"

  project_name  = var.project_name
  stage         = var.stage
  function_name = "mlops-health"
  zip_file_path = "../../backend/dist/mlops-health.zip"
  handler       = "handler.handler"
  timeout       = 30  # Short timeout for health checks
  memory_size   = 256 # Minimal memory for health checks

  environment_variables = {
    PROJECT_NAME        = var.project_name
    STAGE               = var.stage
    DATABASE_TABLE_NAME = aws_dynamodb_table.main.name
  }

  policy_statements = local.mlops_policy_statements

  api_gateway_execution_arn = module.api_gateway.execution_arn
  log_retention_days        = var.log_retention_days
  tags                      = local.common_tags
}

# API Gateway Routes for Upload
resource "aws_apigatewayv2_integration" "upload_url" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.upload_url_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "upload_url" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /upload/url"
  target    = "integrations/${aws_apigatewayv2_integration.upload_url.id}"
}

# MLOps API Gateway Integrations and Routes

# Knowledge Base Management Routes
resource "aws_apigatewayv2_integration" "kb_handler" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.kb_handler_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "kb_upload" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /mlops/kb/upload"
  target    = "integrations/${aws_apigatewayv2_integration.kb_handler.id}"
}

resource "aws_apigatewayv2_route" "kb_process" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /mlops/kb/process"
  target    = "integrations/${aws_apigatewayv2_integration.kb_handler.id}"
}

resource "aws_apigatewayv2_route" "kb_documents_list" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/kb/documents"
  target    = "integrations/${aws_apigatewayv2_integration.kb_handler.id}"
}

resource "aws_apigatewayv2_route" "kb_document_get" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/kb/documents/{documentId}"
  target    = "integrations/${aws_apigatewayv2_integration.kb_handler.id}"
}

resource "aws_apigatewayv2_route" "kb_document_delete" {
  api_id    = module.api_gateway.api_id
  route_key = "DELETE /mlops/kb/documents/{documentId}"
  target    = "integrations/${aws_apigatewayv2_integration.kb_handler.id}"
}

# Document Analysis Routes
resource "aws_apigatewayv2_integration" "analysis_handler" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.analysis_handler_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "analysis_upload" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /mlops/analyze/upload"
  target    = "integrations/${aws_apigatewayv2_integration.analysis_handler.id}"
}

resource "aws_apigatewayv2_route" "analysis_start" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /mlops/analyze"
  target    = "integrations/${aws_apigatewayv2_integration.analysis_handler.id}"
}

resource "aws_apigatewayv2_route" "analysis_list" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/analyze"
  target    = "integrations/${aws_apigatewayv2_integration.analysis_handler.id}"
}

resource "aws_apigatewayv2_route" "analysis_get" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/analyze/{analysisId}"
  target    = "integrations/${aws_apigatewayv2_integration.analysis_handler.id}"
}

resource "aws_apigatewayv2_route" "analysis_report" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/analyze/{analysisId}/report"
  target    = "integrations/${aws_apigatewayv2_integration.analysis_handler.id}"
}

resource "aws_apigatewayv2_route" "analysis_delete" {
  api_id    = module.api_gateway.api_id
  route_key = "DELETE /mlops/analyze/{analysisId}"
  target    = "integrations/${aws_apigatewayv2_integration.analysis_handler.id}"
}

# RAG Query Routes
resource "aws_apigatewayv2_integration" "rag_handler" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.rag_handler_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "rag_query" {
  api_id    = module.api_gateway.api_id
  route_key = "POST /mlops/query"
  target    = "integrations/${aws_apigatewayv2_integration.rag_handler.id}"
}

resource "aws_apigatewayv2_route" "rag_history" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/query/history"
  target    = "integrations/${aws_apigatewayv2_integration.rag_handler.id}"
}

resource "aws_apigatewayv2_route" "rag_statistics" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/query/statistics"
  target    = "integrations/${aws_apigatewayv2_integration.rag_handler.id}"
}

resource "aws_apigatewayv2_route" "rag_query_get" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/query/{queryId}"
  target    = "integrations/${aws_apigatewayv2_integration.rag_handler.id}"
}

resource "aws_apigatewayv2_route" "rag_query_delete" {
  api_id    = module.api_gateway.api_id
  route_key = "DELETE /mlops/query/{queryId}"
  target    = "integrations/${aws_apigatewayv2_integration.rag_handler.id}"
}

# CORS Preflight Routes for MLOps endpoints
resource "aws_apigatewayv2_route" "mlops_cors_kb" {
  api_id    = module.api_gateway.api_id
  route_key = "OPTIONS /mlops/kb/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.kb_handler.id}"
}

resource "aws_apigatewayv2_route" "mlops_cors_analyze" {
  api_id    = module.api_gateway.api_id
  route_key = "OPTIONS /mlops/analyze/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.analysis_handler.id}"
}

resource "aws_apigatewayv2_route" "mlops_cors_query" {
  api_id    = module.api_gateway.api_id
  route_key = "OPTIONS /mlops/query/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.rag_handler.id}"
}

# Health Check Routes
resource "aws_apigatewayv2_integration" "mlops_health" {
  api_id           = module.api_gateway.api_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.mlops_health_lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "mlops_health" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/health"
  target    = "integrations/${aws_apigatewayv2_integration.mlops_health.id}"
}

resource "aws_apigatewayv2_route" "mlops_health_component" {
  api_id    = module.api_gateway.api_id
  route_key = "GET /mlops/health/{component}"
  target    = "integrations/${aws_apigatewayv2_integration.mlops_health.id}"
}

# Common IAM policy statements for Lambda functions
locals {
  # Common policy statements for Lambda functions
  base_policy_statements = [
    # DynamoDB permissions
    {
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DescribeTable"
      ]
      Resource = [
        aws_dynamodb_table.main.arn,
        "${aws_dynamodb_table.main.arn}/index/*"
      ]
    },
    # SSM permissions for reading parameters
    {
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ]
      Resource = [
        "arn:aws:ssm:${var.aws_region}:*:parameter${local.ssm_prefix}/*"
      ]
    }
  ]

  # AI policy statements with Bedrock permissions
  ai_policy_statements = [
    # DynamoDB permissions
    {
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DescribeTable"
      ]
      Resource = [
        aws_dynamodb_table.main.arn,
        "${aws_dynamodb_table.main.arn}/index/*"
      ]
    },
    # SSM permissions
    {
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ]
      Resource = [
        "arn:aws:ssm:${var.aws_region}:*:parameter${local.ssm_prefix}/*"
      ]
    },
    # Bedrock permissions
    {
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel"
      ]
      Resource = [
        "arn:aws:bedrock:${var.aws_region}::foundation-model/*"
      ]
    }
  ]

  # Upload policy statements with S3 and SSM
  upload_policy_statements = [
    # SSM permissions
    {
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ]
      Resource = [
        "arn:aws:ssm:${var.aws_region}:*:parameter${local.ssm_prefix}/*"
      ]
    },
    # S3 permissions for objects
    {
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Resource = [
        "${module.uploads_bucket.bucket_arn}/*"
      ]
    },
    # S3 permissions for bucket
    {
      Effect = "Allow"
      Action = [
        "s3:ListBucket"
      ]
      Resource = [
        module.uploads_bucket.bucket_arn
      ]
    }
  ]

  # MLOps policy statements with Bedrock and S3 permissions
  mlops_policy_statements = [
    # DynamoDB permissions
    {
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DescribeTable"
      ]
      Resource = [
        aws_dynamodb_table.main.arn,
        "${aws_dynamodb_table.main.arn}/index/*"
      ]
    },
    # SSM permissions
    {
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ]
      Resource = [
        "arn:aws:ssm:${var.aws_region}:*:parameter${local.ssm_prefix}/*"
      ]
    },
    # Bedrock permissions
    {
      Effect = "Allow"
      Action = [
        "bedrock:InvokeModel"
      ]
      Resource = [
        "arn:aws:bedrock:${var.aws_region}::foundation-model/*"
      ]
    },
    # S3 Vector Search permissions
    {
      Effect = "Allow"
      Action = [
        "s3vectors:CreateVectorBucket",
        "s3vectors:GetVectorBucket",
        "s3vectors:ListVectorBuckets",
        "s3vectors:PutVectorBucketPolicy",
        "s3vectors:DeleteVectorBucketPolicy",
        "s3vectors:CreateIndex",
        "s3vectors:GetIndex",
        "s3vectors:ListIndexes",
        "s3vectors:PutVectors",
        "s3vectors:DeleteVectors",
        "s3vectors:ListVectors",
        "s3vectors:GetVectors",
        "s3vectors:QueryVectors"
      ]
      Resource = [
        format("arn:aws:s3vectors:%s:%s:bucket/%s", var.aws_region, data.aws_caller_identity.current.account_id, local.vector_bucket_name),
        format("arn:aws:s3vectors:%s:%s:bucket/%s/index/%s", var.aws_region, data.aws_caller_identity.current.account_id, local.vector_bucket_name, local.vector_index_name)
      ]
    },
    # Lambda invocation permissions for internal orchestrations
    {
      Effect = "Allow"
      Action = [
        "lambda:InvokeFunction"
      ]
      Resource = [
        "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-${var.stage}-*",
        "arn:aws:lambda:${var.aws_region}:${data.aws_caller_identity.current.account_id}:function:${var.project_name}-${var.stage}-*:*"
      ]
    },
    # S3 permissions for all MLOps buckets
    {
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Resource = [
        "${module.kb_raw_bucket.bucket_arn}/*",
        "${module.kb_vectors_bucket.bucket_arn}/*",
        "${module.uploads_raw_bucket.bucket_arn}/*",
        "${module.analysis_reports_bucket.bucket_arn}/*"
      ]
    },
    # S3 bucket permissions
    {
      Effect = "Allow"
      Action = [
        "s3:ListBucket"
      ]
      Resource = [
        module.kb_raw_bucket.bucket_arn,
        module.kb_vectors_bucket.bucket_arn,
        module.uploads_raw_bucket.bucket_arn,
        module.analysis_reports_bucket.bucket_arn
      ]
    }
  ]
}

# Additional CloudWatch Alarms for overall system monitoring
resource "aws_cloudwatch_metric_alarm" "high_lambda_errors" {
  alarm_name          = "${var.project_name}-${var.stage}-high-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "High number of Lambda errors across all functions"
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_api_latency" {
  alarm_name          = "${var.project_name}-${var.stage}-high-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "IntegrationLatency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000" # 5 seconds
  alarm_description   = "High API Gateway integration latency"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = "${var.project_name}-${var.stage}-api"
  }

  tags = local.common_tags
}

# MLOps CloudWatch Alarms

# KB Processor Alarms
resource "aws_cloudwatch_metric_alarm" "kb_processor_errors" {
  alarm_name          = "${var.project_name}-${var.stage}-kb-processor-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "High error rate in KB processor"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.kb_processor_lambda.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "kb_processor_duration" {
  alarm_name          = "${var.project_name}-${var.stage}-kb-processor-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "240000" # 4 minutes (80% of 5-minute timeout)
  alarm_description   = "KB processor taking too long"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.kb_processor_lambda.function_name
  }

  tags = local.common_tags
}

# Document Analyzer Alarms
resource "aws_cloudwatch_metric_alarm" "document_analyzer_errors" {
  alarm_name          = "${var.project_name}-${var.stage}-document-analyzer-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "High error rate in document analyzer"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.document_analyzer_lambda.function_name
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "document_analyzer_duration" {
  alarm_name          = "${var.project_name}-${var.stage}-document-analyzer-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "240000" # 4 minutes
  alarm_description   = "Document analyzer taking too long"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.document_analyzer_lambda.function_name
  }

  tags = local.common_tags
}

# RAG Processor Alarms
resource "aws_cloudwatch_metric_alarm" "rag_processor_errors" {
  alarm_name          = "${var.project_name}-${var.stage}-rag-processor-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "High error rate in RAG processor"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = module.rag_processor_lambda.function_name
  }

  tags = local.common_tags
}

# Bedrock Usage Monitoring (Custom Metrics)
resource "aws_cloudwatch_log_metric_filter" "bedrock_errors" {
  name           = "${var.project_name}-${var.stage}-bedrock-errors"
  log_group_name = "/aws/lambda/${var.project_name}-${var.stage}-document-analyzer"
  pattern        = "[timestamp, request_id, level=\"ERROR\", message=\"*Bedrock*\"]"

  metric_transformation {
    name      = "BedrockErrors"
    namespace = "${var.project_name}/${var.stage}/MLOps"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "bedrock_errors_alarm" {
  alarm_name          = "${var.project_name}-${var.stage}-bedrock-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BedrockErrors"
  namespace           = "${var.project_name}/${var.stage}/MLOps"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "High number of Bedrock API errors"
  treat_missing_data  = "notBreaching"

  tags = local.common_tags
}

# S3 Operations Monitoring
resource "aws_cloudwatch_log_metric_filter" "s3_errors" {
  name           = "${var.project_name}-${var.stage}-s3-errors"
  log_group_name = "/aws/lambda/${var.project_name}-${var.stage}-kb-processor"
  pattern        = "[timestamp, request_id, level=\"ERROR\", message=\"*S3*\"]"

  metric_transformation {
    name      = "S3Errors"
    namespace = "${var.project_name}/${var.stage}/MLOps"
    value     = "1"
  }
}

# DynamoDB Throttling Monitoring
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.project_name}-${var.stage}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "DynamoDB requests being throttled"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  tags = local.common_tags
}

# CloudWatch Dashboard for monitoring
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.stage}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", "ApiName", "${var.project_name}-${var.stage}-api"],
            [".", "4XXError", ".", "."],
            [".", "5XXError", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-${var.stage}-auth"],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Core Lambda Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-${var.stage}-kb-processor"],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."],
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-${var.stage}-document-analyzer"],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "MLOps Lambda Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", "FunctionName", "${var.project_name}-${var.stage}-rag-processor"],
            [".", "Errors", ".", "."],
            [".", "Duration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "RAG Processing Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 24
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", aws_dynamodb_table.main.name],
            [".", "ConsumedWriteCapacityUnits", ".", "."],
            [".", "ThrottledRequests", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Metrics"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 30
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["${var.project_name}/${var.stage}/MLOps", "BedrockErrors"],
            [".", "S3Errors"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "MLOps Custom Metrics"
          period  = 300
        }
      }
    ]
  })
}
