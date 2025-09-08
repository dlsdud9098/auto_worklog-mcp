import { StatusResult } from 'simple-git';
import { Config } from './config.js';
export declare class GitManager {
    private git;
    private config;
    constructor(config: Config);
    private initialize;
    private buildAuthUrl;
    ensureWorkBranch(): Promise<void>;
    pull(): Promise<void>;
    resolveConflicts(): Promise<void>;
    addCommitPush(filePath: string, message: string): Promise<void>;
    pushAll(message: string): Promise<void>;
    private push;
    getStatus(): Promise<{
        hasChanges: boolean;
        status: StatusResult;
    }>;
    createPullRequest(): Promise<void>;
}
//# sourceMappingURL=git-manager.d.ts.map