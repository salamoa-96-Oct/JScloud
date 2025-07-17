variable "aws_region" {
  type        = string
  default     = "ap-northeast-2"
  description = "AWS 리전"
}

variable "function_name" {
  type        = string
  default     = "ExportCWLogs"
  description = "Lambda 함수 이름"
}

variable "bucket" {
  type        = string
  description = "CloudWatch 로그를 저장할 S3 버킷 이름"
}

variable "module_handler" {
  type        = string
  default     = "cw_logout_exporter.lambda_handler"
  description = "Lambda handler function path"
}

variable "module_runtime" {
  type        = string
  default     = "python3.9"
  description = "Lambda runtime version"
}

variable "module_schedule_cron" {
  type        = string
  default     = "cron(0 0 * * ? *)"
  description = "Cron expression for daily export"
}

variable "module_prefix" {
  type        = string
  default     = "cw-backup"
  description = "S3 key prefix for backups"
}

variable "module_source_dir" {
  type        = string
  default     = "../code/python"
  description = "Path to Lambda source code directory"
}
