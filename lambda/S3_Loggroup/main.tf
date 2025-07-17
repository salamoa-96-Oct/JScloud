terraform {
  required_version = ">= 1.5.7, < 1.13"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# 1) IAM Role (최소 권한 원칙)
resource "aws_iam_role" "lambda_exec" {
  name = "LambdaCWExportRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "exec_policy" {
  name = "AllowCWExportAndS3"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:DescribeLogGroups", "logs:CreateExportTask", "logs:DescribeExportTasks"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["s3:PutObject", "s3:GetBucketLocation", "s3:GetBucketAcl"]
        Resource = [
          "arn:aws:s3:::${var.bucket}/*",
          "arn:aws:s3:::${var.bucket}"
        ]
      }
    ]
  })
}

# 2) 모듈 호출
module "cw_export" {
  source        = "../modules/cw-export"
  function_name = var.function_name
  handler       = var.module_handler
  runtime       = var.module_runtime
  role_arn      = aws_iam_role.lambda_exec.arn
  schedule_cron = var.module_schedule_cron
  bucket        = var.bucket
  prefix        = var.module_prefix
  source_dir    = var.module_source_dir
}

resource "aws_s3_bucket_policy" "allow_cw_logs_export" {
  bucket = var.bucket

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchLogsService"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "s3:GetBucketAcl",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.bucket}",
          "arn:aws:s3:::${var.bucket}/*"
        ]
      }
    ]
  })
}
