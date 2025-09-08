import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface Config {
  git: {
    repoPath: string;
    branch: string;
    workBranch: string;
    userName: string;
    userEmail: string;
    accessToken: string;
  };
  gitBranch?: string;
  paths: {
    workLogBase: string;
    summariesBase: string;
  };
  defaultProject?: string;
  enabledProjects?: string[];
}

function ensureEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const repoPath = ensureEnvVar('GIT_REPO_PATH');

export const config: Config = {
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
  enabledProjects: process.env.USE_DAILY_NOTE ? process.env.USE_DAILY_NOTE.split(',').map(p => p.trim()) : undefined
};

const devLogPath = path.join(config.paths.workLogBase, '개발일지');
const summaryPath = path.join(config.paths.workLogBase, '요약');

if (!fs.existsSync(devLogPath)) {
  fs.mkdirSync(devLogPath, { recursive: true });
}

if (!fs.existsSync(summaryPath)) {
  fs.mkdirSync(summaryPath, { recursive: true });
}