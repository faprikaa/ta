export interface RequestData {
  requestId: string;
  url: string;
  method: string;
  statusCode: number;
  timestamp: string;
  requestHeaders?: chrome.webRequest.HttpHeader[];
  responseHeaders?: chrome.webRequest.HttpHeader[];
  requestBody?: string;
  responseBody?: string;
  type: string;
  status: 'completed' | 'error';
  errorText?: string;
}