# CloudWatch Logs Export Lambda Terraform Module

이 모듈은 AWS Lambda를 사용하여 CloudWatch 로그를 S3로 주기적으로 내보내는 자동화 인프라를 손쉽게 구축할 수 있도록 도와줍니다.

---

## 주요 기능
- Lambda 함수 자동 배포 (코드 패키징 포함)
- IAM Role 연결
- EventBridge(CloudWatch Events)로 스케줄링
- S3 버킷으로 로그 내보내기
- (선택) VPC 설정 지원

---

## 사용법 (Quick Start)

### 1. 모듈 디렉토리 구조
```
prod/lambda/
  ├── code/           # Lambda 소스코드 디렉토리 (예: python 코드)
  ├── modules/
  │     └── cw-export/  # 본 Terraform 모듈
  └── S3_Loggroup/
         ├── main.tf    # 모듈을 실제로 사용하는 예시
         └── vars.tf    # 변수값 정의
```

### 2. 모듈 호출 예시
`main.tf`에서 아래와 같이 모듈을 호출합니다:

```hcl
module "cw_export" {
  source        = "../modules/cw-export"
  function_name = var.function_name
  handler       = var.module_handler
  runtime       = var.module_runtime
  role_arn      = var.role_arn
  schedule_cron = var.module_schedule_cron
  bucket        = var.bucket
  prefix        = var.module_prefix
  source_dir    = var.module_source_dir
  # (선택) VPC 설정
  enable_vpc            = var.enable_vpc
  vpc_subnet_ids        = var.vpc_subnet_ids
  vpc_security_group_ids = var.vpc_security_group_ids
}
```

### 3. 변수 예시 (`vars.tf`)
```hcl
variable function_name" {
  type        = string
  default     = "ExportCWLogs"
  description = "Lambda 함수 이름"
}

variable role_arn" {
  type        = string
  description = "Lambda 실행 역할 ARN (필수)"
}

variable bucket" {
  type        = string
  default     = "{버킷이름}"
  description = "CloudWatch 로그를 저장할 S3 버킷 이름"
}

variable module_handler" {
  type        = string
  default     = "lambda_function.lambda_handler"
  description = "Lambda 핸들러 경로"
}

variable module_runtime" {
  type        = string
  default     = "python3.9"
  description = "Lambda 런타임 버전"
}

variable module_schedule_cron" {
  type        = string
  default     = "cron(0 0 * * ? *)"
  description = "스케줄 cron 식"
}

variable module_prefix" {
  type        = string
  default     = "cw-backup"
  description = "S3 prefix"
}

variable module_source_dir" {
  type        = string
  default     = "../code/python"
  description = "Lambda 소스 디렉토리 경로"
}

# (선택) VPC 설정
variable enable_vpc" {
  type        = bool
  default     = false
  description = "Lambda를 VPC에 연결할지 여부"
}

variable vpc_subnet_ids" {
  type        = list(string)
  default     = []
  description = "VPC 서브넷 ID 목록"
}

variable vpc_security_group_ids" {
  type        = list(string)
  default     = []
  description = "VPC 시큐리티 그룹 ID 목록"
}
```

### 4. Lambda 소스코드 준비
- `source_dir`에 지정한 경로에 Python 등 Lambda 코드를 준비하세요.
- 예시: `prod/lambda/code/python/lambda_function.py`

### 5. 필수 변수 입력
- `role_arn` 등 환경에 맞는 값을 반드시 지정해야 합니다.
- 나머지는 default 값이 있으므로 필요시만 수정하세요.

### 6. 배포
```sh
terraform init
terraform apply
```

---

## 변수 설명
| 변수명                  | 설명                                      | 필수/옵션 | 기본값                      |
|-------------------------|-------------------------------------------|-----------|-----------------------------|
| function_name           | Lambda 함수 이름                          | 필수      | 없음                        |
| handler                 | Lambda 핸들러 경로                        | 필수      | 없음                        |
| runtime                 | Lambda 런타임 버전                        | 필수      | 없음                        |
| role_arn                | Lambda 실행 역할 ARN                      | 필수      | 없음                        |
| schedule_cron           | 스케줄 cron 식                            | 필수      | 없음                        |
| bucket                  | S3 버킷 이름                              | 필수      | 없음                        |
| prefix                  | S3 prefix                                 | 옵션      | "cw-backup"                |
| source_dir              | Lambda 소스 디렉토리 경로                  | 옵션      | "../code/python"           |
| enable_vpc              | Lambda를 VPC에 연결할지 여부               | 옵션      | false                       |
| vpc_subnet_ids          | VPC 서브넷 ID 목록                         | 옵션      | []                          |
| vpc_security_group_ids  | VPC 시큐리티 그룹 ID 목록                  | 옵션      | []                          |

---

## 자주 묻는 질문(FAQ)

**Q. Lambda 코드는 어디에 두나요?**  
A. `source_dir`에 지정한 경로(예: `../code/python`)에 Lambda 코드를 두세요.

**Q. IAM Role은 어떻게 만드나요?**  
A. Lambda 실행에 필요한 권한을 가진 IAM Role을 별도로 생성하고, 그 ARN을 `role_arn`에 입력하세요.

**Q. 여러 Lambda를 배포하고 싶으면?**  
A. `main.tf`에서 모듈을 여러 번 호출하면 됩니다. 변수만 다르게 지정하세요.

---

## 문의
- 모듈 사용 중 궁금한 점이나 개선 요청은 인프라 담당자에게 문의하세요. 