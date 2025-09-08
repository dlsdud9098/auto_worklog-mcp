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
const repoPath = ensureEnvVar('GIT_REPO_PATH');
export const config = {
    git: {
        repoPath,
        branch: ensureEnvVar('GIT_BRANCH', 'main'),
        workBranch: ensureEnvVar('WORK_BRANCH'),
        userName: ensureEnvVar('GIT_USER_NAME'),
        userEmail: ensureEnvVar('GIT_USER_EMAIL'),
        accessToken: ensureEnvVar('GIT_ACCESS_TOKEN')
    },
    gitBranch: ensureEnvVar('GIT_BRANCH', 'main'),
    paths: {
        workLogBase: repoPath,
        summariesBase: path.join(repoPath, '요약')
    },
    defaultProject: process.env.DEFAULT_PROJECT,
    useDailyNote: process.env.USE_DAILY_NOTE,
    autoCreatePR: process.env.AUTO_CREATE_PR === 'true',
    autoMergePR: process.env.AUTO_MERGE_PR === 'true',
    prTargetBranch: process.env.PR_TARGET_BRANCH || 'main',
    prMergeMethod: process.env.PR_MERGE_METHOD || 'merge'
};
const devLogPath = path.join(config.paths.workLogBase, '개발일지');
const summaryPath = path.join(config.paths.workLogBase, '요약');
if (!fs.existsSync(devLogPath)) {
    fs.mkdirSync(devLogPath, { recursive: true });
}
if (!fs.existsSync(summaryPath)) {
    fs.mkdirSync(summaryPath, { recursive: true });
}
//# sourceMappingURL=config.js.map