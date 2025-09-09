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
exports.FileManager = void 0;
var fs = require("fs/promises");
var path = require("path");
var FileManager = /** @class */ (function () {
    function FileManager(config) {
        this.todayLogsCache = new Map();
        this.config = config;
    }
    FileManager.prototype.getToday = function () {
        // 한국 시간으로 변환
        var now = new Date();
        var kstOffset = 9 * 60; // KST는 UTC+9
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        var kstTime = new Date(utcTime + (kstOffset * 60000));
        return kstTime.toISOString().split('T')[0];
    };
    FileManager.prototype.getYesterday = function () {
        // 한국 시간 기준 어제
        var now = new Date();
        var kstOffset = 9 * 60; // KST는 UTC+9
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        var kstTime = new Date(utcTime + (kstOffset * 60000));
        kstTime.setDate(kstTime.getDate() - 1);
        return kstTime.toISOString().split('T')[0];
    };
    FileManager.prototype.getKSTTimestamp = function () {
        // 한국 시간으로 타임스탬프 생성
        var now = new Date();
        var kstOffset = 9 * 60; // KST는 UTC+9
        var utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        var kstTime = new Date(utcTime + (kstOffset * 60000));
        return kstTime.toISOString().replace('Z', '+09:00');
    };
    FileManager.prototype.isFirstFileOfDay = function (project) {
        return __awaiter(this, void 0, void 0, function () {
            var today, branch, dirPath, files, mdFiles, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        today = this.getToday();
                        branch = this.config.gitBranch || 'main';
                        dirPath = path.join(this.config.paths.workLogBase, '개발일지', branch, today);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.readdir(dirPath)];
                    case 2:
                        files = _a.sent();
                        mdFiles = files.filter(function (f) { return f.endsWith('.md'); });
                        return [2 /*return*/, mdFiles.length === 0];
                    case 3:
                        error_1 = _a.sent();
                        return [2 /*return*/, true];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FileManager.prototype.getNextFileNumber = function (date, project) {
        return __awaiter(this, void 0, void 0, function () {
            var branch, cacheKey, nextNum, dirPath, files, mdFiles, maxNumber, _i, mdFiles_1, file, match, num, nextNum, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        branch = this.config.gitBranch || 'main';
                        cacheKey = "".concat(branch, "/").concat(date);
                        if (this.todayLogsCache.has(cacheKey)) {
                            nextNum = (this.todayLogsCache.get(cacheKey) || 0) + 1;
                            this.todayLogsCache.set(cacheKey, nextNum);
                            return [2 /*return*/, nextNum];
                        }
                        dirPath = path.join(this.config.paths.workLogBase, '개발일지', branch, date);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs.readdir(dirPath)];
                    case 2:
                        files = _a.sent();
                        mdFiles = files.filter(function (f) { return f.endsWith('.md'); });
                        maxNumber = 0;
                        for (_i = 0, mdFiles_1 = mdFiles; _i < mdFiles_1.length; _i++) {
                            file = mdFiles_1[_i];
                            match = file.match(/^(\d{3})-/);
                            if (match) {
                                num = parseInt(match[1], 10);
                                if (num > maxNumber)
                                    maxNumber = num;
                            }
                        }
                        nextNum = maxNumber + 1;
                        this.todayLogsCache.set(cacheKey, nextNum);
                        return [2 /*return*/, nextNum];
                    case 3:
                        error_2 = _a.sent();
                        this.todayLogsCache.set(cacheKey, 1);
                        return [2 /*return*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FileManager.prototype.saveConversation = function (content, summary, project) {
        return __awaiter(this, void 0, void 0, function () {
            var today, branch, fileNumber, dirPath, paddedNumber, sanitizedSummary, fileName, filePath, fileContent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        today = this.getToday();
                        branch = this.config.gitBranch || 'main';
                        return [4 /*yield*/, this.getNextFileNumber(today)];
                    case 1:
                        fileNumber = _a.sent();
                        dirPath = path.join(this.config.paths.workLogBase, '개발일지', branch, today);
                        return [4 /*yield*/, fs.mkdir(dirPath, { recursive: true })];
                    case 2:
                        _a.sent();
                        paddedNumber = String(fileNumber).padStart(3, '0');
                        sanitizedSummary = summary.replace(/[^a-zA-Z0-9가-힣\s_]/g, '').substring(0, 50);
                        fileName = "".concat(paddedNumber, "-").concat(sanitizedSummary, ".md");
                        filePath = path.join(dirPath, fileName);
                        fileContent = "# ".concat(summary, "\n\nDate: ").concat(today, "\nBranch: ").concat(branch, "\nLog Number: ").concat(paddedNumber, "\n\n---\n\n").concat(content, "\n\n---\n\n*Generated by auto_worklog-mcp at ").concat(this.getKSTTimestamp(), "*");
                        return [4 /*yield*/, fs.writeFile(filePath, fileContent, 'utf-8')];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, filePath];
                }
            });
        });
    };
    FileManager.prototype.saveSummary = function (date, content, project) {
        return __awaiter(this, void 0, void 0, function () {
            var branch, fileName, dirPath, filePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        branch = this.config.gitBranch || 'main';
                        fileName = "".concat(date, "-\uC694\uC57D.md");
                        dirPath = path.join(this.config.paths.workLogBase, '요약', branch);
                        filePath = path.join(dirPath, fileName);
                        return [4 /*yield*/, fs.mkdir(dirPath, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, fs.writeFile(filePath, content, 'utf-8')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, filePath];
                }
            });
        });
    };
    FileManager.prototype.listLogs = function (branch, project, date) {
        return __awaiter(this, void 0, void 0, function () {
            var logs, workLogPath, branches, _a, _i, branches_1, br, branchPath, dates, _b, _c, dates_1, dt, datePath, files, _d, files_1, file, match, error_3, error_4;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        logs = [];
                        workLogPath = path.join(this.config.paths.workLogBase, '개발일지');
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 16, , 17]);
                        if (!branch) return [3 /*break*/, 2];
                        _a = [branch];
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, fs.readdir(workLogPath)];
                    case 3:
                        _a = _e.sent();
                        _e.label = 4;
                    case 4:
                        branches = _a;
                        _i = 0, branches_1 = branches;
                        _e.label = 5;
                    case 5:
                        if (!(_i < branches_1.length)) return [3 /*break*/, 15];
                        br = branches_1[_i];
                        branchPath = path.join(workLogPath, br);
                        if (!date) return [3 /*break*/, 6];
                        _b = [date];
                        return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, fs.readdir(branchPath)];
                    case 7:
                        _b = _e.sent();
                        _e.label = 8;
                    case 8:
                        dates = _b;
                        _c = 0, dates_1 = dates;
                        _e.label = 9;
                    case 9:
                        if (!(_c < dates_1.length)) return [3 /*break*/, 14];
                        dt = dates_1[_c];
                        if (!dt.match(/^\d{4}-\d{2}-\d{2}$/))
                            return [3 /*break*/, 13];
                        datePath = path.join(branchPath, dt);
                        _e.label = 10;
                    case 10:
                        _e.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, fs.readdir(datePath)];
                    case 11:
                        files = _e.sent();
                        for (_d = 0, files_1 = files; _d < files_1.length; _d++) {
                            file = files_1[_d];
                            if (!file.endsWith('.md'))
                                continue;
                            match = file.match(/^(\d{3})-(.+)\.md$/);
                            if (match) {
                                logs.push({
                                    branch: br,
                                    date: dt,
                                    fileName: file,
                                    filePath: path.join(datePath, file),
                                    summary: match[2]
                                });
                            }
                        }
                        return [3 /*break*/, 13];
                    case 12:
                        error_3 = _e.sent();
                        return [3 /*break*/, 13];
                    case 13:
                        _c++;
                        return [3 /*break*/, 9];
                    case 14:
                        _i++;
                        return [3 /*break*/, 5];
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        error_4 = _e.sent();
                        return [2 /*return*/, []];
                    case 17: return [2 /*return*/, logs.sort(function (a, b) {
                            var dateCompare = b.date.localeCompare(a.date);
                            if (dateCompare !== 0)
                                return dateCompare;
                            return b.fileName.localeCompare(a.fileName);
                        })];
                }
            });
        });
    };
    FileManager.prototype.getBranches = function () {
        return __awaiter(this, void 0, void 0, function () {
            var items, branches, _i, items_1, item, itemPath, stat, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, fs.readdir(this.config.paths.workLogBase)];
                    case 1:
                        items = _a.sent();
                        branches = [];
                        _i = 0, items_1 = items;
                        _a.label = 2;
                    case 2:
                        if (!(_i < items_1.length)) return [3 /*break*/, 5];
                        item = items_1[_i];
                        itemPath = path.join(this.config.paths.workLogBase, item);
                        return [4 /*yield*/, fs.stat(itemPath)];
                    case 3:
                        stat = _a.sent();
                        if (stat.isDirectory()) {
                            branches.push(item);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, branches];
                    case 6:
                        error_5 = _a.sent();
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    FileManager.prototype.getProjects = function (branch) {
        return __awaiter(this, void 0, void 0, function () {
            var branchPath, items, projects, _i, items_2, item, itemPath, stat, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        branchPath = path.join(this.config.paths.workLogBase, branch);
                        return [4 /*yield*/, fs.readdir(branchPath)];
                    case 1:
                        items = _a.sent();
                        projects = [];
                        _i = 0, items_2 = items;
                        _a.label = 2;
                    case 2:
                        if (!(_i < items_2.length)) return [3 /*break*/, 5];
                        item = items_2[_i];
                        itemPath = path.join(branchPath, item);
                        return [4 /*yield*/, fs.stat(itemPath)];
                    case 3:
                        stat = _a.sent();
                        if (stat.isDirectory() && !item.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            projects.push(item);
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, projects];
                    case 6:
                        error_6 = _a.sent();
                        return [2 /*return*/, []];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    FileManager.prototype.summaryExists = function (date) {
        return __awaiter(this, void 0, void 0, function () {
            var branch, fileName, filePath, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        branch = this.config.gitBranch || 'main';
                        fileName = "".concat(date, "-\uC694\uC57D.md");
                        filePath = path.join(this.config.paths.workLogBase, '요약', branch, fileName);
                        return [4 /*yield*/, fs.access(filePath)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    FileManager.prototype.getLastSummary = function (project) {
        return __awaiter(this, void 0, void 0, function () {
            var branch, summaryPath, files, summaryFiles, lastSummaryPath, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        branch = this.config.gitBranch || 'main';
                        summaryPath = path.join(this.config.paths.workLogBase, '요약', branch);
                        return [4 /*yield*/, fs.readdir(summaryPath)];
                    case 1:
                        files = _a.sent();
                        summaryFiles = files
                            .filter(function (f) { return f.endsWith('-요약.md'); })
                            .sort(function (a, b) { return b.localeCompare(a); });
                        if (summaryFiles.length === 0)
                            return [2 /*return*/, null];
                        lastSummaryPath = path.join(summaryPath, summaryFiles[0]);
                        return [4 /*yield*/, fs.readFile(lastSummaryPath, 'utf-8')];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        error_7 = _a.sent();
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    FileManager.prototype.getLogsForDate = function (date, project) {
        return __awaiter(this, void 0, void 0, function () {
            var branch, logs, contents, _i, logs_1, log, content, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        branch = this.config.gitBranch || 'main';
                        return [4 /*yield*/, this.listLogs(branch, project, date)];
                    case 1:
                        logs = _a.sent();
                        contents = [];
                        _i = 0, logs_1 = logs;
                        _a.label = 2;
                    case 2:
                        if (!(_i < logs_1.length)) return [3 /*break*/, 7];
                        log = logs_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, fs.readFile(log.filePath, 'utf-8')];
                    case 4:
                        content = _a.sent();
                        contents.push(content);
                        return [3 /*break*/, 6];
                    case 5:
                        error_8 = _a.sent();
                        console.error("Failed to read log ".concat(log.filePath, ":"), error_8);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, contents];
                }
            });
        });
    };
    return FileManager;
}());
exports.FileManager = FileManager;
