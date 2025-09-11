# Claude Code에서 auto_worklog MCP 사용하기

## ✅ Claude Code에서 MCP 사용 가능!

Claude Code(Claude CLI)에서도 당신이 만든 MCP를 사용할 수 있습니다.

## 설정 방법

### 1. VS Code settings.json 위치
- **Linux**: `~/.config/Code/User/settings.json`
- **macOS**: `~/Library/Application Support/Code/User/settings.json`  
- **Windows**: `%APPDATA%\Code\User\settings.json`

### 2. settings.json에 추가할 내용

```json
{
  "claude.mcpServers": {
    "auto_worklog": {
      "command": "node",
      "args": ["/home/apic/python/auto_worklog-mcp/dist/index.js"],
      "env": {
        "WORKLOG_PATH": "/home/apic/python/worklog",
        "WORK_BRANCH": "main",
        "AUTO_GIT_SYNC": "true"
      }
    }
  }
}
```

### 3. MCP 서버 빌드 및 실행

```bash
# 빌드
npm run build

# 서버가 자동으로 시작됨 (VS Code가 관리)
```

## 사용 방법

Claude Code에서 다음 명령어로 MCP 기능 사용:

```
# 작업일지 저장
/use auto_worklog saveConversation
content: "오늘 작업 내용..."
summary: "기능 구현 완료"

# 일일 요약 생성
/use auto_worklog createDailySummary

# 작업일지 조회
/use auto_worklog listWorkLogs
```

## 중요 사항

1. **MCP 서버는 VS Code가 자동 관리**: 별도로 서버를 실행할 필요 없음
2. **환경 변수 설정**: settings.json에서 WORKLOG_PATH, WORK_BRANCH 등 설정
3. **GitHub MCP와 연동**: AUTO_GIT_SYNC=true 시 Git 작업 자동화

## 현재 상태

✅ MCP 서버 실행 중 (v3.3.0)
✅ Claude Code에서 사용 가능
✅ 설정 파일 위치 확인됨

이제 VS Code의 settings.json에 위 설정을 추가하면 Claude Code에서 auto_worklog MCP를 사용할 수 있습니다!