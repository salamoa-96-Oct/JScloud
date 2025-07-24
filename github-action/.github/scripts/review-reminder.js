const { getOctokit, context } = require('@actions/github');
const { readFileSync } = require('fs');
const yaml = require('yaml');
const https = require('https');
const url = require('url');

async function main() {
  try {
    // 공휴일 체크 (토스처럼!)
    if (isHoliday(new Date())) {
      console.log('📅 오늘은 공휴일입니다. 리뷰 리마인드를 건너뜁니다.');
      return;
    }

    const github = getOctokit(process.env.GITHUB_TOKEN);
    
    // 리뷰어 설정 파일 읽기
    const reviewersConfig = yaml.parse(readFileSync('.github/reviewers.yml', 'utf8'));
    
    // Open 상태의 PR 목록 가져오기
    const { data: pullRequests } = await github.rest.pulls.list({
      owner: context.repo.owner,
      repo: context.repo.repo,
      state: 'open',
      per_page: 100,
      sort: 'updated',
      direction: 'desc'
    });
    
    // 리뷰가 필요한 PR들 필터링
    const pendingReviews = await collectPendingReviews(pullRequests, github);
    
    if (pendingReviews.length === 0) {
      console.log('✅ 모든 PR이 리뷰 완료되었습니다!');
      return;
    }
    
    // Teams로 리마인드 메시지 전송
    await sendTeamsReminderMessage(pendingReviews, reviewersConfig.teams);
    
  } catch (error) {
    console.error('❌ 리뷰 리마인드 전송 중 오류 발생:', error);
    process.exit(1);
  }
}

async function collectPendingReviews(pullRequests, github) {
  const pendingReviews = [];
  
  for (const pr of pullRequests) {
    // Draft PR은 제외
    if (pr.draft) continue;
    
    // 리뷰 상태 확인
    const { data: reviews } = await github.rest.pulls.listReviews({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: pr.number
    });
    
    // 승인된 리뷰가 있는지 확인
    const hasApprovedReview = reviews.some(review => review.state === 'APPROVED');
    
    if (!hasApprovedReview) {
      pendingReviews.push({
        number: pr.number,
        title: pr.title,
        author: pr.user.login,
        url: pr.html_url,
        updatedAt: pr.updated_at,
        requestedReviewers: pr.requested_reviewers || []
      });
    }
  }
  
  return pendingReviews;
}

async function sendTeamsReminderMessage(pendingReviews, teamsConfig) {
  const messageCard = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "summary": "리뷰해주세요!",
    "themeColor": "FF6B35",
    "title": "🔔 리뷰해주세요!",
    "sections": [
      {
        "text": `현재 **${pendingReviews.length}개**의 PR이 리뷰를 기다리고 있습니다.`
      }
    ]
  };
  
  // 각 PR에 대한 섹션 추가
  const prSections = pendingReviews.map((pr, index) => {
    const reviewerMentions = pr.requestedReviewers
      .map(reviewer => `@${getTeamsUserId(reviewer.login)}`)
      .join(', ');
    
    return {
      "text": `**${index + 1}. PR #${pr.number}: ${pr.title}**\n\n👤 작성자: ${pr.author}\n⏰ 업데이트: ${formatDate(pr.updatedAt)}\n${reviewerMentions ? `🎯 리뷰어: ${reviewerMentions}` : '🎯 리뷰어 할당 필요'}\n\n[리뷰하러 가기](${pr.url})`
    };
  });
  
  messageCard.sections.push(...prSections);
  
  // Teams로 메시지 전송
  await sendTeamsMessage(messageCard, process.env.MSTEAMS_WEBHOOK);
  
  console.log(`✅ ${pendingReviews.length}개의 PR에 대한 리뷰 리마인드 전송 완료`);
}

async function sendTeamsMessage(messageCard, webhookUrl) {
  const postData = JSON.stringify(messageCard);
  const parsedUrl = url.parse(webhookUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Teams 리마인드 메시지 전송 완료');
          resolve();
        } else {
          console.error(`❌ Teams 메시지 전송 실패: ${res.statusCode} - ${data}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Teams 메시지 전송 중 오류:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

function isHoliday(date) {
  // 간단한 공휴일 체크 (토스처럼 더 정교한 로직으로 개선 가능)
  const dayOfWeek = date.getDay();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 주말 체크
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;
  
  // 주요 공휴일 체크 (간단한 예시)
  const holidays = [
    '1-1',   // 신정
    '3-1',   // 삼일절
    '5-5',   // 어린이날
    '6-6',   // 현충일
    '8-15',  // 광복절
    '10-3',  // 개천절
    '10-9',  // 한글날
    '12-25'  // 크리스마스
  ];
  
  return holidays.includes(`${month}-${day}`);
}

function getTeamsUserId(githubUsername) {
  // GitHub username을 Teams user email로 매핑하는 로직
  const reviewersConfig = yaml.parse(readFileSync('.github/reviewers.yml', 'utf8'));
  const reviewer = reviewersConfig.reviewers.find(r => r.githubName === githubUsername);
  return reviewer ? reviewer.teamsUserId : githubUsername;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

main(); 