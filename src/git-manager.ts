import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import { Config } from './config.js';

export class GitManager {
  private git: SimpleGit;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.git = simpleGit(config.git.repoPath);
    this.initialize();
  }

  private async initialize() {
    await this.git.addConfig('user.name', this.config.git.userName);
    await this.git.addConfig('user.email', this.config.git.userEmail);
    
    const remotes = await this.git.getRemotes(true);
    if (remotes.length > 0) {
      const remote = remotes[0];
      if (remote.refs.push && !remote.refs.push.includes(this.config.git.accessToken)) {
        const newUrl = this.buildAuthUrl(remote.refs.push);
        await this.git.remote(['set-url', 'origin', newUrl]);
      }
    }
  }

  private buildAuthUrl(url: string): string {
    const urlObj = new URL(url);
    urlObj.username = this.config.git.accessToken;
    urlObj.password = 'x-oauth-basic';
    return urlObj.toString();
  }

  async ensureWorkBranch(): Promise<void> {
    const branches = await this.git.branch();
    const currentBranch = branches.current;
    
    if (currentBranch !== this.config.git.workBranch) {
      if (branches.all.includes(this.config.git.workBranch)) {
        await this.git.checkout(this.config.git.workBranch);
      } else {
        await this.git.checkoutBranch(
          this.config.git.workBranch,
          `origin/${this.config.git.branch}`
        );
      }
    }
  }

  async pull(): Promise<void> {
    try {
      await this.ensureWorkBranch();
      await this.git.pull('origin', this.config.git.workBranch, {
        '--rebase': 'false',
        '--strategy': 'recursive',
        '--strategy-option': 'theirs'
      });
    } catch (error) {
      console.error('Pull failed, attempting to resolve conflicts:', error);
      await this.resolveConflicts();
    }
  }

  async resolveConflicts(): Promise<void> {
    const status = await this.git.status();
    
    if (status.conflicted.length > 0) {
      console.log('Resolving conflicts by accepting remote changes...');
      
      for (const file of status.conflicted) {
        await this.git.checkout(['--theirs', file]);
        await this.git.add(file);
      }
      
      try {
        await this.git.commit('Auto-resolve conflicts - accepting remote changes');
      } catch (error) {
        console.log('No conflicts to commit or already resolved');
      }
    }
  }

  async addCommitPush(filePath: string, message: string): Promise<void> {
    await this.ensureWorkBranch();
    await this.git.add(filePath);
    
    const status = await this.git.status();
    if (status.staged.length > 0) {
      await this.git.commit(message);
      await this.push();
    }
  }

  async pushAll(message: string): Promise<void> {
    await this.ensureWorkBranch();
    await this.git.add('.');
    
    const status = await this.git.status();
    if (status.staged.length > 0) {
      await this.git.commit(message);
      await this.push();
    }
  }

  private async push(): Promise<void> {
    try {
      await this.git.push('origin', this.config.git.workBranch);
    } catch (error) {
      console.error('Push failed, attempting to pull and retry:', error);
      await this.pull();
      await this.git.push('origin', this.config.git.workBranch);
    }
  }

  async getStatus(): Promise<{ hasChanges: boolean; status: StatusResult }> {
    const status = await this.git.status();
    const hasChanges = status.modified.length > 0 || 
                      status.not_added.length > 0 || 
                      status.deleted.length > 0;
    
    return { hasChanges, status };
  }

  async createPullRequest(): Promise<void> {
    console.log(`
      Please create a Pull Request from branch '${this.config.git.workBranch}' 
      to '${this.config.git.branch}' using your Git provider's web interface.
    `);
  }
}