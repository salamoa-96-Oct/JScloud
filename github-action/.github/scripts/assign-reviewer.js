const { getOctokit, context } = require('@actions/github');
const { readFileSync } = require('fs');
const yaml = require('yaml');

async function main() {
  try {
    // GitHub 클라이언트 초기화
    const github = getOctokit(process.env.GITHUB_TOKEN);
    
    // 리뷰어 설정 파일 읽기
    const reviewersConfig = yaml.parse(readFileSync('.github/reviewers.yml', 'utf8'));
    
    // 랜덤 리뷰어 선택
    const selectedReviewer = selectRandomReviewer(reviewersConfig.reviewers);
    
    if (!selectedReviewer) {
      console.log('❌ 사용 가능한 리뷰어가 없습니다.');
      return;
    }
    
    console.log(`🎯 선택된 리뷰어: ${selectedReviewer.name} (@${selectedReviewer.githubName})`);
    
    // GitHub에 리뷰어 할당
    await github.rest.pulls.requestReviewers({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.issue.number,
      reviewers: [selectedReviewer.githubName]
    });
    
    console.log(`✅ 리뷰어 할당 완료: ${selectedReviewer.githubName}`);
    
    // 선택된 리뷰어 정보를 파일에 저장 (Teams 알림용)
    const fs = require('fs');
    fs.writeFileSync('/tmp/selected-reviewer.json', JSON.stringify(selectedReviewer));
    
  } catch (error) {
    console.error('❌ 리뷰어 할당 중 오류 발생:', error);
    process.exit(1);
  }
}

function selectRandomReviewer(reviewers) {
  const prCreator = context.payload.pull_request.user.login;
  
  // PR 생성자를 제외한 후보 리뷰어 필터링
  const candidateReviewers = reviewers.filter(
    (reviewer) => reviewer.githubName !== prCreator
  );
  
  if (candidateReviewers.length === 0) {
    return null;
  }
  
  // 랜덤 선택
  const randomIndex = Math.floor(Math.random() * candidateReviewers.length);
  return candidateReviewers[randomIndex];
}

main(); 