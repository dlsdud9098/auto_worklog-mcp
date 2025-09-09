# auto_worklog-mcp 사용법

## 🚀 빠른 시작

### 1. 설정 파일 복사
```bash
# 예제 설정을 Claude 설정 폴더로 복사
cp claude-config-example.json ~/.config/Claude/claude_desktop_config.json
```

### 2. 토큰 설정
`GIT_ACCESS_TOKEN`을 실제 GitHub Personal Access Token으로 교체

### 3. Claude Desktop 재시작

## 📝 설정 설명

### 필수 환경변수
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `WORKLOG_PATH` | 작업일지 저장 경로 | `/home/apic/python/worklog` |
| `WORK_BRANCH` | 작업 브랜치명 | `Inyoung` |
| `PROJECT_NAME` | 프로젝트 이름 | `글리터 홈페이지` |

### Git 자동화 (선택)
| 변수명 | 설명 | 예시 |
|--------|------|------|
| `AUTO_GIT_SYNC` | Git 자동 동기화 | `"true"` 또는 `"false"` |
| `GIT_ACCESS_TOKEN` | GitHub 토큰 | `ghp_xxxxx` |

## 💻 CLI 사용법

### 작업일지 저장
```bash
# 글리터 홈페이지 프로젝트
/use worklog_글리터 saveConversation
content: "오늘 작업한 내용..."
summary: "메인 페이지 레이아웃 수정"

# publishing 프로젝트
/use worklog_publishing saveConversation
content: "배포 스크립트 작성..."
summary: "CI/CD 파이프라인 구성"
```

### 일일 요약 생성
```bash
/use worklog_글리터 createDailySummary
date: "2025-01-15"  # 선택사항
```

### 작업일지 목록 조회
```bash
/use worklog_글리터 listLogs
date: "2025-01-15"  # 선택사항
```

### 최근 요약 조회
```bash
/use worklog_글리터 getLastSummary
```

## 📁 파일 저장 결과

```
개발일지/Inyoung/2025-01-15/
├── 001-[글리터 홈페이지]메인 페이지 레이아웃 수정.md
├── 002-[publishing.gltr-ous.us]CI CD 파이프라인 구성.md
├── 003-[text2cuts]이미지 처리 모듈.md
└── 004-[글리터 홈페이지]버그 수정.md
```

## 🔄 Git 동작 방식

### AUTO_GIT_SYNC="true"인 경우
작업일지 저장 시 자동으로:
1. Git pull
2. Git add .
3. Git commit -m "docs: [프로젝트명] 작업일지 자동 저장"
4. Git push
5. PR 생성 (GIT_ACCESS_TOKEN 설정 시)

### AUTO_GIT_SYNC="false"인 경우
작업일지 저장 후 수동으로 GitHub MCP 사용:
```bash
/use github pull
/use github add .
/use github commit -m "docs: 작업일지 추가"
/use github push
```

## 🎯 프로젝트별 설정 예시

### Git 자동화 활성화 프로젝트
```json
"worklog_글리터": {
  "env": {
    "PROJECT_NAME": "글리터 홈페이지",
    "AUTO_GIT_SYNC": "true",
    "GIT_ACCESS_TOKEN": "ghp_YOUR_TOKEN"
  }
}
```

### Git 수동 관리 프로젝트
```json
"worklog_videostt": {
  "env": {
    "PROJECT_NAME": "videostt",
    "AUTO_GIT_SYNC": "false"
  }
}
```

## 💡 팁

1. **프로젝트 키 이름**: 짧고 기억하기 쉽게 설정
   - `worklog_gl` (글리터)
   - `worklog_pub` (publishing)
   - `worklog_t2c` (text2cuts)

2. **토큰 관리**: 모든 프로젝트가 같은 토큰 사용 가능

3. **브랜치별 관리**: WORK_BRANCH를 다르게 설정하여 브랜치별 분리 가능

## ⚠️ 주의사항

- 각 프로젝트마다 별도의 MCP 서버 인스턴스 실행
- PROJECT_NAME은 파일명에 포함되므로 특수문자 피하기
- Git 자동화 사용 시 충돌 주의 (pull 먼저 실행됨)