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
class SimpleWorkLogMCPServer {
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
                    name: 'saveWorklog',
                    description: 'Save a conversation to the worklog directory (without git operations)',
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
                        properties: {}
                    }
                }
            ]
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'saveWorklog':
                        return await this.handleSaveWorklog(args);
                    case 'createDailySummary':
                        return await this.handleCreateDailySummary(args);
                    case 'listLogs':
                        return await this.handleListLogs(args);
                    case 'getLastSummary':
                        return await this.handleGetLastSummary();
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
    async handleSaveWorklog(args) {
        const params = SaveConversationSchema.parse(args);
        // Check if logging is enabled for this Claude project
        if (this.config.enabledProjects && this.config.enabledProjects.length > 0) {
            // project 파라미터가 없으면 기본 프로젝트 사용
            if (!params.project) {
                params.project = this.config.defaultProject || 'default';
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
        // 프로젝트가 없으면 기본값 설정
        if (!params.project) {
            params.project = this.config.defaultProject || 'default';
        }
        // 1. 오늘 첫 파일이면 어제 요약 먼저 생성
        const isFirstFileToday = await this.fileManager.isFirstFileOfDay(params.project);
        if (isFirstFileToday) {
            const yesterdaySummary = await this.summaryGenerator.createYesterdaySummary(params.project);
            if (yesterdaySummary) {
                await this.fileManager.saveSummary(yesterdaySummary.date, yesterdaySummary.content, params.project);
            }
        }
        // 2. 현재 대화 내용 저장
        const filePath = await this.fileManager.saveConversation(params.content, params.summary, params.project);
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ Worklog saved to: ${filePath}\n\n💡 Git 작업은 GitHub MCP를 사용하세요:\n- Push: github push\n- PR 생성: github create-pr`
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
                    text: `✅ Daily summary created: ${summaryPath}`
                }
            ]
        };
    }
    async handleListLogs(args) {
        const params = ListLogsSchema.parse(args);
        const logs = await this.fileManager.listLogs(params.branch, params.project, params.date);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(logs, null, 2)
                }
            ]
        };
    }
    async handleGetLastSummary() {
        const summary = await this.fileManager.getLastSummary(this.config.defaultProject);
        if (!summary) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No summaries found'
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
        console.error('auto_worklog-mcp server running (simple mode - no git operations)');
    }
}
const server = new SimpleWorkLogMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index-simple.js.map