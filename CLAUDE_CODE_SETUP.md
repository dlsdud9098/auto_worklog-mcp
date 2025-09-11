# Claude Code 설정 가이드  

## 1. Claude Code 설치  

### Claude CLI 설치 (아직 설치하지 않은 경우)  
```bash
npm install -g @anthropic/claude-cli  
```

## 2. MCP 서버 설정  

### 방법 1: Claude CLI 명령어로 추가 (권장)  

#### Linux/macOS  
```bash
claude mcp add auto_worklog \  
  --env WORKLOG_PATH=/home/apic/python/worklog \  
  --env WORK_BRANCH=main \  
  --env AUTO_GIT_SYNC=true \  
  -- node /home/apic/python/auto_worklog-mcp/dist/index.js  
```

#### Windows  
```bash
claude mcp add auto_worklog ^  
  --env WORKLOG_PATH=C:/Users/apic/Documents/GitHub/worklog ^  
  --env WORK_BRANCH=main ^  
  --env AUTO_GIT_SYNC=true ^  
  -- node C:/Users/apic/Documents/GitHub/auto_worklog-mcp/dist/index.js  
```

### 방법 2: VS Code settings.json 직접 수정  

#### Windows 설정 예시  

`%APPDATA%\Code\User\settings.json` 파일을 열고 다음 내용 추가:  

```json
{  
  "claude.mcpServers": {  
    "auto_worklog": {  
      "command": "node",  
      "args": ["C:/Users/apic/Documents/GitHub/auto_worklog-mcp/dist/index.js"],  
      "env": {  
        "WORKLOG_PATH": "C:/Users/apic/Documents/GitHub/worklog",  
        "WORK_BRANCH": "main",  
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

#### macOS/Linux 설정 예시  

`~/.config/Code/User/settings.json` (Linux) 또는 `~/Library/Application Support/Code/User/settings.json` (macOS):  

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

## 3. MCP 관리 명령어  

```bash
# 설정된 MCP 목록 확인  
claude mcp list  

# 특정 MCP 상세 정보 확인  
claude mcp get auto_worklog  

# MCP 제거  
claude mcp remove auto_worklog  

# 스코프 지정 (프로젝트별 설정)  
claude mcp add auto_worklog --scope project ...  
```

## 4. 경로 설정 주의사항  

### Windows  
- 경로에 백슬래시(`\`) 대신 슬래시(`/`) 사용  
- 예: `C:/Users/apic/Documents/GitHub/auto_worklog-mcp`  

### 절대 경로 사용  
- 상대 경로가 아닌 절대 경로 사용  
- `~` 나 환경변수는 지원되지 않을 수 있음  

## 5. 사용 전 준비  

### 1. MCP 빌드  
```bash
cd /path/to/auto_worklog-mcp  
npm install  
npm run build  
```

### 2. VS Code 재시작 (settings.json 수정한 경우)  
1. VS Code 종료  
2. 다시 실행  
3. Claude Code 확인  

## 6. MCP 사용  

Claude Code CLI에서:  
```
/use auto_worklog saveConversation  
content: "작업 내용..."  
summary: "작업 요약"  

/use auto_worklog createDailySummary  

/use auto_worklog listWorkLogs  
```

## 7. 문제 해결  

### MCP가 표시되지 않는 경우  
1. `claude mcp list`로 설정 확인  
2. 경로가 올바른지 확인  
3. Node.js가 설치되어 있는지 확인  
4. 빌드가 완료되었는지 확인 (`npm run build`)  

### 권한 오류  
- Windows: 관리자 권한으로 실행  
- macOS/Linux: 파일 권한 확인 (`chmod +x`)  

### MCP 서버 오류  
```bash
# 로그 확인  
claude mcp get auto_worklog  

# 재설정  
claude mcp remove auto_worklog  
claude mcp add auto_worklog ...  
```

## 8. 자동 Git 동기화  

AUTO_GIT_SYNC=true로 설정하면:  
1. 작업일지 저장 시 자동으로 Git 작업 수행  
2. GitHub MCP와 연동하여 push까지 자동화  

### Git 작업 순서  
```bash
1. git pull  
2. git checkout -b [WORK_BRANCH]  
3. git add .  
4. git commit -m "docs: 작업일지 추가"  
5. git push -u origin [WORK_BRANCH]  
```

## 9. 여러 프로젝트 관리  

### CLI로 여러 인스턴스 추가  
```bash
# 메인 브랜치용  
claude mcp add worklog_main \  
  --env WORK_BRANCH=main \  
  -- node /path/to/dist/index.js  

