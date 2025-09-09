# 🔄 Auto Worklog + GitHub MCP 통합 워크플로우

## 개요
Git 작업의 충돌을 피하기 위해 역할을 분리합니다:
- **Auto Worklog MCP**: 파일 저장만 담당
- **GitHub MCP**: Git 작업 전담 (commit, push, PR)

## 설정 방법

### 1. Claude Desktop 설정 (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    // GitHub MCP - Git 작업 전담
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token"
      }
    },
    
    // Auto Worklog MCP - 파일 저장만
    "auto_worklog": {
      "command": "node",
      "args": ["/home/apic/python/auto_worklog-mcp/dist/index-simple.js"],
      "env": {
        "GIT_REPO_PATH": "/home/apic/python/worklog",
        "GIT_BRANCH": "main",
        "WORK_BRANCH": "Inyoung",
        "USE_DAILY_NOTE": "글리터 홈페이지,publishing.gltr-ous.us,auto_worklog-mcp",
        "DEFAULT_PROJECT": "글리터 홈페이지"
      }
    }
  }
}
```

## 사용 방법

### 1️⃣ 작업 시작
```bash
# GitHub MCP로 최신 코드 받기
/use github pull
```

### 2️⃣ 작업 내용 저장
```bash
# Auto Worklog로 대화 저장
/use saveWorklog
content: "작업 내용"
summary: "작업 요약"
project: "프로젝트명"
```

### 3️⃣ Git 커밋 & 푸시
```bash
# GitHub MCP로 커밋
/use github commit -m "작업 로그 추가"

# GitHub MCP로 푸시
/use github push
```

### 4️⃣ PR 생성
```bash
# GitHub MCP로 PR 생성
/use github create-pr
title: "2025-01-09 작업 로그"
base: main
head: Inyoung
body: "오늘의 작업 내용"
```

## 장점

✅ **충돌 방지**: 각 MCP가 독립적으로 작동
✅ **명확한 역할 분리**: 파일 저장 vs Git 작업
✅ **유연성**: 필요에 따라 Git 작업 제어 가능
✅ **안정성**: Git 작업 실패가 파일 저장에 영향 없음

## 자동화 스크립트

일련의 작업을 자동화하려면:

```bash
#!/bin/bash
# daily_commit.sh

cd /home/apic/python/worklog
git add .
git commit -m "$(date +%Y-%m-%d) 작업 로그"
git push origin Inyoung

# PR 생성 (gh CLI 사용)
gh pr create \
  --title "$(date +%Y-%m-%d) 작업 로그" \
  --body "오늘의 작업 내용" \
  --base main \
  --head Inyoung
```

## 문제 해결

### Q: 파일은 저장되는데 Git에 반영이 안 될 때
```bash
cd /home/apic/python/worklog
git status  # 상태 확인
git add .
git commit -m "수동 커밋"
git push
```

### Q: PR 생성이 실패할 때
```bash
# 브랜치 상태 확인
git diff main..Inyoung

# 변경사항이 없으면 빈 커밋 생성
git commit --allow-empty -m "PR 생성용 커밋"
git push
```

## 마이그레이션

기존 auto_worklog (Git 통합)에서 새 버전으로 전환:

1. Claude Desktop 재시작
2. 설정 파일에서 `index.js` → `index-simple.js` 변경
3. GitHub MCP 설정 추가
4. 테스트 실행