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
exports.SummaryGenerator = void 0;
var file_manager_js_1 = require("./file-manager.js");
var SummaryGenerator = /** @class */ (function () {
    function SummaryGenerator(config) {
        this.config = config;
        this.fileManager = new file_manager_js_1.FileManager(config);
    }
    SummaryGenerator.prototype.getYesterday = function () {
        // 한국 시간 기준 어제
        var now = new Date();
        var kstOffset = 9 * 60; // KST는 UTC+9
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        var kstTime = new Date(utcTime + (kstOffset * 60000));
        kstTime.setDate(kstTime.getDate() - 1);
        return kstTime.toISOString().split('T')[0];
    };
    SummaryGenerator.prototype.getKSTTimestamp = function () {
        // 한국 시간으로 타임스탬프 생성
        var now = new Date();
        var kstOffset = 9 * 60; // KST는 UTC+9
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        var kstTime = new Date(utcTime + (kstOffset * 60000));
        return kstTime.toISOString().replace('Z', '+09:00');
    };
    SummaryGenerator.prototype.createSummary = function (date, project) {
        return __awaiter(this, void 0, void 0, function () {
            var targetDate, logs, summary;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        targetDate = date || this.getYesterday();
                        return [4 /*yield*/, this.fileManager.getLogsForDate(targetDate, project)];
                    case 1:
                        logs = _a.sent();
                        if (logs.length === 0) {
                            return [2 /*return*/, {
                                    date: targetDate,
                                    content: this.createEmptySummary(targetDate)
                                }];
                        }
                        return [4 /*yield*/, this.generateSummaryContent(logs, targetDate)];
                    case 2:
                        summary = _a.sent();
                        return [2 /*return*/, {
                                date: targetDate,
                                content: summary
                            }];
                }
            });
        });
    };
    SummaryGenerator.prototype.createYesterdaySummary = function (project) {
        return __awaiter(this, void 0, void 0, function () {
            var yesterday, summaryExists, logs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        yesterday = this.getYesterday();
                        return [4 /*yield*/, this.fileManager.summaryExists(yesterday)];
                    case 1:
                        summaryExists = _a.sent();
                        if (summaryExists) {
                            console.log("Summary for ".concat(yesterday, " already exists, skipping..."));
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.fileManager.getLogsForDate(yesterday, project)];
                    case 2:
                        logs = _a.sent();
                        if (logs.length === 0) {
                            console.log("No logs found for ".concat(yesterday, ", skipping summary..."));
                            return [2 /*return*/, null];
                        }
                        console.log("Creating summary for ".concat(yesterday, " with ").concat(logs.length, " logs..."));
                        return [2 /*return*/, this.createSummary(yesterday, project)];
                }
            });
        });
    };
    SummaryGenerator.prototype.generateSummaryContent = function (logs, date) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generateBasicSummary(logs, date)];
            });
        });
    };
    SummaryGenerator.prototype.generateBasicSummary = function (logs, date) {
        var summaries = [];
        for (var _i = 0, logs_1 = logs; _i < logs_1.length; _i++) {
            var log = logs_1[_i];
            var summaryMatch = log.match(/^# (.+)$/m);
            var logNumberMatch = log.match(/Log Number: (\d{3})/);
            if (summaryMatch && logNumberMatch) {
                summaries.push("- [".concat(logNumberMatch[1], "] ").concat(summaryMatch[1]));
            }
        }
        return "# Daily Summary - ".concat(date, "\n\nBranch: ").concat(this.config.gitBranch || 'main', "\nTotal Logs: ").concat(logs.length, "\n\n## \uC791\uC5C5 \uBAA9\uB85D\n\n").concat(summaries.join('\n'), "\n\n## \uC0C1\uC138 \uB0B4\uC6A9\n\n\uC774 \uC694\uC57D\uC740 \uC790\uB3D9\uC73C\uB85C \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.\n\n---\n\n*Generated by auto_worklog-mcp at ").concat(this.getKSTTimestamp(), "*");
    };
    SummaryGenerator.prototype.createEmptySummary = function (date) {
        return "# Daily Summary - ".concat(date, "\n\nBranch: ").concat(this.config.gitBranch || 'main', "\nTotal Logs: 0\n\n## \uC791\uC5C5 \uB0B4\uC5ED \uC5C6\uC74C\n\n").concat(date, "\uC5D0\uB294 \uAE30\uB85D\uB41C \uC791\uC5C5 \uB85C\uADF8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.\n\n---\n\n*Generated by auto_worklog-mcp at ").concat(this.getKSTTimestamp(), "*");
    };
    return SummaryGenerator;
}());
exports.SummaryGenerator = SummaryGenerator;
