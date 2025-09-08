import { Config } from './config.js';
export interface LogEntry {
    branch: string;
    project: string;
    date: string;
    fileName: string;
    filePath: string;
    summary: string;
}
export declare class FileManager {
    private config;
    private todayLogsCache;
    constructor(config: Config);
    private getToday;
    private getYesterday;
    isFirstFileOfDay(project?: string): Promise<boolean>;
    getNextFileNumber(date: string, project?: string): Promise<number>;
    saveConversation(content: string, summary: string, project?: string): Promise<string>;
    saveSummary(date: string, content: string, project?: string): Promise<string>;
    listLogs(branch?: string, project?: string, date?: string): Promise<LogEntry[]>;
    private getBranches;
    private getProjects;
    getLastSummary(project?: string): Promise<string | null>;
    getLogsForDate(date: string, project?: string): Promise<string[]>;
}
//# sourceMappingURL=file-manager.d.ts.map