# 개인 브랜치용  
claude mcp add worklog_dev \  
  --env WORK_BRANCH=dev \  
  -- node /path/to/dist/index.js  
```

### settings.json으로 설정  
```json
{  
  "claude.mcpServers": {  
    "worklog_main": {  
      "command": "node",  
      "args": ["/path/to/auto_worklog-mcp/dist/index.js"],  
      "env": {  
        "WORK_BRANCH": "main",  
        "WORKLOG_PATH": "/path/to/worklog"  
      }  
    },  
    "worklog_dev": {  
      "command": "node",  
      "args": ["/path/to/auto_worklog-mcp/dist/index.js"],  
      "env": {  
        "WORK_BRANCH": "dev",  
        "WORKLOG_PATH": "/path/to/worklog"  
      }  
    }  
  }  
}  
```

## 10. 환경 변수 설명  

| 변수 | 설명 | 기본값 |  
|------|------|--------|
| WORKLOG_PATH | 작업일지 저장 경로 | `/home/apic/python/worklog` |  
| WORK_BRANCH | Git 브랜치명 및 폴더명 | `main` |  
| AUTO_GIT_SYNC | Git 자동 동기화 여부 | `false` |  

claude mcp add auto_worklog \  
    --env WORKLOG_PATH=/home/apic/python/worklog \  
    --env WORK_BRANCH=main \  
    --env AUTO_GIT_SYNC=true \  
    -- node /home/apic/python/auto_worklog-mcp/dist/index.js  

## 11. 예시  

1. User 스코프로 MCP 서버 추가  

  User 스코프(-s user)를 사용하면 모든 프로젝트에서 사용 가능하고 재시작해도  
   유지됩니다:  

  # 기본 명령어 형식  
  claude mcp add -s user <서버이름> "<실행명령어>"  

  # 예시: GitHub MCP 추가  
  claude mcp add -s user github "npx -y @modelcontextprotocol/server-github"  

  2. 환경 변수가 필요한 경우 JSON 형식 사용  

  # JSON 형식으로 추가 (환경변수 포함)  
  claude mcp add-json -s user <서버이름> '{"command": "실행파일", "args":  
  ["인자1", "인자2"], "env": {"KEY": "VALUE"}}'  

  # 예시: GitHub MCP with token  
  claude mcp add-json -s user github '{"command": "npx", "args": ["-y",  
  "@modelcontextprotocol/server-github"], "env":  
  {"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_토큰값"}}'  

  3. 현재 설정 확인  

  # MCP 서버 목록 확인  
  claude mcp list  

  # 특정 서버 상세 정보  
  claude mcp get <서버이름>  

  4. 스코프 설명  

  - user 스코프: 모든 프로젝트에서 사용, 재시작해도 유지 (추천)  
  - local 스코프: 현재 프로젝트에만 적용 (기본값)  
  - project 스코프: .mcp.json 파일에 저장 (git으로 공유 가능)  

  5. 기존 서버 제거 후 재추가  

  # 잘못 추가한 경우 제거  
  claude mcp remove <서버이름>              # local 스코프에서 제거  
  claude mcp remove -s user <서버이름>       # user 스코프에서 제거  

  # 다시 user 스코프로 추가  
  claude mcp add -s user <서버이름> "<실행명령어>"  

  6. 실제 예시  

  # 1. Auto worklog MCP를 user 스코프로 추가  
  claude mcp add-json -s user auto_worklog '{  
    "command": "node",  
    "args": ["/home/apic/python/auto_worklog-mcp/dist/index.js"],  
    "env": {  
      "WORKLOG_PATH": "/home/apic/python/worklog",  
      "WORK_BRANCH": "Inyoung",  
      "AUTO_GIT_SYNC": "true"  
    }  
  }'  

  # 2. GitHub MCP를 user 스코프로 추가  
  claude mcp add-json -s user github '{  
    "command": "npx",  
    "args": ["-y", "@modelcontextprotocol/server-github"],  
    "env": {  
      "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_실제토큰값"  
    }  
  }'  

  # 3. 확인  
  claude mcp list  

  # 4. Claude Code 재시작  
  claude restart  

  이렇게 하면 재시작 후에도 MCP 서버들이 유지됩니다!  