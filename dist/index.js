#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { GitManager } from './git-manager.js';
import { FileManager } from './file-manager.js';
import { SummaryGenerator } from './summary-generator.js';
import { GitHubManager } from './github-manager.js';
import { config } from './config.js';
const SaveConversationSchema = z.object({
    content: z.string().describe('The conversation content to save'),
    summary: z.string().describe('A brief summary of the conversation'),
    project: z.string().optional().describe('Project name (defaults to config or "default")'),
    createPR: z.boolean().optional().describe('Create a pull request after saving (defaults to false)')
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
const CreatePRSchema = z.object({
    title: z.string().describe('Pull request title'),
    body: z.string().describe('Pull request description'),
    sourceBranch: z.string().optional().describe('Source branch (defaults to current branch)'),
    targetBranch: z.string().optional().describe('Target branch (defaults to main)')
});
const ListPRsSchema = z.object({
    state: z.enum(['open', 'closed', 'all']).optional().describe('PR state to filter (defaults to open)')
});
const MergePRSchema = z.object({
    prNumber: z.number().describe('Pull request number to merge'),
    mergeMethod: z.enum(['merge', 'squash', 'rebase']).optional().describe('Merge method (defaults to merge)')
});
class WorkLogMCPServer {
    server;
    gitManager;
    fileManager;
    summaryGenerator;
    githubManager;
    config;
    constructor() {
        this.server = new Server({
            name: 'auto_worklog-mcp',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.config = config;
        this.gitManager = new GitManager(config);
        this.fileManager = new FileManager(config);
        this.summaryGenerator = new SummaryGenerator(config);
        this.githubManager = new GitHubManager(config);
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
                    description: 'Save a conversation to the Git repository',
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
                    name: 'syncRepository',
                    description: 'Sync the Git repository (pull and push)',
                    inputSchema: {
                        type: 'object',
                        properties: {}
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
                },
                {
                    name: 'createPR',
                    description: 'Create a pull request on GitHub',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            title: {
                                type: 'string',
                                description: 'Pull request title'
                            },
                            body: {
                                type: 'string',
                                description: 'Pull request description'
                            },
                            sourceBranch: {
                                type: 'string',
                                description: 'Source branch (defaults to current branch)'
                            },
                            targetBranch: {
                                type: 'string',
                                description: 'Target branch (defaults to main)'
                            }
                        },
                        required: ['title', 'body']
                    }
                },
                {
                    name: 'createDailyPR',
                    description: 'Create a pull request for today\'s work logs',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            date: {
                                type: 'string',
                                description: 'Date in YYYY-MM-DD format (defaults to today)'
                            }
                        }
                    }
                },
                {
                    name: 'listPRs',
                    description: 'List pull requests',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            state: {
                                type: 'string',
                                enum: ['open', 'closed', 'all'],
                                description: 'PR state to filter (defaults to open)'
                            }
                        }
                    }
                },
                {
                    name: 'mergePR',
                    description: 'Merge a pull request',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            prNumber: {
                                type: 'number',
                                description: 'Pull request number to merge'
                            },
                            mergeMethod: {
                                type: 'string',
                                enum: ['merge', 'squash', 'rebase'],
                                description: 'Merge method (defaults to merge)'
                            }
                        },
                        required: ['prNumber']
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
                    case 'syncRepository':
                        return await this.handleSyncRepository();
                    case 'listLogs':
                        return await this.handleListLogs(args);
                    case 'getLastSummary':
                        return await this.handleGetLastSummary();
                    case 'createPR':
                        return await this.handleCreatePR(args);
                    case 'createDailyPR':
                        return await this.handleCreateDailyPR(args);
                    case 'listPRs':
                        return await this.handleListPRs(args);
                    case 'mergePR':
                        return await this.handleMergePR(args);
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
        await this.gitManager.pull();
        // 1. 오늘 첫 파일이면 어제 요약 먼저 생성
        const isFirstFileToday = await this.fileManager.isFirstFileOfDay(params.project);
        if (isFirstFileToday) {
            const yesterdaySummary = await this.summaryGenerator.createYesterdaySummary(params.project);
            if (yesterdaySummary) {
                const summaryPath = await this.fileManager.saveSummary(yesterdaySummary.date, yesterdaySummary.content, params.project);
                await this.gitManager.addCommitPush(summaryPath, `Add daily summary for ${yesterdaySummary.date}`);
            }
        }
        // 2. 현재 대화 내용 저장
        const filePath = await this.fileManager.saveConversation(params.content, params.summary, params.project);
        await this.gitManager.addCommitPush(filePath, `Add work log: ${params.summary}`);
        let prMessage = '';
        // 환경 변수로 자동 PR 생성이 활성화되어 있거나, 파라미터로 명시적으로 요청한 경우
        if (this.config.autoCreatePR || params.createPR) {
            // 한국 시간 기준 오늘 날짜
            const now = new Date();
            const kstOffset = 9 * 60; // KST는 UTC+9
            const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
            const kstTime = new Date(utcTime + (kstOffset * 60000));
            const today = kstTime.toISOString().split('T')[0];
            const result = await this.githubManager.createDailyPR(today);
            prMessage = result.success
                ? `\nPull request created: ${result.prUrl}`
                : `\nFailed to create PR: ${result.message}`;
            // 자동 병합이 활성화되어 있고 PR 생성이 성공한 경우
            if (this.config.autoMergePR && result.success && result.prNumber) {
                const mergeResult = await this.githubManager.mergePullRequest(result.prNumber, this.config.prMergeMethod || 'merge');
                prMessage += mergeResult.success
                    ? `\nPR automatically merged!`
                    : `\nFailed to auto-merge: ${mergeResult.message}`;
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `Conversation saved to ${filePath} and pushed to repository${prMessage}`
                }
            ]
        };
    }
    async handleCreateDailySummary(args) {
        const params = CreateDailySummarySchema.parse(args);
        const summary = await this.summaryGenerator.createSummary(params.date, params.project);
        const summaryPath = await this.fileManager.saveSummary(summary.date, summary.content, params.project);
        await this.gitManager.addCommitPush(summaryPath, `Add daily summary for ${summary.date}`);
        return {
            content: [
                {
                    type: 'text',
                    text: `Daily summary created and saved to ${summaryPath}`
                }
            ]
        };
    }
    async handleSyncRepository() {
        await this.gitManager.pull();
        const status = await this.gitManager.getStatus();
        if (status.hasChanges) {
            await this.gitManager.pushAll('Sync repository changes');
        }
        return {
            content: [
                {
                    type: 'text',
                    text: 'Repository synchronized successfully'
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
    async handleCreatePR(args) {
        const params = CreatePRSchema.parse(args);
        const result = await this.githubManager.createPullRequest(params.title, params.body, params.sourceBranch, params.targetBranch);
        return {
            content: [
                {
                    type: 'text',
                    text: result.success
                        ? `✅ ${result.message}\nPR URL: ${result.prUrl}`
                        : `❌ ${result.message}`
                }
            ]
        };
    }
    async handleCreateDailyPR(args) {
        const params = z.object({
            date: z.string().optional()
        }).parse(args);
        const result = await this.githubManager.createDailyPR(params.date);
        return {
            content: [
                {
                    type: 'text',
                    text: result.success
                        ? `✅ ${result.message}\nPR URL: ${result.prUrl}`
                        : `❌ ${result.message}`
                }
            ]
        };
    }
    async handleListPRs(args) {
        const params = ListPRsSchema.parse(args);
        const prs = await this.githubManager.listPullRequests(params.state || 'open');
        if (prs.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No pull requests found'
                    }
                ]
            };
        }
        const prList = prs.map(pr => `#${pr.number}: ${pr.title}\n  State: ${pr.state}\n  Branch: ${pr.head} → ${pr.base}\n  URL: ${pr.url}`).join('\n\n');
        return {
            content: [
                {
                    type: 'text',
                    text: prList
                }
            ]
        };
    }
    async handleMergePR(args) {
        const params = MergePRSchema.parse(args);
        const result = await this.githubManager.mergePullRequest(params.prNumber, params.mergeMethod || 'merge');
        return {
            content: [
                {
                    type: 'text',
                    text: result.success
                        ? `✅ ${result.message}`
                        : `❌ ${result.message}`
                }
            ]
        };
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('auto_worklog-mcp server running on stdio');
    }
}
const server = new WorkLogMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=index.js.map