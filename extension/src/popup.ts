import { Icons } from './icons';

interface RequestData {
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

class RequestsManager {
  private requestsList: HTMLElement;
  private clearButton: HTMLElement;
  private filterInput: HTMLInputElement;
  private timeDisplay: HTMLElement;
  private userDisplay: HTMLElement;
  private allRequests: RequestData[] = [];

  constructor() {
    const requestsList = document.getElementById('requests-list');
    const clearButton = document.getElementById('clear-button');
    const filterInput = document.getElementById('filter-input') as HTMLInputElement;
    const timeDisplay = document.getElementById('current-time');
    const userDisplay = document.getElementById('current-user');

    if (!requestsList || !clearButton || !filterInput || !timeDisplay || !userDisplay) {
      throw new Error('Required DOM elements not found');
    }

    this.requestsList = requestsList;
    this.clearButton = clearButton;
    this.filterInput = filterInput;
    this.timeDisplay = timeDisplay;
    this.userDisplay = userDisplay;

    this.initializeUI();
    this.initializeEventListeners();
    this.loadRequests();
    this.startClock();
  }

  private initializeUI(): void {
    // Add icons
    document.getElementById('clock-icon')!.innerHTML = Icons.clock;
    document.getElementById('user-icon')!.innerHTML = Icons.user;
    document.getElementById('search-icon')!.innerHTML = Icons.search;
    document.getElementById('trash-icon')!.innerHTML = Icons.trash;
  }

  private formatDate(date: Date): string {
    return date.getUTCFullYear() + '-' +
        String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(date.getUTCDate()).padStart(2, '0') + ' ' +
        String(date.getUTCHours()).padStart(2, '0') + ':' +
        String(date.getUTCMinutes()).padStart(2, '0') + ':' +
        String(date.getUTCSeconds()).padStart(2, '0');
  }

  private startClock(): void {
    const updateTime = () => {
      this.timeDisplay.textContent = this.formatDate(new Date());
    };
    updateTime();
    this.userDisplay.textContent = 'faprikaa';
  }

