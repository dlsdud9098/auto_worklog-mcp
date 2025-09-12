import { Config } from './config.js';
export declare class GitHubIntegration {
    private config;
    constructor(config: Config);
    executeGitOperations(summary: string): Promise<string[]>;
    createPR(branch: string): Promise<string>;
}
//# sourceMappingURL=github-integration.d.ts.map