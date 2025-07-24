const { readFileSync } = require('fs');
const yaml = require('yaml');

async function main() {
  try {
    // 리뷰어 설정 파일 읽기
    const reviewersConfig = yaml.parse(readFileSync('.github/reviewers.yml', 'utf8'));
    
    // 선택된 리뷰어 정보 읽기
    const selectedReviewer = JSON.parse(readFileSync('/tmp/selected-reviewer.json', 'utf8'));
    
    // Teams 메시지 전송
    await sendTeamsNotification(selectedReviewer, reviewersConfig.teams);
    
  } catch (error) {
    console.error('❌ Teams 알림 전송 중 오류 발생:', error);
    process.exit(1);
  }
}

async function sendTeamsNotification(reviewer, teamsConfig) {
  const https = require('https');
  const url = require('url');
  
  // GITHUB_REF에서 PR 번호 추출 (refs/pull/1460/merge -> 1460)
  const prNumber = process.env.GITHUB_REF.split('/')[2];
  
  // 브랜치 정보 (PR의 source 브랜치)
  const branchName = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || "main";
  
  // Adaptive Card 형식
  const adaptiveCard = {
    "type": "message",
    "attachments": [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": {
          "type": "AdaptiveCard",
          "version": "1.3",
          "body": [
            {
              "type": "TextBlock",
              "text": "🎯 새로운 PR 리뷰 요청!",
              "weight": "Bolder",
              "size": "Large",
              "color": "Accent"
            },
            {
              "type": "FactSet",
              "facts": [
                {
                  "title": "리뷰어",
                  "value": `${reviewer.name} (@${reviewer.githubName})`
                },
                {
                  "title": "PR 번호",
                  "value": `#${prNumber}`
                },
                {
                  "title": "저장소",
                  "value": process.env.GITHUB_REPOSITORY
                },
                {
                  "title": "브랜치",
                  "value": branchName
                }
              ]
            },
            {
              "type": "TextBlock",
              "text": `**${reviewer.name}**님, 코드 리뷰 부탁드립니다!`,
              "wrap": true
            }
          ],
          "actions": [
            {
              "type": "Action.OpenUrl",
              "title": "리뷰하러 가기",
              "url": `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/pull/${prNumber}`
            }
          ],
          "$schema": "http://adaptivecards.io/schemas/adaptive-card.json"
        }
      }
    ]
  };
  
  const postData = JSON.stringify(adaptiveCard);
  
  const webhookUrl = process.env.MSTEAMS_WEBHOOK;
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
          console.log(`✅ Teams Adaptive Card 알림 전송 완료: ${reviewer.name}`);
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

main(); 