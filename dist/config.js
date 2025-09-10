import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
dotenv.config();
function ensureEnvVar(name, defaultValue) {
    const value = process.env[name] || defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}
// 작업일지 저장 경로 (필수)
const workLogPath = ensureEnvVar('WORKLOG_PATH', '/home/apic/python/worklog');
// 작업 브랜치명 (필수) - 폴더명과 Git 브랜치명으로 사용
const workBranch = ensureEnvVar('WORK_BRANCH', 'main');
export const config = {
    gitBranch: workBranch,
    paths: {
        workLogBase: workLogPath,
        summariesBase: path.join(workLogPath, '요약')
    },
    autoGitSync: process.env.AUTO_GIT_SYNC === 'true'
};
// 필수 디렉토리 생성
const devLogPath = path.join(config.paths.workLogBase, '개발일지');
const summaryPath = path.join(config.paths.workLogBase, '요약');
if (!fs.existsSync(devLogPath)) {
    fs.mkdirSync(devLogPath, { recursive: true });
}
if (!fs.existsSync(summaryPath)) {
    fs.mkdirSync(summaryPath, { recursive: true });
}
//# sourceMappingURL=config.js.map