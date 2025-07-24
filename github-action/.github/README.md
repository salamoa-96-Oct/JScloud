# �� GitHub Actions 자동화 (Microsoft Teams)

토스페이먼츠 팀처럼 코드 리뷰 문화를 개선하기 위한 GitHub Actions 자동화입니다! **Microsoft Teams**와 연동됩니다!

## 🚀 기능

### 1. 리뷰어 자동 할당
- PR이 생성되면 자동으로 랜덤 리뷰어 할당
- PR 작성자는 제외하고 랜덤 선택
- Teams로 리뷰어에게 즉시 알림

### 2. 리뷰 리마인드 
- 매일 오후 2시에 리뷰가 필요한 PR 리마인드
- 공휴일에는 자동으로 건너뛰기
- Teams MessageCard로 각 PR별 상세 정보 제공

## 📁 파일 구조

```
.github/
├── workflows/
│   ├── auto-assign-reviewer.yml    # 리뷰어 자동 할당 워크플로우
│   └── review-reminder.yml         # 리뷰 리마인드 워크플로우
├── scripts/
│   ├── assign-reviewer.js          # 리뷰어 할당 스크립트
│   ├── notify-reviewer.js          # Teams 알림 스크립트
│   └── review-reminder.js          # 리뷰 리마인드 스크립트
├── reviewers.yml                   # 리뷰어 설정 파일
└── README.md                       # 이 파일
```

## ⚙️ 설정 방법

### 1. 리뷰어 설정
`.github/reviewers.yml` 파일을 수정하여 실제 팀원 정보로 업데이트:

```yaml
reviewers:
  - githubName: "실제GitHubUsername"
    teamsUserId: "실제TeamsEmail@company.com"
    name: "실제이름"
```

### 2. GitHub Secrets 설정
Repository Settings > Secrets and variables > Actions에서 다음 설정:

- `MSTEAMS_WEBHOOK`: Microsoft Teams Webhook URL

### 3. Microsoft Teams Webhook 설정
1. Teams 채널에서 **"..."** 메뉴 클릭
2. **"커넥터 관리"** 선택
3. **"Incoming Webhook"** 찾아서 **"구성"** 클릭
4. Webhook 이름 입력 (예: "GitHub PR 알림")
5. **"만들기"** 클릭
6. 생성된 Webhook URL을 복사하여 GitHub Secrets에 등록

## 🎯 사용법

### 자동 리뷰어 할당
1. PR 생성 또는 Ready for Review 상태로 변경
2. 자동으로 랜덤 리뷰어 할당
3. Teams로 리뷰어에게 알림

### 리뷰 리마인드
- 매일 오후 2시 자동 실행
- 리뷰가 필요한 PR 목록을 Teams로 전송
- 공휴일에는 자동으로 건너뛰기

## 🔧 커스터마이징

### 리뷰어 할당 로직 수정
`.github/scripts/assign-reviewer.js`의 `selectRandomReviewer` 함수를 수정하여:
- 특정 조건에 따른 리뷰어 선택
- 부하 분산을 위한 로직 추가
- 전문 분야별 리뷰어 매칭

### Teams 메시지 커스터마이징
`.github/scripts/notify-reviewer.js`와 `.github/scripts/review-reminder.js`에서:
- MessageCard 템플릿 수정
- 추가 정보 포함
- 버튼 액션 추가

## 📊 효과

토스페이먼츠 팀의 경험에 따르면:
- PR 리뷰 시간: 하루 내외로 단축
- 코드 리뷰 코멘트: 2배 이상 증가
- 팀 내 지식 공유: 개선
- 운영 이슈 대응 시간: 90% 감소

## 🛠️ 문제 해결

### 리뷰어가 할당되지 않는 경우
1. `.github/reviewers.yml` 파일 확인
2. GitHub username이 정확한지 확인
3. GitHub Actions 로그 확인

### Teams 알림이 오지 않는 경우
1. `MSTEAMS_WEBHOOK` 설정 확인
2. Teams Webhook URL이 유효한지 확인
3. Teams 채널에 Webhook이 제대로 연결되었는지 확인

## 📝 참고 자료

- [토스페이먼츠 기술 블로그](https://toss.tech/article/25431)
- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [Microsoft Teams MessageCard 스키마](https://docs.microsoft.com/en-us/outlook/actionable-messages/message-card-reference)
- [Teams Incoming Webhook 설정 가이드](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook) 