export interface Config {
    gitBranch: string;
    projectName: string;
    paths: {
        workLogBase: string;
        summariesBase: string;
    };
    autoGitSync?: boolean;
    gitAccessToken?: string;
}
export declare const config: Config;
//# sourceMappingURL=config.d.ts.map