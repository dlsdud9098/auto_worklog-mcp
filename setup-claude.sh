#!/bin/bash

# auto_worklog-mcp Claude Desktop 설정 스크립트

echo "auto_worklog-mcp Claude Desktop 설정 시작..."

# 설정 파일 경로
CONFIG_FILE="$HOME/.config/Claude/claude_desktop_config.json"

# 현재 디렉토리 확인
CURRENT_DIR=$(pwd)
if [[ ! -f "$CURRENT_DIR/dist/index.js" ]]; then
    echo "❌ 에러: dist/index.js 파일을 찾을 수 없습니다."
    echo "먼저 'npm install && npm run build'를 실행해주세요."
    exit 1
fi

# 환경 변수 입력 받기
echo ""
echo "📝 설정 정보를 입력해주세요:"
echo ""

read -p "Git 저장소 경로 (기본값: $HOME/worklog): " GIT_REPO_PATH
GIT_REPO_PATH=${GIT_REPO_PATH:-"$HOME/worklog"}

read -p "Git 메인 브랜치 (기본값: main): " GIT_BRANCH
GIT_BRANCH=${GIT_BRANCH:-"main"}

read -p "Git 사용자 이름: " GIT_USER_NAME
if [[ -z "$GIT_USER_NAME" ]]; then
    echo "❌ Git 사용자 이름은 필수입니다."
    exit 1
fi

read -p "Git 사용자 이메일: " GIT_USER_EMAIL
if [[ -z "$GIT_USER_EMAIL" ]]; then
    echo "❌ Git 사용자 이메일은 필수입니다."
    exit 1
fi

read -p "Git Personal Access Token: " GIT_ACCESS_TOKEN
if [[ -z "$GIT_ACCESS_TOKEN" ]]; then
    echo "❌ Git Personal Access Token은 필수입니다."
    exit 1
fi

read -p "작업 브랜치 이름: " WORK_BRANCH
if [[ -z "$WORK_BRANCH" ]]; then
    echo "❌ 작업 브랜치 이름은 필수입니다."
    exit 1
fi

read -p "기본 프로젝트 이름 (선택사항, 기본값: default): " DEFAULT_PROJECT
DEFAULT_PROJECT=${DEFAULT_PROJECT:-"default"}

# 백업 생성
if [[ -f "$CONFIG_FILE" ]]; then
    BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d%H%M%S)"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
    echo "✅ 기존 설정 파일 백업: $BACKUP_FILE"
fi

# 새로운 MCP 서버 설정
NEW_SERVER_CONFIG=$(cat << EOF
        "auto_worklog": {
            "command": "node",
            "args": ["$CURRENT_DIR/dist/index.js"],
            "env": {
                "GIT_REPO_PATH": "$GIT_REPO_PATH",
                "GIT_BRANCH": "$GIT_BRANCH",
                "GIT_USER_NAME": "$GIT_USER_NAME",
                "GIT_USER_EMAIL": "$GIT_USER_EMAIL",
                "GIT_ACCESS_TOKEN": "$GIT_ACCESS_TOKEN",
                "WORK_BRANCH": "$WORK_BRANCH",
                "DEFAULT_PROJECT": "$DEFAULT_PROJECT"
            }
        }
EOF
)

# 설정 파일 업데이트
if [[ -f "$CONFIG_FILE" ]]; then
    # 기존 파일이 있는 경우
    if grep -q '"auto_worklog"' "$CONFIG_FILE"; then
        echo "⚠️  auto_worklog 설정이 이미 존재합니다. 덮어쓰시겠습니까? (y/n)"
        read -p "> " OVERWRITE
        if [[ "$OVERWRITE" != "y" ]]; then
            echo "설정 취소됨."
            exit 0
        fi
    fi
    
    # Python을 사용하여 JSON 업데이트
    python3 << EOF
import json
import sys

config_file = "$CONFIG_FILE"
with open(config_file, 'r') as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['auto_worklog'] = {
    "command": "node",
    "args": ["$CURRENT_DIR/dist/index.js"],
    "env": {
        "GIT_REPO_PATH": "$GIT_REPO_PATH",
        "GIT_BRANCH": "$GIT_BRANCH",
        "GIT_USER_NAME": "$GIT_USER_NAME",
        "GIT_USER_EMAIL": "$GIT_USER_EMAIL",
        "GIT_ACCESS_TOKEN": "$GIT_ACCESS_TOKEN",
        "WORK_BRANCH": "$WORK_BRANCH",
        "DEFAULT_PROJECT": "$DEFAULT_PROJECT"
    }
}

with open(config_file, 'w') as f:
    json.dump(config, f, indent=4)

print("✅ 설정 파일이 업데이트되었습니다.")
EOF

else
    # 새 파일 생성
    cat << EOF > "$CONFIG_FILE"
{
    "mcpServers": {
$NEW_SERVER_CONFIG
    }
}
EOF
    echo "✅ 새 설정 파일이 생성되었습니다."
fi

echo ""
echo "🎉 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. Claude Desktop을 완전히 종료하세요 (시스템 트레이에서도 종료)"
echo "2. Claude Desktop을 다시 시작하세요"
echo "3. 채팅창에서 다음 명령어로 테스트하세요:"
echo "   /use saveConversation"
echo ""
echo "설정 파일 위치: $CONFIG_FILE"