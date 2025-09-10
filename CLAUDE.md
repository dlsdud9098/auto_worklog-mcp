# Claude 프로젝트 지침

## 작업일지 자동 Git 동기화

이 프로젝트에서 `auto_worklog` MCP를 사용할 때 다음 규칙을 따르세요:

### AUTO_GIT_SYNC가 true로 설정된 경우

작업일지를 저장한 후 **자동으로** 다음 GitHub MCP 명령을 순차적으로 실행하세요:

1. **작업일지 저장 시**:
   ```bash
   # 1단계: 작업일지 저장 (사용자가 요청한 작업)
   /use auto_worklog saveConversation
   content: "..."
   summary: "..."
   
   # 2단계: Git 작업 자동 실행 (AUTO_GIT_SYNC=true인 경우)
   /use github checkout -b ${WORK_BRANCH}
   /use github add .
   /use github commit -m "docs: [${WORK_BRANCH}] 작업일지 추가 - ${summary}"
   /use github push -u origin ${WORK_BRANCH}
   ```

2. **일일 요약 생성 시**:
   ```bash
   # 1단계: 요약 생성 (사용자가 요청한 작업)
   /use auto_worklog createDailySummary
   
   # 2단계: Git 작업 자동 실행 (AUTO_GIT_SYNC=true인 경우)
   /use github add .
   /use github commit -m "docs: [${WORK_BRANCH}] 일일 요약 추가"
   /use github push
   ```

3. **PR 생성** (선택사항 - 사용자가 명시적으로 요청한 경우):
   ```bash
   /use github pr create --title "[${WORK_BRANCH}] ${날짜} 작업일지" --body "작업일지 PR\n\n브랜치: ${WORK_BRANCH}"
   ```

### 중요 사항

- AUTO_GIT_SYNC=true일 때는 사용자에게 추가 확인 없이 Git 명령을 자동 실행
- 각 명령의 성공/실패를 사용자에게 보고
- 브랜치가 이미 존재하는 경우 checkout 명령만 실행 (에러 무시)
- commit할 변경사항이 없는 경우 해당 단계 건너뛰기

### 환경 변수 확인

작업 시작 시 다음 환경 변수를 확인하고 사용:
- `WORKLOG_PATH`: 작업일지 저장 경로
- `WORK_BRANCH`: Git 브랜치명 (폴더명으로도 사용)
- `AUTO_GIT_SYNC`: true/false (Git 자동 동기화 여부)

## 작업 흐름 예시

사용자: "오늘 작업한 내용을 저장해줘"

Claude 응답 및 자동 실행:
1. auto_worklog saveConversation 실행
2. AUTO_GIT_SYNC=true 확인
3. GitHub MCP 명령 자동 실행 (checkout, add, commit, push)
4. 결과 보고

## 에러 처리

Git 명령 실행 중 에러 발생 시:
- 브랜치 전환 실패: 새 브랜치 생성 시도
- 커밋 실패 (nothing to commit): 정상 처리로 간주
- 푸시 실패: 에러 메시지 표시 후 수동 처리 안내