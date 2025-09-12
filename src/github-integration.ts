import { exec } from 'child_process';
import { promisify } from 'util';
import { Config } from './config.js';

const execAsync = promisify(exec);

export class GitHubIntegration {
  constructor(private config: Config) {}

  async executeGitOperations(summary: string): Promise<string[]> {
    const results: string[] = [];
    const branch = this.config.gitBranch;
    
    try {
      // 1. Pull from main branch
      results.push('📥 Pulling latest changes from main...');
      await execAsync('git pull origin main');
      results.push('✅ Pull completed');
      
      // 2. Check if branch exists
      try {
        await execAsync(`git show-ref --verify --quiet refs/heads/${branch}`);
        // Branch exists, switch to it
        results.push(`🔀 Switching to branch ${branch}...`);
        await execAsync(`git checkout ${branch}`);
      } catch {
        // Branch doesn't exist, create it
        results.push(`🌿 Creating and switching to branch ${branch}...`);
        await execAsync(`git checkout -b ${branch}`);
      }
      results.push('✅ Branch switch completed');
      
      // 3. Add changes
      results.push('📝 Adding changes...');
      await execAsync('git add .');
      results.push('✅ Changes staged');
      
      // 4. Commit
      const commitMessage = `docs: [${branch}] ${summary}`;
      results.push('💾 Committing changes...');
      await execAsync(`git commit -m "${commitMessage}"`);
      results.push('✅ Changes committed');
      
      // 5. Push
      results.push(`🚀 Pushing to origin/${branch}...`);
      await execAsync(`git push -u origin ${branch}`);
      results.push('✅ Push completed');
      
      // 6. Create PR
      results.push('\n🔀 Creating Pull Request...');
      const prTitle = `[${branch}] ${new Date().toISOString().split('T')[0]} 작업일지`;
      const prBody = `작업일지 PR\n\n브랜치: ${branch}\n경로: ${this.config.paths.workLogBase}`;
      
      try {
        const { stdout } = await execAsync(`gh pr create --title "${prTitle}" --body "${prBody}" --base main`);
        results.push('✅ PR created successfully!');
        results.push(`📌 PR URL: ${stdout.trim()}`);
      } catch (prError) {
        // PR 생성 실패 시 (이미 PR이 있거나 gh CLI가 없는 경우)
        const prErrorMessage = prError instanceof Error ? prError.message : String(prError);
        if (prErrorMessage.includes('already exists')) {
          results.push('ℹ️ PR already exists for this branch');
        } else {
          results.push(`⚠️ Could not create PR automatically: ${prErrorMessage}`);
          results.push('\n💡 PR을 수동으로 생성하려면:');
          results.push(`gh pr create --title "${prTitle}" --body "${prBody}" --base main`);
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push(`❌ Error: ${errorMessage}`);
      
      // Provide fallback instructions
      results.push('\n💡 수동으로 다음 명령을 실행해주세요:');
      results.push(`git pull origin main`);
      results.push(`git checkout -b ${branch}`);
      results.push(`git add .`);
      results.push(`git commit -m "docs: [${branch}] ${summary}"`);
      results.push(`git push -u origin ${branch}`);
    }
    
    return results;
  }

  async createPR(branch: string): Promise<string> {
    const prTitle = `[${branch}] ${new Date().toISOString().split('T')[0]} 작업일지`;
    const prBody = `작업일지 PR\n\n브랜치: ${branch}\n경로: ${this.config.paths.workLogBase}`;
    
    try {
      const { stdout } = await execAsync(`gh pr create --title "${prTitle}" --body "${prBody}" --base main`);
      return `✅ PR created successfully:\n${stdout}`;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `❌ Failed to create PR: ${errorMessage}\n\n수동으로 GitHub에서 PR을 생성해주세요.`;
    }
  }
}