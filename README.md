# JScloud

AWS 클라우드 인프라 자동화 및 관리 도구 모음집입니다. 이 저장소는 다양한 AWS 서비스와 관련된 Terraform 모듈, Python 스크립트, 그리고 인프라 자동화 솔루션들을 포함하고 있습니다.

## 프로젝트 목적

이 저장소는 AWS 인프라 관리에 필요한 다양한 도구들을 체계적으로 정리하고, 다른 개발자들이 참고할 수 있도록 구성되었습니다. 각 프로젝트는 독립적으로 사용할 수 있으며, 필요에 따라 조합하여 사용할 수 있습니다.

## 프로젝트 구조

### 디렉토리 구조

```
JScloud/
├── README.md                    # 프로젝트 개요 및 가이드
├── .gitignore                   # Git 제외 파일 설정
├── lambda/                      # AWS Lambda 관련 프로젝트
│   ├── modules/                 # 재사용 가능한 Terraform 모듈
│   │   └── cw-export/          # CloudWatch 로그 내보내기 모듈
│   │       ├── README.md       # 모듈 사용법 및 문서
│   │       ├── main.tf         # 모듈 메인 구성
│   │       └── variables.tf    # 모듈 변수 정의
│   ├── code/                   # Lambda 소스 코드
│   │   └── python/            # Python Lambda 함수
│   │       └── cw_logout_exporter.py  # Lambda 핸들러
│   └── S3_Loggroup/           # 실제 배포 구성
│       ├── main.tf            # 메인 Terraform 구성
│       ├── vars.tf            # 변수 정의
│       ├── backend.tf         # Terraform 백엔드 설정
│       ├── data.tf            # 데이터 소스 정의
│       └── output.tf          # 출력 값 정의
└── python/                     # 독립 실행 Python 스크립트
    └── cw-to-s3/              # CloudWatch to S3 내보내기
        ├── README.md          # 스크립트 사용법 및 문서
        └── cw_logout_exporter_pod.py  # Pod 실행용 스크립트
```

### Infrastructure as Code (Terraform)

#### [Lambda Modules](./lambda/modules/)
AWS Lambda 함수 배포를 위한 재사용 가능한 Terraform 모듈들을 제공합니다.

- **[CloudWatch Export Module](./lambda/modules/cw-export/README.md)**
  - CloudWatch 로그를 S3로 자동 내보내는 Lambda 함수 배포
  - EventBridge 스케줄링, IAM 역할 자동 생성
  - VPC 설정 지원 및 완전한 인프라 자동화

#### [Infrastructure Deployments](./lambda/)
실제 인프라 배포를 위한 Terraform 구성 파일들입니다.

- **[S3 Log Group Deployment](./lambda/S3_Loggroup/)**
  - CloudWatch 로그 내보내기 인프라 전체 배포
  - S3 버킷, Lambda 함수, IAM 역할, EventBridge 규칙 통합 구성

### Python Scripts

#### [CloudWatch to S3 Exporter](./python/cw-to-s3/README.md)
- CloudWatch 로그를 S3로 내보내는 Python 스크립트
- Lambda 15분 제한을 해결하기 위한 Pod 실행 환경 지원
- 배치 처리 및 완료 대기 기능 포함
- Docker 컨테이너 실행 지원

## 기술 스택

- **Infrastructure as Code**: Terraform
- **Programming Language**: Python 3.9+
- **Cloud Provider**: AWS
- **Services**: Lambda, S3, CloudWatch, EventBridge, IAM
- **Container**: Docker (선택사항)

## 빠른 시작

### 1. CloudWatch 로그 내보내기 설정

```bash
# 1. Terraform 모듈 사용
cd lambda/S3_Loggroup
terraform init
terraform apply

# 2. Python 스크립트 직접 실행
cd python/cw-to-s3
python cw_logout_exporter_pod.py
```

### 2. 환경 변수 설정

```bash
export TARGET_BUCKET="your-s3-bucket-name"
export AWS_REGION="ap-northeast-2"
export PREFIX="cw-backup"
```

## 상세 문서

각 프로젝트의 상세한 사용법과 설정 방법은 해당 디렉토리의 README 파일을 참조하세요:

- [CloudWatch Export Terraform Module](./lambda/modules/cw-export/README.md)
- [CloudWatch to S3 Python Exporter](./python/cw-to-s3/README.md)

## 🤝 기여하기

이 프로젝트는 지속적으로 발전하고 있습니다. 새로운 기능이나 개선사항이 있다면 언제든지 기여해주세요!

### 기여 방법
1. 이슈 생성 또는 기존 이슈 확인
2. Fork 후 브랜치 생성
3. 코드 작성 및 테스트
4. Pull Request 생성

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🔗 관련 링크

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)

---

**💡 Tip**: 각 프로젝트는 독립적으로 사용할 수 있지만, 함께 사용하면 더욱 강력한 자동화 솔루션을 구축할 수 있습니다!