  private initializeEventListeners(): void {
    this.clearButton.addEventListener('click', () => this.clearRequests());
    this.filterInput.addEventListener('input', () => this.filterRequests());

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;

      Object.entries(changes).forEach(([_, { newValue }]) => {
        if (newValue && typeof newValue === 'object' && 'requestId' in newValue) {
          this.addRequest(newValue as RequestData);
        }
      });
    });
  }

  private async loadRequests(): Promise<void> {
    try {
      const items = await chrome.storage.local.get(null);
      const requests = Object.values(items)
        .filter((item): item is RequestData =>
          typeof item === 'object' &&
          item !== null &&
          'requestId' in item
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      this.allRequests = requests;
      this.updateRequestsList();
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  }

  private createRequestElement(request: RequestData): HTMLElement {
    const requestEl = document.createElement('div');
    requestEl.className = 'border rounded-lg overflow-hidden shadow-sm bg-card';

    // Header section
    const header = document.createElement('div');
    header.className = 'p-3 bg-muted/50 flex items-center gap-3 cursor-pointer hover:bg-muted/75 transition-colors';

    const method = document.createElement('span');
    method.className = `px-2 py-1 rounded text-xs font-medium ${this.getMethodColor(request.method)}`;
    method.textContent = request.method;

    const urlContainer = document.createElement('div');
    urlContainer.className = 'flex-1 min-w-0';

    const url = document.createElement('span');
    url.className = 'block truncate text-sm';
    url.textContent = request.url;
    urlContainer.appendChild(url);

    const status = document.createElement('span');
    status.className = `flex-shrink-0 px-2 py-1 rounded text-xs font-mono ${this.getStatusColor(request.statusCode)}`;
    status.textContent = request.statusCode.toString();

    const time = document.createElement('span');
    time.className = 'flex-shrink-0 text-xs text-muted-foreground';
    time.textContent = this.formatDate(new Date(request.timestamp));

    const chevron = document.createElement('span');
    chevron.className = 'flex-shrink-0 w-4 h-4 transform transition-transform duration-200';
    chevron.innerHTML = Icons.chevronDown;

    header.append(method, urlContainer, status, time, chevron);

    // Details section
    const details = document.createElement('div');
    details.className = 'hidden p-4 space-y-4 border-t bg-card';

    // Request Details
    if (request.requestHeaders?.length || request.requestBody) {
      const requestDetails = this.createSection('Request Details', {
        Headers: request.requestHeaders || [],
        Body: request.requestBody || 'No body'
      });
      details.appendChild(requestDetails);
    }

    // Response Details
    if (request.responseHeaders?.length || request.responseBody) {
      const responseDetails = this.createSection('Response Details', {
        Headers: request.responseHeaders || [],
        Body: request.responseBody || 'No body'
      });
      details.appendChild(responseDetails);
    }

    header.addEventListener('click', () => {
      const isExpanded = details.classList.contains('block');
      details.classList.toggle('hidden');
      details.classList.toggle('block');
      chevron.style.transform = isExpanded ? '' : 'rotate(180deg)';
    });

    requestEl.append(header, details);
    return requestEl;
  }

  private createSection(title: string, content: Record<string, any>): HTMLElement {
    const section = document.createElement('div');
    section.className = 'space-y-2';

    const heading = document.createElement('h3');
    heading.className = 'text-sm font-medium';
    heading.textContent = title;

    const contentEl = document.createElement('div');
    contentEl.className = 'space-y-2';

    Object.entries(content).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        const subsection = document.createElement('div');
        subsection.className = 'space-y-1';

        const subheading = document.createElement('h4');
        subheading.className = 'text-xs font-medium text-muted-foreground';
        subheading.textContent = key;

        const list = document.createElement('pre');
        list.className = 'text-xs bg-muted/50 p-2 rounded overflow-x-auto';
        list.textContent = this.formatHeaders(value);

        subsection.append(subheading, list);
        contentEl.appendChild(subsection);
      } else if (value && value !== 'No body') {
        const bodySection = document.createElement('div');
        bodySection.className = 'space-y-1';

        const bodyHeading = document.createElement('h4');
        bodyHeading.className = 'text-xs font-medium text-muted-foreground';
        bodyHeading.textContent = key;

        const bodyContent = document.createElement('pre');
        bodyContent.className = 'text-xs bg-muted/50 p-2 rounded overflow-x-auto';
        bodyContent.textContent = this.formatBody(value);

          bodySection.append(bodyHeading, bodyContent);
        contentEl.appendChild(bodySection);
      }
    });

    section.append(heading, contentEl);
    return section;
  }

  private formatHeaders(headers: chrome.webRequest.HttpHeader[]): string {
    return headers.map(h => `${h.name}: ${h.value}`).join('\n');
  }

  private formatBody(body: string): string {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }

  private getMethodColor(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-100 text-blue-700';
      case 'POST':
        return 'bg-green-100 text-green-700';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  private getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-700';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-700';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-700';
    if (status >= 500) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }

  private addRequest(request: RequestData): void {
    if (!request.timestamp) {
      request.timestamp = new Date().toISOString();
    }

    const index = this.allRequests.findIndex(r => r.requestId === request.requestId);
    if (index !== -1) {
      this.allRequests[index] = request;
    } else {
      this.allRequests.unshift(request);
    }
    this.updateRequestsList();
  }

  private updateRequestsList(): void {
    const filterValue = this.filterInput.value.toLowerCase();
    const filteredRequests = this.allRequests.filter(request =>
      request.url.toLowerCase().includes(filterValue) ||
      request.method.toLowerCase().includes(filterValue) ||
      request.statusCode.toString().includes(filterValue)
    );

    this.requestsList.innerHTML = '';
    filteredRequests.forEach(request => {
      this.requestsList.appendChild(this.createRequestElement(request));
    });
  }

  private filterRequests(): void {
    this.updateRequestsList();
  }

  private async clearRequests(): Promise<void> {
    try {
      await chrome.storage.local.clear();
      this.allRequests = [];
      this.updateRequestsList();
    } catch (error) {
      console.error('Error clearing requests:', error);
    }
  }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  new RequestsManager();
});