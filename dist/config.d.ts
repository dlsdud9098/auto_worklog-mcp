export interface Config {
    gitBranch: string;
    paths: {
        workLogBase: string;
        summariesBase: string;
    };
    defaultProject?: string;
    enabledProjects?: string[];
}
export declare const config: Config;
//# sourceMappingURL=config.d.ts.map