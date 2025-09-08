import { Config } from './config.js';
export interface PRResult {
    success: boolean;
    prUrl?: string;
    prNumber?: number;
    message: string;
}
export declare class GitHubManager {
    private octokit;
    private config;
    private git;
    private owner;
    private repo;
    constructor(config: Config);
    private getRepoInfo;
    createPullRequest(title: string, body: string, sourceBranch?: string, targetBranch?: string): Promise<PRResult>;
    listPullRequests(state?: 'open' | 'closed' | 'all'): Promise<any[]>;
    mergePullRequest(prNumber: number, mergeMethod?: 'merge' | 'squash' | 'rebase'): Promise<PRResult>;
    createDailyPR(date?: string): Promise<PRResult>;
}
//# sourceMappingURL=github-manager.d.ts.map