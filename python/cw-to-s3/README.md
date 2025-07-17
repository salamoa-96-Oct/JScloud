# CloudWatch Logs Exporter

CloudWatch 로그를 S3로 내보내는 Python 스크립트입니다. Lambda의 15분 제한을 해결하기 위해 Pod에서 실행할 수 있도록 설계되었습니다.

## 개요

이 스크립트는 AWS CloudWatch의 모든 로그 그룹을 S3로 내보내는 작업을 수행합니다.

### 주요 기능
- **UTC 기준 전날 0:00~ 당일 00:0* 기간의 로그 내보내기
- **배치 처리**: 한 번에 1개씩 순차적으로 처리 (BATCH_SIZE =1)
- **완료까지 대기**: 각 배치가 완료될 때까지 대기
- **상세 로깅**: 진행 상황을 실시간으로 확인

## 사용법

### 1. 환경변수 설정

스크립트 실행 전 다음 환경변수를 설정해야 합니다:

```bash
# 필수 환경변수
export TARGET_BUCKET="your-s3-bucket-name"  # S3 이름
export AWS_REGION="ap-northeast-2        # AWS 리전

# 선택 환경변수
export PREFIX="cw-backup                 # S3 prefix (기본값: ")
```

### 2. AWS 자격 증명 설정

AWS CLI 자격 증명이 설정되어 있어야 합니다

```bash
# 방법1I 설정
aws configure

# 방법 2경변수로 설정
export AWS_ACCESS_KEY_ID=your-access-key"
export AWS_SECRET_ACCESS_KEY=your-secret-key"
export AWS_SESSION_TOKEN="your-session-token  # 임시 자격 증명 사용 시
```

### 3. 스크립트 실행

```bash
# 직접 실행
python cw_logout_exporter_pod.py

# 또는 실행 권한 부여 후
chmod +x cw_logout_exporter_pod.py
./cw_logout_exporter_pod.py
```

## 출력 구조

S3에 다음과 같은 구조로 로그가 저장됩니다.

```
s3//your-bucket/
└── cw-backup/                    # PREFIX 값
    └── log-group-name/           # 로그 그룹 이름 (앞의 / 제거)
        └── 2024/01/15/          # 날짜별 폴더 (YYYY/MM/DD)
            └── exported-logs.gz  # 압축된 로그 파일
```

## 코드 구조

### 주요 함수

#### `main()`
- 메인 실행 함수
- UTC 기준 전날 000 ~ 당일 0000 기간 설정
- 모든 로그 그룹을 가져와서 배치 처리

### 처리 흐름

1. 시간 범위 설정
   ```python
   end = datetime.utcnow().replace(hour=0, minute=0ond=0 microsecond=0)
   start = end - timedelta(days=1
   ```

2. 로그 그룹 목록 가져오기
   ```python
   paginator = LOG.get_paginator("describe_log_groups")
   for page in paginator.paginate():
       for lg in page["logGroups]:
           log_groups.append(lg["logGroupName])
   ```

3. 배치 처리
   ```python
   BATCH_SIZE =1  # 한 번에 1
   for i in range(0, len(log_groups), BATCH_SIZE):
       batch = log_groups[i : i + BATCH_SIZE]
   ```4. **Export Task 생성**
   ```python
   LOG.create_export_task(
       taskName=task_name,
       logGroupName=lg_name,
       **{"from: start_ms, "to: end_ms},       destination=DEST_BUCKET,
       destinationPrefix=prefix,
   )
   ```
4. 완료까지 대기
   ```python
   while True:
       response = LOG.describe_export_tasks()
       active = [t for t in response.get("exportTasks", [])
                if t.get("taskName") in task_names
                and t.get("status,[object Object].get("code") in ("PENDING", RUNNING")]
       if not active:
           break
       time.sleep(10)
   ```

## 📊 로그 예시

```2241151030:0[__main__] Started export task: my-app-202401152241151030:10[__main__] Started export task: web-server-202401152241151030:20[__main__] Started export task: database-224115```

## ⚙️ 설정 옵션

### 배치 크기 조정
```python
BATCH_SIZE = 1  # 현재 설정: 한 번에 1개씩
# BATCH_SIZE = 5  # 더 빠른 처리: 한 번에 5씩
```
배치 크기는 현재 1개? 밖에 안되는듯...?

### 대기 시간 조정
```python
time.sleep(10 # 현재 설정: 10상태 확인
# time.sleep(30)  # 더 긴 간격: 30
```

## 🐳 Docker 실행

```dockerfile
FROM python:3.9slim

WORKDIR /app
COPY cw_logout_exporter_pod.py .

RUN pip install boto3

CMD ["python", "cw_logout_exporter_pod.py"]
```

```bash
# Docker 이미지 빌드
docker build -t cw-exporter .

# Docker 실행
docker run -e TARGET_BUCKET=your-bucket \
           -e AWS_REGION=ap-northeast-2 \
           -e PREFIX=cw-backup \
           -v ~/.aws:/root/.aws:ro \
           cw-exporter
```

## 🚨 주의사항

### 1. AWS 권한
다음 권한이 필요합니다:
- `logs:DescribeLogGroups`
- `logs:CreateExportTask`
- `logs:DescribeExportTasks`
- `s3:PutObject` (대상 S3 버킷)

### 2. S3 버킷 설정
- 대상 S3버킷이 존재해야 함
- 적절한 권한 설정 필요
- 충분한 저장 공간 확보

### 3. 네트워크
- AWS API 접근 가능한 네트워크 환경
- VPC 설정 시 적절한 보안 그룹 구성

## 🔍 트러블슈팅

### 일반적인 오류

#### 1. 권한 오류
```
ClientError: An error occurred (AccessDenied) when calling the CreateExportTask operation
```
**해결**: IAM 권한 확인 및 추가

#### 2. S3오류
```
ClientError: An error occurred (NoSuchBucket) when calling the CreateExportTask operation
```
**해결**: S3버킷 존재 여부 및 권한 확인

#### 3. 리전 오류
```
ClientError: An error occurred (InvalidParameterValue) when calling the CreateExportTask operation
```
**해결**: AWS_REGION 환경변수 설정 확인

### 로그 확인
```bash
# 상세 로그 확인
python cw_logout_exporter_pod.py21| tee export.log

# 특정 로그 그룹만 확인
aws logs describe-log-groups --log-group-name-prefix your-app
```

## 📈 성능 최적화

### 1. 배치 크기 증가
```python
BATCH_SIZE = 5  # 1에서5로 증가
```

### 2 병렬 처리
여러 인스턴스에서 동시 실행 (로그 그룹별로 분할)

### 3. 메모리 최적화
대량의 로그 그룹이 있는 경우 페이지네이션 활용

## 🔄 스케줄링

### Cron으로 자동화
```bash
# crontab 편집
crontab -e

# 매일 새벽 2시에 실행
0 * * * cd /path/to/script && python cw_logout_exporter_pod.py
```

### Kubernetes CronJob
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cw-logs-export
spec:
  schedule:0 2 * * *"  # 매일 새벽 2  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: exporter
            image: your-registry/cw-exporter:latest
            env:
            - name: TARGET_BUCKET
              value: "your-bucket"
          restartPolicy: OnFailure
```

## 📞 지원

문제가 발생하면 다음을 확인하세요

1. 환경변수 설정
2. AWS 자격 증명
3. 네트워크 연결4 로그 메시지

추가 지원이 필요하면 인프라 담당자에게 문의하세요. 