#!/bin/bash

# Git 작업을 수행하는 스크립트
WORKLOG_PATH="${1:-/home/apic/python/worklog}"
COMMIT_MESSAGE="${2:-docs: 작업일지 자동 저장}"

cd "$WORKLOG_PATH" || exit 1

# Git pull
git pull origin main

# Git add
git add .

# Git commit
git commit -m "$COMMIT_MESSAGE"

# Git push
git push origin main

# PR 생성 (gh CLI 필요)
if command -v gh &> /dev/null; then
    # 현재 브랜치가 main이 아닌 경우만 PR 생성
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        gh pr create --title "$COMMIT_MESSAGE" --body "자동 생성된 PR입니다." --base main || true
    fi
fi

echo "Git 동기화 완료"