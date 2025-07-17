variable "function_name" {
  type        = string
  description = "Name of the Lambda function to create"
}

variable "handler" {
  type        = string
  description = "Lambda function handler"
}

variable "runtime" {
  type        = string
  description = "Runtime environment for the Lambda function"
}

variable "role_arn" {
  type        = string
  description = "ARN of the IAM role that Lambda will assume"
}

variable "schedule_cron" {
  type        = string
  description = "Cron expression for scheduling the export task"
}

variable "bucket" {
  type        = string
  description = "Name of the S3 bucket where logs will be exported"
}

variable "prefix" {
  type        = string
  description = "Key prefix in the S3 bucket for exported logs"
}

variable "source_dir" {
  type        = string
  description = "Path to the directory containing the Lambda source code"
}
variable "enable_vpc" {
  type        = bool
  default     = false
  description = "Enable VPC configuration for the Lambda function"
}

variable "vpc_subnet_ids" {
  type        = list(string)
  default     = []
  description = "List of private subnet IDs for Lambda when VPC enabled"
}

variable "vpc_security_group_ids" {
  type        = list(string)
  default     = []
  description = "List of security group IDs for Lambda when VPC enabled"
}
