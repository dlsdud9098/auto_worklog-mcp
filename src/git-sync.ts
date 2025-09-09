import { exec } from 'child_process';
import { promisify } from 'util';
import { Config } from './config.js';

const execAsync = promisify(exec);

export class GitSync {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async syncRepository(): Promise<{ success: boolean; message: string }> {
    if (!this.config.autoGitSync) {
      return { success: true, message: 'Git 자동 동기화가 비활성화되어 있습니다.' };
    }

    try {
      const workDir = this.config.paths.workLogBase;
      
      // 1. Git pull
      console.log('Git pull 실행 중...');
      await execAsync('git pull origin main', { cwd: workDir });
      
      // 2. Git add
      console.log('변경사항 스테이징...');
      await execAsync('git add .', { cwd: workDir });
      
      // 3. Git commit
      const commitMessage = `docs: [${this.config.projectName}] 작업일지 자동 저장`;
      console.log('커밋 생성 중...');
      try {
        await execAsync(`git commit -m "${commitMessage}"`, { cwd: workDir });
      } catch (error: any) {
        if (error.message.includes('nothing to commit')) {
          return { success: true, message: '커밋할 변경사항이 없습니다.' };
        }
        throw error;
      }
      
      // 4. Git push
      console.log('원격 저장소에 푸시 중...');
      await execAsync('git push origin main', { cwd: workDir });
      
      // 5. PR 생성 (옵션)
      if (this.config.gitAccessToken) {
        console.log('PR 생성 시도 중...');
        try {
          const prTitle = `[${this.config.projectName}] ${new Date().toISOString().split('T')[0]} 작업일지`;
          const prBody = `자동 생성된 작업일지 PR입니다.\n\n프로젝트: ${this.config.projectName}`;
          
          await execAsync(
            `gh pr create --title "${prTitle}" --body "${prBody}" --base main`,
            { 
              cwd: workDir,
              env: { ...process.env, GH_TOKEN: this.config.gitAccessToken }
            }
          );
          
          return { success: true, message: 'Git 동기화 및 PR 생성 완료!' };
        } catch (prError: any) {
          // PR 생성 실패는 무시 (이미 존재하거나 main 브랜치인 경우)
          console.log('PR 생성 건너뜀:', prError.message);
        }
      }
      
      return { success: true, message: 'Git 동기화 완료!' };
      
    } catch (error: any) {
      console.error('Git 동기화 실패:', error);
      return { 
        success: false, 
        message: `Git 동기화 실패: ${error.message}`
      };
    }
  }

  async performGitOperations(operations: string[]): Promise<{ success: boolean; message: string }> {
    if (!this.config.autoGitSync) {
      return { success: true, message: 'Git 자동 동기화가 비활성화되어 있습니다.' };
    }

    const results: string[] = [];
    const workDir = this.config.paths.workLogBase;

    for (const operation of operations) {
      try {
        console.log(`실행 중: ${operation}`);
        const { stdout, stderr } = await execAsync(operation, { cwd: workDir });
        if (stdout) results.push(stdout.trim());
        if (stderr && !stderr.includes('warning')) results.push(stderr.trim());
      } catch (error: any) {
        return {
          success: false,
          message: `Git 작업 실패 (${operation}): ${error.message}`
        };
      }
    }

    return {
      success: true,
      message: results.length > 0 ? results.join('\n') : 'Git 작업 완료'
    };
  }
}