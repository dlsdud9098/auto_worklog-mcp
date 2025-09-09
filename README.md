# auto_worklog-mcp

Claude와의 대화를 자동으로 Git 저장소에 기록하고 Pull Request를 관리하는 MCP (Model Context Protocol) 서버

## 🎯 주요 특징

- **프로젝트별 선택적 활성화**: 특정 프로젝트에서만 worklog 저장
- **자동화된 워크플로우**: Pull, Commit, Push, PR 생성까지 자동화
- **체계적인 관리**: 브랜치별, 날짜별 자동 정리

## 기능

- 🔄 자동 Git 동기화 (pull → save → commit → push)
- 📝 대화 내용을 체계적인 폴더 구조로 저장
- 📊 일일 작업 요약 자동 생성
- 🌿 브랜치별 작업 분리 관리
- 🔀 자동 Pull Request 생성 및 병합
- 🔧 Git 충돌 자동 해결
- 📋 GitHub PR 관리 (생성, 조회, 병합)

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

# 활성화할 Claude 프로젝트 (선택)
USE_DAILY_NOTE=프로젝트1,프로젝트2  # 쉼표로 구분, 비어있으면 모든 프로젝트에서 활성화
DEFAULT_PROJECT=프로젝트1  # project 파라미터 생략 시 사용할 기본 프로젝트

# Pull Request 자동화 (선택)
AUTO_CREATE_PR=false
AUTO_MERGE_PR=false
PR_TARGET_BRANCH=main
PR_MERGE_METHOD=merge
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
        "GIT_ACCESS_TOKEN": "your_github_personal_access_token",
        "WORK_BRANCH": "feature/my-work",
        "USE_DAILY_NOTE": "프로젝트1,프로젝트2",
        "DEFAULT_PROJECT": "프로젝트1",
        "AUTO_CREATE_PR": "true",
        "AUTO_MERGE_PR": "false",
        "PR_TARGET_BRANCH": "main",
        "PR_MERGE_METHOD": "merge"
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
project: "프로젝트명"  # 선택사항, USE_DAILY_NOTE에 설정된 프로젝트명 지정
createPR: true  # 선택사항, PR 생성 여부 (AUTO_CREATE_PR이 true면 자동 생성)
```

**프로젝트 지정 방법:**
- `project` 파라미터로 프로젝트명 지정
- 생략 시 `DEFAULT_PROJECT` 사용 (없으면 'default')
- `USE_DAILY_NOTE` 목록에 없는 프로젝트는 저장되지 않음
- 목록이 비어있으면 모든 프로젝트 허용

### 2. 일일 요약 생성

```
/use createDailySummary
date: "2025-01-08"  # 선택사항, 기본값은 어제
```

### 3. 저장소 동기화

```
/use syncRepository
```

### 4. 로그 목록 조회

```
/use listLogs
branch: "feature/my-work"  # 선택사항
date: "2025-01-08"  # 선택사항
```

### 5. 최근 요약 조회

```
/use getLastSummary
```

### 6. Pull Request 생성

```
/use createPR
title: "PR 제목"
body: "PR 설명"
sourceBranch: "feature/branch"  # 선택사항, 기본값은 현재 브랜치
targetBranch: "main"  # 선택사항, 기본값은 PR_TARGET_BRANCH
```

### 7. 일일 작업 PR 생성

```
/use createDailyPR
date: "2025-01-08"  # 선택사항, 기본값은 오늘
```

### 8. PR 목록 조회

```
/use listPRs
state: "open"  # open, closed, all 중 선택
```

### 9. PR 병합

```
/use mergePR
prNumber: 123
mergeMethod: "merge"  # merge, squash, rebase 중 선택
```

## 폴더 구조

```
repository/
├── 개발일지/
│   ├── branch_name/
│   │   └── YYYY-MM-DD/
│   │       ├── 001-작업요약.md
│   │       └── 002-버그수정.md
│   └── branch_name2/
│       └── YYYY-MM-DD/
│           └── 001-신규기능.md
└── 요약/
    ├── branch_name/
    │   └── YYYY-MM-DD-요약.md
    └── branch_name2/
        └── YYYY-MM-DD-요약.md
```

## Personal Access Token 생성

### GitHub

1. GitHub Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)" 클릭
3. 권한 선택:
   - `repo` (전체) - 필수: 저장소 접근 및 PR 관리
   - `workflow` (선택) - GitHub Actions 사용 시
4. 토큰 생성 및 복사

### GitLab

1. User Settings → Access Tokens
2. 권한 선택: `api`, `read_repository`, `write_repository`
3. 토큰 생성 및 복사

## 프로젝트 설정 가이드

### 여러 프로젝트 관리

1. **특정 프로젝트만 활성화**:
   ```env
   USE_DAILY_NOTE=글리터 홈페이지,publishing.gltr-ous.us,text2cuts
   ```
   - 콤마로 구분하여 여러 프로젝트 지정
   - 목록에 있는 프로젝트에서만 worklog 저장
   - 목록에 없는 프로젝트는 경고 메시지 표시

2. **모든 프로젝트 활성화**:
   ```env
   # USE_DAILY_NOTE 설정을 비워두거나 주석 처리
   ```

3. **기본 프로젝트 설정**:
   ```env
   DEFAULT_PROJECT=글리터 홈페이지
   ```
   - project 파라미터 생략 시 사용

## 문제 해결

### Git 충돌

- 자동으로 원격 변경사항을 우선하여 병합
- 병합 실패시 사용자에게 알림

### 연결 오류

- Personal Access Token 만료 확인
- 네트워크 연결 상태 확인
- Git 저장소 경로 확인

### 프로젝트 오류

- "프로젝트 '...'는 worklog 저장이 비활성화" 메시지:
  - `USE_DAILY_NOTE`에 해당 프로젝트 추가
  - 또는 `USE_DAILY_NOTE`를 비워서 모든 프로젝트 허용

## 환경 변수 설명

### 필수 환경 변수
- `GIT_REPO_PATH`: Git 저장소 경로
- `GIT_BRANCH`: 작업 브랜치
- `GIT_USER_NAME`: Git 사용자 이름
- `GIT_USER_EMAIL`: Git 사용자 이메일
- `GIT_ACCESS_TOKEN`: GitHub Personal Access Token
- `WORK_BRANCH`: 작업 브랜치

### 선택 환경 변수
- `USE_DAILY_NOTE`: Auto worklog를 활성화할 Claude 프로젝트 목록 (쉼표 구분)
  - 예: `"글리터 홈페이지,publishing.gltr-ous.us,text2cuts"`
  - 이 목록에 있는 프로젝트에서만 worklog가 저장됨
  - 비어있으면 모든 프로젝트에서 활성화
  - 목록에 없는 프로젝트에서 시도하면 경고 메시지 표시
- `DEFAULT_PROJECT`: project 파라미터가 없을 때 사용할 기본 프로젝트
- `AUTO_CREATE_PR`: 자동 PR 생성 (`true`/`false`)
- `AUTO_MERGE_PR`: 자동 PR 병합 (`true`/`false`)
- `PR_TARGET_BRANCH`: PR 대상 브랜치 (기본값: `main`)
- `PR_MERGE_METHOD`: PR 병합 방식 (`merge`/`squash`/`rebase`)

## 워크플로우

### 자동 PR 워크플로우
1. Claude와 대화
2. 대화 내용 정리
3. `개발일지/branch/YYYY-MM-DD/NNN-요약.md` 저장
4. Git pull → commit → push
5. Pull Request 자동 생성 (`AUTO_CREATE_PR=true`)
6. PR 자동 병합 (`AUTO_MERGE_PR=true`)

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