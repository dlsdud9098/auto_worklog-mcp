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
import { GitManager } from './git-manager.js';
import { FileManager } from './file-manager.js';
import { SummaryGenerator } from './summary-generator.js';
import { config, Config } from './config.js';

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
  private server: Server;
  private gitManager: GitManager;
  private fileManager: FileManager;
  private summaryGenerator: SummaryGenerator;
  private config: Config;

  constructor() {
    this.server = new Server(
      {
        name: 'auto_worklog-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.config = config;
    this.gitManager = new GitManager(config);
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
    
    // Check if logging is enabled for this project
    if (this.config.enabledProjects) {
      const projectName = params.project || this.config.defaultProject || 'default';
      if (!this.config.enabledProjects.includes(projectName)) {
        return {
          content: [
            {
              type: 'text',
              text: `일지 저장이 비활성화된 프로젝트입니다: ${projectName}`
            }
          ]
        };
      }
    }
    
    await this.gitManager.pull();
    
    const isFirstFileToday = await this.fileManager.isFirstFileOfDay(params.project);
    if (isFirstFileToday) {
      const yesterdaySummary = await this.summaryGenerator.createYesterdaySummary(params.project);
      if (yesterdaySummary) {
        await this.fileManager.saveSummary(yesterdaySummary.date, yesterdaySummary.content, params.project);
      }
    }
    
    const filePath = await this.fileManager.saveConversation(
      params.content,
      params.summary,
      params.project
    );
    
    await this.gitManager.addCommitPush(
      filePath,
      `Add work log: ${params.summary}`
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `Conversation saved to ${filePath} and pushed to repository`
        }
      ]
    };
  }

  private async handleCreateDailySummary(args: unknown) {
    const params = CreateDailySummarySchema.parse(args);
    
    const summary = await this.summaryGenerator.createSummary(params.date, params.project);
    const summaryPath = await this.fileManager.saveSummary(
      summary.date,
      summary.content,
      params.project
    );
    
    await this.gitManager.addCommitPush(
      summaryPath,
      `Add daily summary for ${summary.date}`
    );
    
    return {
      content: [
        {
          type: 'text',
          text: `Daily summary created and saved to ${summaryPath}`
        }
      ]
    };
  }

  private async handleSyncRepository() {
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

  private async handleListLogs(args: unknown) {
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

  private async handleGetLastSummary() {
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('auto_worklog-mcp server running on stdio');
  }
}

const server = new WorkLogMCPServer();
server.run().catch(console.error);