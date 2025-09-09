import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

export interface Config {
  gitBranch: string;  // 작업 브랜치명 (일지 폴더 구조에 사용)
  projectName: string;  // 프로젝트 이름
  paths: {
    workLogBase: string;  // 일지 저장 기본 경로
    summariesBase: string;  // 요약 저장 경로
  };
}

function ensureEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// 작업일지 저장 경로 (필수)
const workLogPath = ensureEnvVar('WORKLOG_PATH', '/home/apic/python/worklog');

// 작업 브랜치명 (필수)
const workBranch = ensureEnvVar('WORK_BRANCH', 'Inyoung');

// 프로젝트 이름 (필수)
const projectName = ensureEnvVar('PROJECT_NAME');

export const config: Config = {
  gitBranch: workBranch,
  projectName: projectName,
  paths: {
    workLogBase: workLogPath,
    summariesBase: path.join(workLogPath, '요약')
  }
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