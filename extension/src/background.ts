import { RequestData } from './types';

// Store request bodies temporarily
const requestBodies: { [key: string]: string } = {};

// Store request headers temporarily
const requestHeadersStore: { [key: string]: chrome.webRequest.HttpHeader[] } = {};

// Function to store request data
function storeRequest(requestData: RequestData) {
  chrome.storage.local.set({
    [requestData.requestId]: requestData
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error storing request:', chrome.runtime.lastError);
    }
  });
}

// Capture request headers
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    requestHeadersStore[details.requestId] = details.requestHeaders || [];
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Capture request bodies
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.requestBody) {
      let requestBody = '';
      if (details.requestBody.raw) {
        // Handle raw data
        const encoder = new TextDecoder('utf-8');
        requestBody = details.requestBody.raw.map(chunk => 
          encoder.decode(chunk.bytes)
        ).join('');
      } else if (details.requestBody.formData) {
        // Handle form data
        requestBody = JSON.stringify(details.requestBody.formData);
      }
      requestBodies[details.requestId] = requestBody;
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Capture completed requests
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const requestData: RequestData = {
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
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Handle errors
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const requestData: RequestData = {
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
  },
  { urls: ["<all_urls>"] }
);

// Clean up old requests periodically (every hour)
setInterval(() => {
  chrome.storage.local.get(null, (items) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting items:', chrome.runtime.lastError);
      return;
    }

    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds

    // Find old requests to remove
    const keysToRemove = Object.entries(items)
      .filter(([_, value]: [string, any]) => {
        const timestamp = new Date(value.timestamp).getTime();
        return timestamp < oneHourAgo;
      })
      .map(([key]) => key);

    // Remove old requests
    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          console.error('Error removing old items:', chrome.runtime.lastError);
        }
      });
    }
  });
}, 60 * 60 * 1000); // Check every hour