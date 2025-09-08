# auto_worklog-mcp

Claude와의 대화를 자동으로 Git 저장소에 기록하는 MCP (Model Context Protocol) 서버

## 기능

- 🔄 자동 Git 동기화 (pull → save → commit → push)
- 📝 대화 내용을 체계적인 폴더 구조로 저장
- 📊 일일 작업 요약 자동 생성
- 🌿 브랜치별 작업 분리 관리
- 📊 자동 일일 작업 요약 생성
- 🔧 Git 충돌 자동 해결

## 설치

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd auto_worklog-mcp
npm install
npm run build
```

### 2. 환경 변수 설정

`.env.example`을 `.env`로 복사하고 설정값을 입력:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
# Git 설정 (필수)
GIT_REPO_PATH=/path/to/your/work/repository
GIT_BRANCH=main
GIT_USER_NAME=Your Name
GIT_USER_EMAIL=your.email@example.com
GIT_ACCESS_TOKEN=ghp_your_personal_access_token

# 작업 브랜치 설정 (필수)
WORK_BRANCH=feature/my-work

# 프로젝트 설정 (선택 - 기본 프로젝트명)
DEFAULT_PROJECT=my-project
```

### 3. Claude Desktop 설정

Claude Desktop의 설정 파일에 MCP 서버 추가:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "auto_worklog": {
      "command": "node",
      "args": ["/absolute/path/to/auto_worklog-mcp/dist/index.js"],
      "env": {
        "GIT_REPO_PATH": "/path/to/your/repository",
        "GIT_BRANCH": "main",
        "GIT_USER_NAME": "Your Name",
        "GIT_USER_EMAIL": "your.email@example.com",
        "GIT_ACCESS_TOKEN": "your_token",
        "WORK_BRANCH": "feature/my-work",
        "DEFAULT_PROJECT": "my-project"
      }
    }
  }
}
```

## 사용법

Claude Desktop을 재시작한 후 다음 도구들을 사용할 수 있습니다:

### 1. 대화 저장

```
/use saveConversation
content: "대화 내용"
summary: "간단한 요약"
project: "프로젝트명"  # 선택사항, 기본값은 DEFAULT_PROJECT 또는 "default"
```

### 2. 일일 요약 생성

```
/use createDailySummary
date: "2025-01-08"  # 선택사항, 기본값은 어제
project: "프로젝트명"  # 선택사항
```

### 3. 저장소 동기화

```
/use syncRepository
```

### 4. 로그 목록 조회

```
/use listLogs
branch: "feature/my-work"  # 선택사항
project: "프로젝트명"  # 선택사항
date: "2025-01-08"  # 선택사항
```

### 5. 최근 요약 조회

```
/use getLastSummary
```

## 폴더 구조

```
repository/
├── 개발일지/
│   ├── main/
│   │   └── 프로젝트명/
│   │       └── 2025-01-08/
│   │           ├── 001-초기설정.md
│   │           └── 002-버그수정.md
│   └── feature-branch/
│       └── 프로젝트명/
│           └── 2025-01-08/
│               └── 001-신규기능.md
└── summaries/
    └── daily-summary-2025-01-08.md
```

## Personal Access Token 생성

### GitHub

1. GitHub Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 클릭
3. 권한 선택: `repo` (전체)
4. 토큰 생성 및 복사

### GitLab

1. User Settings → Access Tokens
2. 권한 선택: `api`, `read_repository`, `write_repository`
3. 토큰 생성 및 복사

## 문제 해결

### Git 충돌

- 자동으로 원격 변경사항을 우선하여 병합
- 병합 실패시 사용자에게 알림

### 연결 오류

- Personal Access Token 만료 확인
- 네트워크 연결 상태 확인
- Git 저장소 경로 확인

## 개발

### 로컬 테스트

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

## 라이선스

MIT