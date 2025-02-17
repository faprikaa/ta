// Store request bodies temporarily
const requestBodies = {};

// Store request headers temporarily
const requestHeadersStore = {};

// List of allowed content types
const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'text/plain',
  'text/html',
  'application/xml',
  'text/xml',
  'multipart/form-data'
];

// Helper function to check content type
function isAllowedContentType(headers) {
  if (!headers) return false;
  
  const contentTypeHeader = headers.find(h => 
    h.name.toLowerCase() === 'content-type'
  );
  
  if (!contentTypeHeader?.value) return true;
  
  return ALLOWED_CONTENT_TYPES.some(type => 
    contentTypeHeader.value.toLowerCase().includes(type)
  );
}

// Function to store request data
function storeRequest(requestData) {
  chrome.storage.local.set({
    [requestData.requestId]: requestData
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error storing request:', chrome.runtime.lastError);
    } else {
      console.log('Successfully stored request:', requestData.requestId);
      if (sendToBackend) {
        sendRequestToBackend(requestData);
      }
    }
  });
}

// Initialize capture state
let isCapturing = false;
let sendToBackend = false;

// Load initial state
chrome.storage.local.get(['captureEnabled', 'sendToBackend'], ({ captureEnabled, sendToBackend: savedSendToBackend }) => {
  isCapturing = captureEnabled ?? false;
  sendToBackend = savedSendToBackend ?? false;
});

// Listen for state changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.captureEnabled) {
      isCapturing = changes.captureEnabled.newValue ?? false;
    }
    if (changes.sendToBackend) {
      sendToBackend = changes.sendToBackend.newValue ?? false;
    }
  }
});

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
    if (!isCapturing) return;
    
    let requestBody = '';
    
    if (details.requestBody) {
      if (details.requestBody.formData) {
        try {
          const formDataObj = {};
          Object.entries(details.requestBody.formData).forEach(([key, values]) => {
            formDataObj[key] = values.length === 1 ? values[0] : values;
          });
          
          requestBody = JSON.stringify(formDataObj, null, 2);
          console.log('Form data captured:', requestBody);
        } catch (error) {
          console.error('Error processing form data:', error);
          requestBody = JSON.stringify(details.requestBody.formData);
        }
      } else if (details.requestBody.raw) {
        try {
          const decoder = new TextDecoder('utf-8');
          const raw = details.requestBody.raw[0].bytes;
          const decodedData = decoder.decode(raw);
          
          try {
            const urlParams = new URLSearchParams(decodedData);
            const formDataObj = {};
            for (const [key, value] of urlParams.entries()) {
              formDataObj[key] = value;
            }
            requestBody = JSON.stringify(formDataObj, null, 2);
          } catch {
            try {
              const jsonData = JSON.parse(decodedData);
              requestBody = JSON.stringify(jsonData, null, 2);
            } catch {
              requestBody = decodedData;
            }
          }
        } catch (error) {
          console.error('Error processing raw body:', error);
        }
      }
      
      if (requestBody) {
        requestBodies[details.requestId] = requestBody;
        console.log('Stored request body for:', details.requestId);
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Capture completed requests
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!isCapturing) return;
    
    if (!isAllowedContentType(details.responseHeaders)) {
      return;
    }

    const requestData = {
      requestId: details.requestId,
      url: details.url,
      method: details.method,
      statusCode: details.statusCode,
      type: details.type,
      timestamp: new Date().toISOString(),
      requestHeaders: requestHeadersStore[details.requestId] || [],
      responseHeaders: details.responseHeaders || [],
      requestBody: requestBodies[details.requestId] || '',
      status: 'completed'
    };

    storeRequest(requestData);
    
    // Cleanup
    delete requestBodies[details.requestId];
    delete requestHeadersStore[details.requestId];
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Handle errors
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (!isCapturing) return;

    const requestData = {
      requestId: details.requestId,
      url: details.url,
      method: details.method,
      statusCode: -1,
      type: details.type,
      timestamp: new Date().toISOString(),
      requestHeaders: requestHeadersStore[details.requestId] || [],
      responseHeaders: [],
      requestBody: requestBodies[details.requestId] || '',
      status: 'error',
      errorText: details.error
    };

    storeRequest(requestData);
    
    // Cleanup
    delete requestBodies[details.requestId];
    delete requestHeadersStore[details.requestId];
  },
  { urls: ["<all_urls>"] }
);

// Clean up old requests periodically
setInterval(() => {
  chrome.storage.local.get(null, (items) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting items:', chrome.runtime.lastError);
      return;
    }

    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000);

    const keysToRemove = Object.entries(items)
      .filter(([_, value]) => {
        if (value && value.timestamp) {
          const timestamp = new Date(value.timestamp).getTime();
          return timestamp < oneHourAgo;
        }
        return false;
      })
      .map(([key]) => key);

    if (keysToRemove.length > 0) {
      chrome.storage.local.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          console.error('Error removing old items:', chrome.runtime.lastError);
        }
      });
    }
  });
}, 60 * 60 * 1000);

// Example of sending history data
async function sendHistoryData(historyData) {
  try {
    const backendUrl = chrome.storage.local.get('backendUrl')
    if (!backendUrl){
      return
    }
    const response = await fetch('http://localhost:3000/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyData)
    });
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log('History data sent successfully:', result.message);
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to send history data');
    }
  } catch (error) {
    console.error('Error sending history data:', error);
    throw error;
  }
}

// Example of sending bookmark data
async function sendBookmarkData(bookmarkData) {
  try {
    const response = await fetch('http://localhost:3000/api/bookmarks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookmarkData)
    });
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log('Bookmark data sent successfully:', result.message);
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to send bookmark data');
    }
  } catch (error) {
    console.error('Error sending bookmark data:', error);
    throw error;
  }
}

// Example of sending tab data
async function sendTabData(tabData) {
  try {
    const response = await fetch('http://localhost:3000/api/tabs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tabData)
    });
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log('Tab data sent successfully:', result.message);
      return result.data;
    } else {
      throw new Error(result.error || 'Failed to send tab data');
    }
  } catch (error) {
    console.error('Error sending tab data:', error);
    throw error;
  }
}

// Function to send request to backend
async function sendRequestToBackend(requestData) {
  try {
    const { backendUrl } = await chrome.storage.local.get('backendUrl');
    if (!backendUrl) {
      console.log('No backend URL configured');
      return;
    }
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('Successfully sent request to backend:', requestData.requestId);
  } catch (error) {
    console.error('Error sending request to backend:', error);
  }
} 