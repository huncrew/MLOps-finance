resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-${var.stage}-api"
  protocol_type = "HTTP"
  description   = "HTTP API for ${var.project_name} ${var.stage}"

  cors_configuration {
    allow_credentials = true
    allow_headers     = ["content-type", "authorization", "x-user-id", "x-correlation-id"]
    allow_methods     = ["*"]
    allow_origins     = var.allowed_origins
    max_age          = 86400
  }

  tags = var.tags
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.stage
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      routeKey      = "$context.routeKey"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
      error         = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
    })
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}-${var.stage}"
  retention_in_days = var.log_retention_days
  tags              = var.tags
}

# CloudWatch Alarms for API Gateway
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.stage}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ApiName = aws_apigatewayv2_api.main.name
    Stage   = aws_apigatewayv2_stage.main.name
  }

  tags = var.tags
}

resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${var.project_name}-${var.stage}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "20"
  alarm_description   = "This metric monitors API Gateway 4XX errors"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ApiName = aws_apigatewayv2_api.main.name
    Stage   = aws_apigatewayv2_stage.main.name
  }

  tags = var.tags
}