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
function formatDate(date) {
    return date.toISOString().replace('T', ' ').slice(0, 19);
}
function formatHeaders(headers) {
    if (!headers)
        return 'No headers';
    return headers
        .map(function (header) { return "".concat(header.name, ": ").concat(header.value); })
        .join('\n');
}
function formatBody(data) {
    if (!data)
        return 'No data';
    try {
        var parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
    }
    catch (_a) {
        return data;
    }
}
function getMethodClass(method) {
    var methods = {
        GET: 'get',
        POST: 'post',
        PUT: 'put',
        DELETE: 'delete'
    };
    return methods[method] || '';
}
function createRequestElement(request) {
    var element = document.createElement('div');
    element.className = 'request-item';
    var timestamp = new Date(request.timestamp);
    element.innerHTML = "\n    <div class=\"request-header\" onclick=\"this.parentElement.classList.toggle('expanded')\">\n      <span class=\"method ".concat(getMethodClass(request.method), "\">").concat(request.method, "</span>\n      <span class=\"status-code\">").concat(request.statusCode, "</span>\n      <span class=\"url\">").concat(request.url, "</span>\n      <span class=\"timestamp\">").concat(formatDate(timestamp), "</span>\n    </div>\n    <div class=\"request-details\">\n      <div class=\"section\">\n        <h4>Request Headers</h4>\n        <pre>").concat(formatHeaders(request.requestHeaders), "</pre>\n      </div>\n      <div class=\"section\">\n        <h4>Request Body</h4>\n        <pre>").concat(formatBody(request.requestBody), "</pre>\n      </div>\n      <div class=\"section\">\n        <h4>Response Headers</h4>\n        <pre>").concat(formatHeaders(request.responseHeaders), "</pre>\n      </div>\n    </div>\n  ");
    return element;
}
var RequestsManager = /** @class */ (function () {
    function RequestsManager() {
        this.allRequests = [];
        // Get DOM elements
        var requestsList = document.getElementById('requests-list');
        var clearButton = document.getElementById('clear-button');
        var filterInput = document.getElementById('filter-input');
        var timeDisplay = document.getElementById('current-time');
        var userDisplay = document.getElementById('current-user');
        // Validate DOM elements
        if (!requestsList || !clearButton || !filterInput || !timeDisplay || !userDisplay ||
            !(filterInput instanceof HTMLInputElement)) {
            throw new Error('Required DOM elements not found');
        }
        this.requestsList = requestsList;
        this.clearButton = clearButton;
        this.filterInput = filterInput;
        this.timeDisplay = timeDisplay;
        this.userDisplay = userDisplay;
        // Initialize
        this.initializeEventListeners();
        this.loadRequests();
        this.startClock();
        this.userDisplay.textContent = 'faprikaa';
    }
    RequestsManager.prototype.startClock = function () {
        var _this = this;
        var updateTime = function () {
            var now = new Date();
            _this.timeDisplay.textContent = now.toISOString().slice(0, 19).replace('T', ' ');
        };
        updateTime();
        this.timeInterval = window.setInterval(updateTime, 1000);
    };
    RequestsManager.prototype.updateDisplay = function (requests) {
        var _this = this;
        this.requestsList.innerHTML = '';
        if (requests.length === 0) {
            var emptyMessage = document.createElement('div');
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.padding = '20px';
            emptyMessage.style.color = '#666';
            emptyMessage.textContent = 'No requests captured yet';
            this.requestsList.appendChild(emptyMessage);
            return;
        }
        requests.forEach(function (request) {
            _this.requestsList.appendChild(createRequestElement(request));
        });
    };
    RequestsManager.prototype.showMessage = function (text, type) {
        // Remove any existing messages
        var existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(function (msg) { return msg.remove(); });
        // Create new message
        var message = document.createElement('div');
        message.className = "message ".concat(type);
        message.textContent = text;
        document.body.appendChild(message);
        // Remove after delay
        setTimeout(function () { return message.remove(); }, 3000);
    };
    RequestsManager.prototype.clearStorage = function () {
        return new Promise(function (resolve, reject) {
            chrome.storage.local.clear(function () {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                }
                else {
                    resolve();
                }
            });
        });
    };
    RequestsManager.prototype.handleClear = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.clearStorage()];
                    case 1:
                        _a.sent();
                        this.allRequests = [];
                        this.updateDisplay([]);
                        this.showMessage('All requests cleared successfully', 'success');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to clear storage:', error_1);
                        this.showMessage('Failed to clear requests', 'error');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    RequestsManager.prototype.initializeEventListeners = function () {
        var _this = this;
        // Clear button handler
        this.clearButton.addEventListener('click', function () {
            _this.handleClear();
        });
        // Filter input handler
        this.filterInput.addEventListener('input', function () {
            var filterText = _this.filterInput.value.toLowerCase();
            var filtered = _this.allRequests.filter(function (req) {
                return req.url.toLowerCase().includes(filterText) ||
                    req.method.toLowerCase().includes(filterText) ||
                    String(req.statusCode).includes(filterText);
            });
            _this.updateDisplay(filtered);
        });
        // Storage change listener
        chrome.storage.onChanged.addListener(function (changes) {
            var hasNewData = false;
            var _loop_1 = function (key) {
                var newRequest = changes[key].newValue;
                if (newRequest) {
                    var exists = _this.allRequests.some(function (req) { return req.requestId === newRequest.requestId; });
                    if (!exists) {
                        _this.allRequests.unshift(newRequest);
                        hasNewData = true;
                    }
                }
            };
            for (var key in changes) {
                _loop_1(key);
            }
            if (hasNewData) {
                var filtered = _this.filterInput.value ?
                    _this.allRequests.filter(function (req) {
                        return req.url.toLowerCase().includes(_this.filterInput.value.toLowerCase());
                    }) :
                    _this.allRequests;
                _this.updateDisplay(filtered);
            }
        });
    };
    RequestsManager.prototype.loadRequests = function () {
        var _this = this;
        chrome.storage.local.get(null, function (items) {
            if (chrome.runtime.lastError) {
                console.error('Error loading requests:', chrome.runtime.lastError);
                _this.showMessage('Failed to load requests', 'error');
                return;
            }
            _this.allRequests = Object.values(items)
                .sort(function (a, b) { return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); });
            _this.updateDisplay(_this.allRequests);
        });
    };
    RequestsManager.prototype.destroy = function () {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
        }
    };
    return RequestsManager;
}());
// Initialize when DOM is ready
var manager = null;
document.addEventListener('DOMContentLoaded', function () {
    try {
        manager = new RequestsManager();
    }
    catch (error) {
        console.error('Failed to initialize:', error);
        var errorDiv = document.createElement('div');
        errorDiv.style.color = '#ef4444';
        errorDiv.style.padding = '20px';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = 'Failed to initialize the request manager. Please check the console for details.';
        document.body.appendChild(errorDiv);
    }
});
// Cleanup when popup closes
window.addEventListener('unload', function () {
    if (manager) {
        manager.destroy();
    }
});
