#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { FileManager } from './file-manager.js';
import { SummaryGenerator } from './summary-generator.js';
import { config, Config } from './config.js';

const SaveConversationSchema = z.object({
  content: z.string().describe('The conversation content to save'),
  summary: z.string().describe('A brief summary of the conversation')
});

const CreateDailySummarySchema = z.object({
  date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to yesterday)')
});


const ListLogsSchema = z.object({
  branch: z.string().optional().describe('Branch name to filter logs'),
  date: z.string().optional().describe('Date in YYYY-MM-DD format to filter logs')
});

class WorkLogMCPServer {
  private server: Server;
  private fileManager: FileManager;
  private summaryGenerator: SummaryGenerator;
  private config: Config;

  constructor() {
    this.server = new Server(
      {
        name: 'auto_worklog-mcp',
        version: '3.2.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = config;
    this.fileManager = new FileManager(config);
    this.summaryGenerator = new SummaryGenerator(config);
    
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
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
          case 'saveConversation':
            return await this.handleSaveConversation(args);
          case 'createDailySummary':
            return await this.handleCreateDailySummary(args);
          case 'listLogs':
            return await this.handleListLogs(args);
          case 'getLastSummary':
            return await this.handleGetLastSummary(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) throw error;
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleSaveConversation(args: unknown) {
    const params = SaveConversationSchema.parse(args);
    
    // 브랜치명을 프로젝트명으로 사용
    const project = this.config.gitBranch;
    
    // 1. 오늘 첫 파일이면 어제 요약 먼저 생성
    const isFirstFileToday = await this.fileManager.isFirstFileOfDay(project);
    let yesterdaySummaryPath: string | null = null;
    
    if (isFirstFileToday) {
      const yesterdaySummary = await this.summaryGenerator.createYesterdaySummary(project);
      if (yesterdaySummary) {
        yesterdaySummaryPath = await this.fileManager.saveSummary(
          yesterdaySummary.date, 
          yesterdaySummary.content, 
          project
        );
      }
    }
    
    // 2. 현재 대화 내용 저장
    const filePath = await this.fileManager.saveConversation(
      params.content,
      params.summary,
      project
    );
    
    // 3. 저장 결과 반환
    let message = `✅ 작업일지가 저장되었습니다:\n📁 ${filePath}`;
    
    if (yesterdaySummaryPath) {
      message += `\n\n📊 어제의 요약도 생성되었습니다:\n📁 ${yesterdaySummaryPath}`;
    }
    
    // Git 자동 동기화 또는 수동 안내
    if (this.config.autoGitSync) {
      message += `\n\n🔄 Git 자동 동기화가 활성화되어 있습니다.`;
      message += `\n\n💡 GitHub MCP를 사용하여 다음 명령을 실행해주세요:`;
      message += `\n\n**1. 최신 변경사항 가져오기:**`;
      message += `\n/use github pull`;
      message += `\n\n**2. 브랜치 전환/생성:**`;
      message += `\n/use github checkout -b ${this.config.gitBranch}`;
      message += `\n\n**3. 변경사항 커밋 및 푸시:**`;
      message += `\n/use github add .`;
      message += `\n/use github commit -m "docs: [${this.config.gitBranch}] 작업일지 추가"`;
      message += `\n/use github push -u origin ${this.config.gitBranch}`;
      message += `\n\n**4. PR 생성:**`;
      message += `\n/use github pr create --title "[${this.config.gitBranch}] ${new Date().toISOString().split('T')[0]} 작업일지" --body "작업일지 PR\n\n브랜치: ${this.config.gitBranch}\n경로: ${this.config.paths.workLogBase}"`;
    } else {
      message += `\n\n💡 GitHub MCP를 사용하여 Git 작업을 수행할 수 있습니다:`;
      message += `\n\n**브랜치 작업:**`;
      message += `\n1. /use github pull (최신 변경사항 가져오기)`;
      message += `\n2. /use github checkout -b ${this.config.gitBranch} (브랜치 생성/전환)`;
      message += `\n3. /use github add . (변경사항 스테이징)`;
      message += `\n4. /use github commit -m "docs: [${this.config.gitBranch}] 작업일지 추가"`;
      message += `\n5. /use github push -u origin ${this.config.gitBranch} (브랜치 푸시)`;
      message += `\n\n**PR 생성:**`;
      message += `\n/use github pr create --title "[${this.config.gitBranch}] 작업일지" --body "작업일지 PR"`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: message
        }
      ]
    };
  }

  private async handleCreateDailySummary(args: unknown) {
    const params = CreateDailySummarySchema.parse(args);
    const project = this.config.gitBranch;
    
    const summary = await this.summaryGenerator.createSummary(params.date, project);
    const summaryPath = await this.fileManager.saveSummary(
      summary.date,
      summary.content,
      project
    );
    
    return {
      content: [
        {
          type: 'text',
          text: this.config.autoGitSync 
            ? `📊 일일 요약이 생성되었습니다:\n📁 ${summaryPath}\n\n💡 GitHub MCP를 사용하여 변경사항을 커밋하고 푸시하세요:\n/use github add .\n/use github commit -m "docs: [${this.config.gitBranch}] 일일 요약 추가"\n/use github push`
            : `📊 일일 요약이 생성되었습니다:\n📁 ${summaryPath}\n\n💡 Git 작업이 필요한 경우 GitHub MCP를 사용하세요.`
        }
      ]
    };
  }

  private async handleListLogs(args: unknown) {
    const params = ListLogsSchema.parse(args);
    const project = this.config.gitBranch;
    const logs = await this.fileManager.listLogs(params.branch, project, params.date);
    
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
    
    const logList = logs.map(log => 
      `📄 ${log.date} | ${log.branch} | ${log.fileName}`
    ).join('\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `📚 작업일지 목록:\n${logList}`
        }
      ]
    };
  }

  private async handleGetLastSummary(args: unknown) {
    const project = this.config.gitBranch;
    const summary = await this.fileManager.getLastSummary(project);
    
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('auto_worklog-mcp server v3.3.0 running (file management only)');
  }
}

const server = new WorkLogMCPServer();
server.run().catch(console.error);