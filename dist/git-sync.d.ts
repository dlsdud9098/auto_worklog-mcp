import { Config } from './config.js';
export declare class GitSync {
    private config;
    constructor(config: Config);
    syncRepository(): Promise<{
        success: boolean;
        message: string;
    }>;
    performGitOperations(operations: string[]): Promise<{
        success: boolean;
        message: string;
    }>;
}
//# sourceMappingURL=git-sync.d.ts.map