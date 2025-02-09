// Listen to web requests
chrome.webRequest.onCompleted.addListener(
  function(details) {
    // Check if the response was successful
    if (details.statusCode === 200) {
      console.log('URL intercepted:', details.url);
      console.log('Status:', details.statusCode);
      console.log('Type:', details.type);
      console.log('Method:', details.method);
      
      // You can store the response or send it to popup
      chrome.storage.local.set({
        [details.requestId]: {
          url: details.url,
          statusCode: details.statusCode,
          timestamp: new Date().toISOString(),
          type: details.type
        }
      });
    }
  },
  {
    urls: ["<all_urls>"], // You can specify specific URLs here
    types: ["xmlhttprequest"] // Filter only XHR requests
  }
);