# 1) Lambda 코드 패키징
data "archive_file" "zip" {
  type        = "zip"
  source_dir  = var.source_dir
  output_path = "${path.module}/lambda_payload.zip"
}

# 2) IAM Role → 인자로 받음 (또는 모듈 내부에 선언 가능)
#    var.role_arn

# 3) Lambda 함수 생성
resource "aws_lambda_function" "exporter" {
  function_name = var.function_name
  filename      = data.archive_file.zip.output_path
  handler       = var.handler
  runtime       = var.runtime
  role          = var.role_arn
  timeout       = 300

  environment {
    variables = {
      TARGET_BUCKET = var.bucket
      PREFIX        = var.prefix
    }
  }

  # (선택) 버전 자동 발행
  publish = true

  # ── VPC 설정 (enable_vpc=true인 경우에만) ─────────────────────────────
  dynamic "vpc_config" {
    for_each = var.enable_vpc ? [1] : []
    content {
      subnet_ids         = var.vpc_subnet_ids
      security_group_ids = var.vpc_security_group_ids
    }
  }
}

# 4) EventBridge Rule (스케줄)
resource "aws_cloudwatch_event_rule" "daily" {
  name                = "${var.function_name}-schedule"
  schedule_expression = var.schedule_cron
}

# 5) Rule → Lambda 타겟 연결
resource "aws_cloudwatch_event_target" "to_lambda" {
  rule      = aws_cloudwatch_event_rule.daily.name
  target_id = "ExportTask"
  arn       = aws_lambda_function.exporter.arn
}

# 6) EventBridge → Lambda 호출 권한
resource "aws_lambda_permission" "allow_events" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.exporter.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily.arn
}

output "lambda_arn" {
  value = aws_lambda_function.exporter.arn
}
