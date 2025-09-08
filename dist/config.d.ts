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
    useDailyNote?: string;
    autoCreatePR?: boolean;
    autoMergePR?: boolean;
    prTargetBranch?: string;
    prMergeMethod?: 'merge' | 'squash' | 'rebase';
}
export declare const config: Config;
//# sourceMappingURL=config.d.ts.map