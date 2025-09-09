#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { FileManager } from './file-manager.js';
import { SummaryGenerator } from './summary-generator.js';
import { config } from './config.js';
const SaveConversationSchema = z.object({
    content: z.string().describe('The conversation content to save'),
    summary: z.string().describe('A brief summary of the conversation'),
    project: z.string().optional().describe('Project name (defaults to config or "default")')
});
const CreateDailySummarySchema = z.object({
    date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to yesterday)'),
    project: z.string().optional().describe('Project name to create summary for')
});
const ListLogsSchema = z.object({
    branch: z.string().optional().describe('Branch name to filter logs'),
    project: z.string().optional().describe('Project name to filter logs'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format to filter logs')
});
class WorkLogMCPServer {
    server;
    fileManager;
    summaryGenerator;
    config;
    constructor() {
        this.server = new Server({
            name: 'auto_worklog-mcp',
            version: '2.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.config = config;
        this.fileManager = new FileManager(config);
        this.summaryGenerator = new SummaryGenerator(config);
        this.setupHandlers();
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'saveConversation',
                    description: 'Save a conversation to the worklog directory',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            content: {
                                type: 'string',
                                description: 'The conversation content to save'
                            },
                            summary: {
                                type: 'string',
                                description: 'A brief summary of the conversation'
                            },
                            project: {
                                type: 'string',
                                description: 'Project name (defaults to config or "default")'
                            }
                        },
                        required: ['content', 'summary']
                    }
                },
                {
                    name: 'createDailySummary',
                    description: 'Create a daily summary of work logs',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            date: {
                                type: 'string',
                                description: 'Date in YYYY-MM-DD format (defaults to yesterday)'
                            },
                            project: {
                                type: 'string',
                                description: 'Project name to create summary for'
                            }
                        }
                    }
                },
                {
                    name: 'listLogs',
                    description: 'List saved work logs',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            branch: {
                                type: 'string',
                                description: 'Branch name to filter logs'
                            },
                            project: {
                                type: 'string',
                                description: 'Project name to filter logs'
                            },
                            date: {
                                type: 'string',
                                description: 'Date in YYYY-MM-DD format to filter logs'
                            }
                        }
                    }
                },
                {
                    name: 'getLastSummary',
                    description: 'Get the most recent daily summary',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            project: {
                                type: 'string',
                                description: 'Project name to get summary for'
                            }
                        }
                    }
                }
            ]
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'saveConversation':
                        return await this.handleSaveConversation(args);
                    case 'createDailySummary':
                        return await this.handleCreateDailySummary(args);
                    case 'listLogs':
                        return await this.handleListLogs(args);
                    case 'getLastSummary':
                        return await this.handleGetLastSummary(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError)
                    throw error;
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    async handleSaveConversation(args) {
        const params = SaveConversationSchema.parse(args);
        // USE_DAILY_NOTE가 설정되어 있으면 해당 프로젝트만 허용
        if (this.config.enabledProjects && this.config.enabledProjects.length > 0) {
            // 프로젝트가 지정되지 않으면 저장하지 않음
            if (!params.project) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `⚠️ 프로젝트가 지정되지 않았습니다.\n\n활성화된 프로젝트: ${this.config.enabledProjects.join(', ')}\n\n위 프로젝트 중 하나를 project 파라미터로 지정하세요.`
                        }
                    ]
                };
            }
            // 프로젝트가 활성화 목록에 있는지 확인
            if (!this.config.enabledProjects.includes(params.project)) {
                // 활성화되지 않은 프로젝트는 저장하지 않음
                return {
                    content: [
                        {
                            type: 'text',
                            text: `⚠️ 프로젝트 '${params.project}'는 worklog 저장이 비활성화되어 있습니다.\n\n활성화된 프로젝트: ${this.config.enabledProjects.join(', ')}\n\n이 프로젝트를 활성화하려면 설정에서 USE_DAILY_NOTE에 추가하세요.`
                        }
                    ]
                };
            }
        }
        // USE_DAILY_NOTE가 없으면 모든 프로젝트 허용 (project 없으면 'default' 사용)
        if (!params.project) {
            params.project = 'default';
        }
        // 1. 오늘 첫 파일이면 어제 요약 먼저 생성
        const isFirstFileToday = await this.fileManager.isFirstFileOfDay(params.project);
        let yesterdaySummaryPath = null;
        if (isFirstFileToday) {
            const yesterdaySummary = await this.summaryGenerator.createYesterdaySummary(params.project);
            if (yesterdaySummary) {
                yesterdaySummaryPath = await this.fileManager.saveSummary(yesterdaySummary.date, yesterdaySummary.content, params.project);
            }
        }
        // 2. 현재 대화 내용 저장
        const filePath = await this.fileManager.saveConversation(params.content, params.summary, params.project);
        // 3. 저장 결과 반환
        let message = `✅ 작업일지가 저장되었습니다:\n📁 ${filePath}`;
        if (yesterdaySummaryPath) {
            message += `\n\n📊 어제의 요약도 생성되었습니다:\n📁 ${yesterdaySummaryPath}`;
        }
        message += `\n\n💡 Git 작업이 필요한 경우 GitHub MCP를 사용하여 다음 작업을 수행하세요:\n`;
        message += `1. git pull (최신 상태 동기화)\n`;
        message += `2. git add . (변경사항 스테이징)\n`;
        message += `3. git commit -m "docs: ${this.config.gitBranch} 작업일지 추가"\n`;
        message += `4. git push (원격 저장소에 푸시)\n`;
        message += `5. PR 생성 (필요시)`;
        return {
            content: [
                {
                    type: 'text',
                    text: message
                }
            ]
        };
    }
    async handleCreateDailySummary(args) {
        const params = CreateDailySummarySchema.parse(args);
        const summary = await this.summaryGenerator.createSummary(params.date, params.project);
        const summaryPath = await this.fileManager.saveSummary(summary.date, summary.content, params.project);
        return {
            content: [
                {
                    type: 'text',
                    text: `📊 일일 요약이 생성되었습니다:\n📁 ${summaryPath}\n\n💡 Git 작업이 필요한 경우 GitHub MCP를 사용하세요.`
                }
            ]
        };
    }
    async handleListLogs(args) {
        const params = ListLogsSchema.parse(args);
        const logs = await this.fileManager.listLogs(params.branch, params.project, params.date);
        if (logs.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: '📭 저장된 작업일지가 없습니다.'
                    }
                ]
            };
        }
        const logList = logs.map(log => `📄 ${log.date} | ${log.branch} | ${log.fileName}`).join('\n');
        return {
            content: [
                {
                    type: 'text',
                    text: `📚 작업일지 목록:\n${logList}`
                }
            ]
        };
    }
    async handleGetLastSummary(args) {
        const params = z.object({
            project: z.string().optional()
        }).parse(args);
        // USE_DAILY_NOTE가 설정되어 있고 프로젝트가 지정되지 않으면 첫 번째 프로젝트 사용
        let targetProject = params.project;
        if (!targetProject && this.config.enabledProjects && this.config.enabledProjects.length > 0) {
            targetProject = this.config.enabledProjects[0];
        }
        const summary = await this.fileManager.getLastSummary(targetProject);
        if (!summary) {
            return {
                content: [
                    {
                        type: 'text',
                        text: '📭 저장된 요약이 없습니다.'
                    }
                ]
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: summary
                }
            ]
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('auto_worklog-mcp server v2.0.0 running (file management only)');
    }
}
const server = new WorkLogMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map