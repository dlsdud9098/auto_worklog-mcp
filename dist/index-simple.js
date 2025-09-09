#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var zod_1 = require("zod");
var file_manager_js_1 = require("./file-manager.js");
var summary_generator_js_1 = require("./summary-generator.js");
var config_js_1 = require("./config.js");
var SaveConversationSchema = zod_1.z.object({
    content: zod_1.z.string().describe('The conversation content to save'),
    summary: zod_1.z.string().describe('A brief summary of the conversation'),
    project: zod_1.z.string().optional().describe('Project name (defaults to config or "default")')
});
var CreateDailySummarySchema = zod_1.z.object({
    date: zod_1.z.string().optional().describe('Date in YYYY-MM-DD format (defaults to yesterday)'),
    project: zod_1.z.string().optional().describe('Project name to create summary for')
});
var ListLogsSchema = zod_1.z.object({
    branch: zod_1.z.string().optional().describe('Branch name to filter logs'),
    project: zod_1.z.string().optional().describe('Project name to filter logs'),
    date: zod_1.z.string().optional().describe('Date in YYYY-MM-DD format to filter logs')
});
var SimpleWorkLogMCPServer = /** @class */ (function () {
    function SimpleWorkLogMCPServer() {
        this.server = new index_js_1.Server({
            name: 'auto_worklog-mcp',
            version: '2.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.config = config_js_1.config;
        this.fileManager = new file_manager_js_1.FileManager(config_js_1.config);
        this.summaryGenerator = new summary_generator_js_1.SummaryGenerator(config_js_1.config);
        this.setupHandlers();
        this.setupErrorHandling();
    }
    SimpleWorkLogMCPServer.prototype.setupErrorHandling = function () {
        var _this = this;
        this.server.onerror = function (error) {
            console.error('[MCP Error]', error);
        };
        process.on('SIGINT', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.server.close()];
                    case 1:
                        _a.sent();
                        process.exit(0);
                        return [2 /*return*/];
                }
            });
        }); });
    };
    SimpleWorkLogMCPServer.prototype.setupHandlers = function () {
        var _this = this;
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, ({
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
                    })];
            });
        }); });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, function (request) { return __awaiter(_this, void 0, void 0, function () {
            var _a, name, args, _b, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = request.params, name = _a.name, args = _a.arguments;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 12, , 13]);
                        _b = name;
                        switch (_b) {
                            case 'saveWorklog': return [3 /*break*/, 2];
                            case 'createDailySummary': return [3 /*break*/, 4];
                            case 'listLogs': return [3 /*break*/, 6];
                            case 'getLastSummary': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 2: return [4 /*yield*/, this.handleSaveWorklog(args)];
                    case 3: return [2 /*return*/, _c.sent()];
                    case 4: return [4 /*yield*/, this.handleCreateDailySummary(args)];
                    case 5: return [2 /*return*/, _c.sent()];
                    case 6: return [4 /*yield*/, this.handleListLogs(args)];
                    case 7: return [2 /*return*/, _c.sent()];
                    case 8: return [4 /*yield*/, this.handleGetLastSummary()];
                    case 9: return [2 /*return*/, _c.sent()];
                    case 10: throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, "Unknown tool: ".concat(name));
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        error_1 = _c.sent();
                        if (error_1 instanceof types_js_1.McpError)
                            throw error_1;
                        throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, "Tool execution failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    case 13: return [2 /*return*/];
                }
            });
        }); });
    };
    SimpleWorkLogMCPServer.prototype.handleSaveWorklog = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var params, isFirstFileToday, yesterdaySummary, filePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = SaveConversationSchema.parse(args);
                        // Check if logging is enabled for this Claude project
                        if (this.config.enabledProjects && this.config.enabledProjects.length > 0) {
                            // project 파라미터가 없으면 기본 프로젝트 사용
                            if (!params.project) {
                                params.project = this.config.defaultProject || 'default';
                            }
                            // 프로젝트가 활성화 목록에 있는지 확인
                            if (!this.config.enabledProjects.includes(params.project)) {
                                // 활성화되지 않은 프로젝트는 저장하지 않음
                                return [2 /*return*/, {
                                        content: [
                                            {
                                                type: 'text',
                                                text: "\u26A0\uFE0F \uD504\uB85C\uC81D\uD2B8 '".concat(params.project, "'\uB294 worklog \uC800\uC7A5\uC774 \uBE44\uD65C\uC131\uD654\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.\n\n\uD65C\uC131\uD654\uB41C \uD504\uB85C\uC81D\uD2B8: ").concat(this.config.enabledProjects.join(', '), "\n\n\uC774 \uD504\uB85C\uC81D\uD2B8\uB97C \uD65C\uC131\uD654\uD558\uB824\uBA74 \uC124\uC815\uC5D0\uC11C USE_DAILY_NOTE\uC5D0 \uCD94\uAC00\uD558\uC138\uC694.")
                                            }
                                        ]
                                    }];
                            }
                        }
                        // 프로젝트가 없으면 기본값 설정
                        if (!params.project) {
                            params.project = this.config.defaultProject || 'default';
                        }
                        return [4 /*yield*/, this.fileManager.isFirstFileOfDay(params.project)];
                    case 1:
                        isFirstFileToday = _a.sent();
                        if (!isFirstFileToday) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.summaryGenerator.createYesterdaySummary(params.project)];
                    case 2:
                        yesterdaySummary = _a.sent();
                        if (!yesterdaySummary) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.fileManager.saveSummary(yesterdaySummary.date, yesterdaySummary.content, params.project)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, this.fileManager.saveConversation(params.content, params.summary, params.project)];
                    case 5:
                        filePath = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "\u2705 Worklog saved to: ".concat(filePath, "\n\n\uD83D\uDCA1 Git \uC791\uC5C5\uC740 GitHub MCP\uB97C \uC0AC\uC6A9\uD558\uC138\uC694:\n- Push: github push\n- PR \uC0DD\uC131: github create-pr")
                                    }
                                ]
                            }];
                }
            });
        });
    };
    SimpleWorkLogMCPServer.prototype.handleCreateDailySummary = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var params, summary, summaryPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = CreateDailySummarySchema.parse(args);
                        return [4 /*yield*/, this.summaryGenerator.createSummary(params.date, params.project)];
                    case 1:
                        summary = _a.sent();
                        return [4 /*yield*/, this.fileManager.saveSummary(summary.date, summary.content, params.project)];
                    case 2:
                        summaryPath = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: "\u2705 Daily summary created: ".concat(summaryPath)
                                    }
                                ]
                            }];
                }
            });
        });
    };
    SimpleWorkLogMCPServer.prototype.handleListLogs = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var params, logs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = ListLogsSchema.parse(args);
                        return [4 /*yield*/, this.fileManager.listLogs(params.branch, params.project, params.date)];
                    case 1:
                        logs = _a.sent();
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: JSON.stringify(logs, null, 2)
                                    }
                                ]
                            }];
                }
            });
        });
    };
    SimpleWorkLogMCPServer.prototype.handleGetLastSummary = function () {
        return __awaiter(this, void 0, void 0, function () {
            var summary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fileManager.getLastSummary(this.config.defaultProject)];
                    case 1:
                        summary = _a.sent();
                        if (!summary) {
                            return [2 /*return*/, {
                                    content: [
                                        {
                                            type: 'text',
                                            text: 'No summaries found'
                                        }
                                    ]
                                }];
                        }
                        return [2 /*return*/, {
                                content: [
                                    {
                                        type: 'text',
                                        text: summary
                                    }
                                ]
                            }];
                }
            });
        });
    };
    SimpleWorkLogMCPServer.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var transport;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        transport = new stdio_js_1.StdioServerTransport();
                        return [4 /*yield*/, this.server.connect(transport)];
                    case 1:
                        _a.sent();
                        console.error('auto_worklog-mcp server running (simple mode - no git operations)');
                        return [2 /*return*/];
                }
            });
        });
    };
    return SimpleWorkLogMCPServer;
}());
var server = new SimpleWorkLogMCPServer();
server.run().catch(console.error);
