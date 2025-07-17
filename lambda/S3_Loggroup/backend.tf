terraform {
  backend "s3" {
    bucket         = "${bucket}"
    key            = "prod/lambda/cw-export.tfstate"
    region         = "ap-northeast-2"
    dynamodb_table = "terraform-locks"
    encrypt        = true
    profile        = "aws_mfa"
  }
}
