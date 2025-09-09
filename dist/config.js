"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
var dotenv = require("dotenv");
var path = require("path");
var fs = require("fs");
dotenv.config();
function ensureEnvVar(name, defaultValue) {
    var value = process.env[name] || defaultValue;
    if (!value) {
        throw new Error("Missing required environment variable: ".concat(name));
    }
    return value;
}
var repoPath = ensureEnvVar('GIT_REPO_PATH');
exports.config = {
    git: {
        repoPath: repoPath,
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
    enabledProjects: process.env.USE_DAILY_NOTE ? process.env.USE_DAILY_NOTE.split(',').map(function (p) { return p.trim(); }) : undefined,
    autoCreatePR: process.env.AUTO_CREATE_PR === 'true',
    autoMergePR: process.env.AUTO_MERGE_PR === 'true',
    prTargetBranch: process.env.PR_TARGET_BRANCH || 'main',
    prMergeMethod: process.env.PR_MERGE_METHOD || 'merge'
};
var devLogPath = path.join(exports.config.paths.workLogBase, '개발일지');
var summaryPath = path.join(exports.config.paths.workLogBase, '요약');
if (!fs.existsSync(devLogPath)) {
    fs.mkdirSync(devLogPath, { recursive: true });
}
if (!fs.existsSync(summaryPath)) {
    fs.mkdirSync(summaryPath, { recursive: true });
}
