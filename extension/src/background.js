"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Store request bodies temporarily
var requestBodies = {};
// Store request headers temporarily
var requestHeadersStore = {};
// Function to store request data
function storeRequest(requestData) {
    var _a;
    chrome.storage.local.set((_a = {},
        _a[requestData.requestId] = requestData,
        _a), function () {
        if (chrome.runtime.lastError) {
            console.error('Error storing request:', chrome.runtime.lastError);
        }
    });
}
// Capture request headers
chrome.webRequest.onSendHeaders.addListener(function (details) {
    requestHeadersStore[details.requestId] = details.requestHeaders || [];
}, { urls: ["<all_urls>"] }, ["requestHeaders"]);
// Capture request bodies
chrome.webRequest.onBeforeRequest.addListener(function (details) {
    if (details.requestBody) {
        var requestBody = '';
        if (details.requestBody.raw) {
            // Handle raw data
            var encoder_1 = new TextDecoder('utf-8');
            requestBody = details.requestBody.raw.map(function (chunk) {
                return encoder_1.decode(chunk.bytes);
            }).join('');
        }
        else if (details.requestBody.formData) {
            // Handle form data
            requestBody = JSON.stringify(details.requestBody.formData);
        }
        requestBodies[details.requestId] = requestBody;
    }
}, { urls: ["<all_urls>"] }, ["requestBody"]);
// Capture completed requests
chrome.webRequest.onCompleted.addListener(function (details) {
    var requestData = {
        requestId: details.requestId,
        url: details.url,
        method: details.method,
        statusCode: details.statusCode,
        type: details.type,
        timestamp: new Date().toISOString(),
        requestHeaders: requestHeadersStore[details.requestId],
        responseHeaders: details.responseHeaders,
        requestBody: requestBodies[details.requestId],
        status: 'completed'
    };
    // Store the request data
    storeRequest(requestData);
    // Clean up stored request body and headers
    delete requestBodies[details.requestId];
    delete requestHeadersStore[details.requestId];
}, { urls: ["<all_urls>"] }, ["responseHeaders"]);
// Handle errors
chrome.webRequest.onErrorOccurred.addListener(function (details) {
    var requestData = {
        requestId: details.requestId,
        url: details.url,
        method: details.method,
        statusCode: -1, // Error status
        type: details.type,
        timestamp: new Date().toISOString(),
        requestHeaders: requestHeadersStore[details.requestId],
        responseHeaders: [],
        requestBody: requestBodies[details.requestId],
        status: 'error',
        errorText: details.error
    };
    // Store the error
    storeRequest(requestData);
    // Clean up stored request body and headers
    delete requestBodies[details.requestId];
    delete requestHeadersStore[details.requestId];
}, { urls: ["<all_urls>"] });
// Clean up old requests periodically (every hour)
setInterval(function () {
    chrome.storage.local.get(null, function (items) {
        if (chrome.runtime.lastError) {
            console.error('Error getting items:', chrome.runtime.lastError);
            return;
        }
        var now = new Date().getTime();
        var oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
        // Find old requests to remove
        var keysToRemove = Object.entries(items)
            .filter(function (_a) {
            var _ = _a[0], value = _a[1];
            var timestamp = new Date(value.timestamp).getTime();
            return timestamp < oneHourAgo;
        })
            .map(function (_a) {
            var key = _a[0];
            return key;
        });
        // Remove old requests
        if (keysToRemove.length > 0) {
            chrome.storage.local.remove(keysToRemove, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error removing old items:', chrome.runtime.lastError);
                }
            });
        }
    });
}, 60 * 60 * 1000); // Check every hour
