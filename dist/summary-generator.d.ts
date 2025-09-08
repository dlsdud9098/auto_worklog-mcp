import { Config } from './config.js';
export interface SummaryResult {
    date: string;
    content: string;
}
export declare class SummaryGenerator {
    private config;
    private fileManager;
    constructor(config: Config);
    private getYesterday;
    private getKSTTimestamp;
    createSummary(date?: string, project?: string): Promise<SummaryResult>;
    createYesterdaySummary(project?: string): Promise<SummaryResult | null>;
    private generateSummaryContent;
    private generateBasicSummary;
    private createEmptySummary;
}
//# sourceMappingURL=summary-generator.d.ts.map