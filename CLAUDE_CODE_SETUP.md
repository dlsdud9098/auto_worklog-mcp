# Claude Code 설정 가이드

## 1. Claude Code 확장 설치

VS Code에서 Claude Code 확장을 설치합니다:
1. VS Code Extensions 탭 열기 (Ctrl+Shift+X)
2. "Claude Code" 검색
3. 설치

## 2. MCP 서버 설정

### Windows 설정 예시

`%APPDATA%\Code\User\settings.json` 파일을 열고 다음 내용 추가:

```json
{
  "claude.mcpServers": {
    "auto_worklog": {
      "command": "node",
      "args": ["C:/Users/apic/Documents/GitHub/auto_worklog-mcp/dist/index.js"],
      "env": {
        "WORKLOG_PATH": "C:/Users/apic/Documents/GitHub/worklog",
        "WORK_BRANCH": "Inyoung",
        "AUTO_GIT_SYNC": "true"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### macOS/Linux 설정 예시

```json
{
  "claude.mcpServers": {
    "auto_worklog": {
      "command": "node",
      "args": ["/home/apic/python/auto_worklog-mcp/dist/index.js"],
      "env": {
        "WORKLOG_PATH": "/home/apic/python/worklog",
        "WORK_BRANCH": "Inyoung",
        "AUTO_GIT_SYNC": "true"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

## 3. 경로 설정 주의사항

### Windows
- 경로에 백슬래시(`\`) 대신 슬래시(`/`) 사용
- 예: `C:/Users/apic/Documents/GitHub/auto_worklog-mcp`

### 절대 경로 사용
- 상대 경로가 아닌 절대 경로 사용
- `~` 나 환경변수는 지원되지 않을 수 있음

## 4. VS Code 재시작

설정 완료 후 VS Code를 완전히 재시작합니다:
1. VS Code 종료
2. 다시 실행
3. Claude Code 패널 열기

## 5. MCP 사용

Claude Code 패널에서:
```
/use auto_worklog saveConversation
content: "작업 내용..."
summary: "작업 요약"
```

## 6. 문제 해결

### MCP가 표시되지 않는 경우
1. settings.json 문법 확인 (쉼표, 따옴표)
2. 경로가 올바른지 확인
3. node가 설치되어 있는지 확인
4. VS Code Developer Tools (Help > Toggle Developer Tools)에서 에러 확인

### 권한 오류
- Windows: 관리자 권한으로 VS Code 실행
- macOS/Linux: 파일 권한 확인 (`chmod +x`)

## 7. 자동 Git 동기화

AUTO_GIT_SYNC=true로 설정하면:
1. 작업일지 저장 시 GitHub MCP 명령 자동 안내
2. CLAUDE.md 파일의 지침에 따라 자동 실행

## 8. 여러 프로젝트 관리

다른 브랜치나 프로젝트를 위해 여러 MCP 인스턴스 설정 가능:

```json
{
  "claude.mcpServers": {
    "worklog_main": {
      "command": "node",
      "args": ["C:/auto_worklog-mcp/dist/index.js"],
      "env": {
        "WORK_BRANCH": "main"
      }
    },
    "worklog_inyoung": {
      "command": "node",
      "args": ["C:/auto_worklog-mcp/dist/index.js"],
      "env": {
        "WORK_BRANCH": "Inyoung"
      }
    }
  }
}
```