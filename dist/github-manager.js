import { Octokit } from '@octokit/rest';
import { simpleGit } from 'simple-git';
export class GitHubManager {
    octokit;
    config;
    git;
    owner = '';
    repo = '';
    constructor(config) {
        this.config = config;
        this.octokit = new Octokit({
            auth: config.git.accessToken
        });
        this.git = simpleGit(config.git.repoPath);
    }
    async getRepoInfo() {
        if (this.owner && this.repo)
            return;
        const remoteUrl = await this.git.getRemotes(true);
        const originUrl = remoteUrl.find((r) => r.name === 'origin')?.refs?.push || '';
        // Parse GitHub URL (https://github.com/owner/repo.git or git@github.com:owner/repo.git)
        const match = originUrl.match(/github\.com[:/]([^/]+)\/([^.]+)/);
        if (match) {
            this.owner = match[1];
            this.repo = match[2];
        }
        else {
            throw new Error('Could not parse GitHub repository information from remote URL');
        }
    }
    async createPullRequest(title, body, sourceBranch, targetBranch) {
        try {
            await this.getRepoInfo();
            const source = sourceBranch || this.config.git.branch;
            const target = targetBranch || 'main';
            // Check if source branch exists on remote
            try {
                await this.git.fetch();
            }
            catch (error) {
                console.error('Warning: Could not fetch from remote:', error);
            }
            // Create PR
            const { data: pr } = await this.octokit.pulls.create({
                owner: this.owner,
                repo: this.repo,
                title: title,
                body: body,
                head: source,
                base: target
            });
            return {
                success: true,
                prUrl: pr.html_url,
                prNumber: pr.number,
                message: `Pull request #${pr.number} created successfully`
            };
        }
        catch (error) {
            if (error.status === 422 && error.message?.includes('already exists')) {
                return {
                    success: false,
                    message: 'A pull request already exists for this branch'
                };
            }
            return {
                success: false,
                message: `Failed to create pull request: ${error.message || String(error)}`
            };
        }
    }
    async listPullRequests(state = 'open') {
        try {
            await this.getRepoInfo();
            const { data: prs } = await this.octokit.pulls.list({
                owner: this.owner,
                repo: this.repo,
                state: state,
                per_page: 10,
                sort: 'updated',
                direction: 'desc'
            });
            return prs.map(pr => ({
                number: pr.number,
                title: pr.title,
                state: pr.state,
                url: pr.html_url,
                author: pr.user?.login,
                created_at: pr.created_at,
                updated_at: pr.updated_at,
                head: pr.head.ref,
                base: pr.base.ref
            }));
        }
        catch (error) {
            console.error('Failed to list pull requests:', error);
            return [];
        }
    }
    async mergePullRequest(prNumber, mergeMethod = 'merge') {
        try {
            await this.getRepoInfo();
            const { data: result } = await this.octokit.pulls.merge({
                owner: this.owner,
                repo: this.repo,
                pull_number: prNumber,
                merge_method: mergeMethod
            });
            return {
                success: true,
                message: `Pull request #${prNumber} merged successfully`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to merge pull request: ${error.message || String(error)}`
            };
        }
    }
    async createDailyPR(date) {
        const today = date || new Date().toISOString().split('T')[0];
        const branch = this.config.git.branch;
        const project = this.config.defaultProject || 'default';
        const title = `[${project}] ${today} 작업 로그`;
        const body = `## 📝 ${today} 작업 내역

### 브랜치: ${branch}
### 프로젝트: ${project}

이 PR은 ${today}에 작성된 작업 로그를 포함합니다.

---
*자동으로 생성된 Pull Request입니다.*`;
        const targetBranch = this.config.prTargetBranch || 'main';
        return await this.createPullRequest(title, body, branch, targetBranch);
    }
}
//# sourceMappingURL=github-manager.js.map