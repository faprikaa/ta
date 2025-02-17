import './globals.css'

class RequestsManager {
  constructor() {
    this.initializeDOMElements();
    this.allRequests = [];
    this.filterUrls = [];
    this.initializeUI();
    this.initializeEventListeners();
    this.loadRequests();
    this.startClock();
  }

  initializeDOMElements() {
    this.elements = {
      requestsList: document.getElementById('requests-list'),
      clearButton: document.getElementById('clear-button'),
      filterInput: document.getElementById('filter-input'),
      timeDisplay: document.getElementById('current-time'),
      toggleSwitch: document.getElementById('capture-toggle'),
      backendUrl: document.getElementById('backend-url'),
      saveUrlButton: document.getElementById('save-url'),
      filterUrls: document.getElementById('filter-urls'),
      saveFiltersButton: document.getElementById('save-filters'),
      backendToggle: document.getElementById('backend-toggle')
    };

    // Verify all required elements exist
    Object.entries(this.elements).forEach(([name, element]) => {
      if (!element) {
        throw new Error(`Required DOM element "${name}" not found`);
      }
    });
  }

  async initializeUI() {
    try {
      const { 
        captureEnabled = false,
        backendUrl = '',
        filterUrls = [],
        sendToBackend = false
      } = await chrome.storage.local.get(['captureEnabled', 'backendUrl', 'filterUrls', 'sendToBackend']);
      
      this.updateToggleUI(captureEnabled);
      this.updateBackendToggleUI(sendToBackend);
      this.elements.backendUrl.value = backendUrl;
      this.elements.filterUrls.value = filterUrls.join('\n');
      this.filterUrls = filterUrls;
    } catch (error) {
      console.error('Error initializing UI:', error);
      this.updateToggleUI(false);
      this.updateBackendToggleUI(false);
    }
  }

  initializeEventListeners() {
    this.elements.toggleSwitch.addEventListener('click', () => this.toggleCapture());
    this.elements.clearButton.addEventListener('click', () => this.clearRequests());
    this.elements.filterInput.addEventListener('input', () => this.filterRequests());
    this.elements.saveUrlButton.addEventListener('click', () => this.saveBackendUrl());
    this.elements.saveFiltersButton.addEventListener('click', () => this.saveFilterUrls());
    this.elements.backendToggle.addEventListener('click', () => this.toggleBackend());
  }

  startClock() {
    const updateTime = () => {
      this.elements.timeDisplay.textContent = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  async loadRequests() {
    try {
      const items = await chrome.storage.local.get(null);
      this.allRequests = Object.values(items)
        .filter(item => item && typeof item === 'object' && 'requestId' in item)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      this.filterRequests();
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  }

  async clearRequests() {
    try {
      await chrome.storage.local.clear();
      this.allRequests = [];
      this.filterRequests();
    } catch (error) {
      console.error('Error clearing requests:', error);
    }
  }

  async toggleCapture() {
    try {
      const { captureEnabled } = await chrome.storage.local.get('captureEnabled');
      const newState = !captureEnabled;
      
      await chrome.storage.local.set({ captureEnabled: newState });
      this.updateToggleUI(newState);
    } catch (error) {
      console.error('Error toggling capture:', error);
    }
  }

  updateToggleUI(enabled) {
    const toggle = this.elements.toggleSwitch.querySelector('.toggle');
    const thumb = this.elements.toggleSwitch.querySelector('.toggle-thumb');
    const status = this.elements.toggleSwitch.querySelector('span:last-child');
    
    toggle.dataset.state = enabled ? 'checked' : 'unchecked';
    thumb.dataset.state = enabled ? 'checked' : 'unchecked';
    status.textContent = enabled ? 'Capturing' : 'Paused';
  }

  filterRequests() {
    const filterValue = this.elements.filterInput.value.toLowerCase();
    const filteredRequests = this.allRequests.filter(request => {
      const matchesFilter = request.url.toLowerCase().includes(filterValue) ||
        request.method.toLowerCase().includes(filterValue) ||
        request.statusCode.toString().includes(filterValue);
        
      const matchesUrls = this.filterUrls.length === 0 || 
        this.filterUrls.some(filterUrl => request.url.includes(filterUrl));
        
      return matchesFilter && matchesUrls;
    });

    this.renderRequests(filteredRequests);
  }

  renderRequests(requests) {
    this.elements.requestsList.innerHTML = requests.length === 0 
      ? '<div class="text-center text-muted-foreground">No requests captured yet</div>'
      : requests.map(request => this.createRequestElement(request)).join('');
  }

  createRequestElement(request) {
    return `
      <div class="request-item" data-id="${request.requestId}">
        <div class="flex items-center">
          <span class="request-method ${this.getMethodColor(request.method)}">
            ${request.method}
          </span>
          <span class="request-status ${this.getStatusColor(request.statusCode)}">
            ${request.statusCode}
          </span>
          <span class="ml-3 text-sm flex-1 truncate">${request.url}</span>
          <span class="text-xs text-muted-foreground">
            ${new Date(request.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
    `;
  }

  getMethodColor(method) {
    const colors = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700'
    };
    return colors[method] || 'bg-gray-100 text-gray-700';
  }

  getStatusColor(status) {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-700';
    if (status >= 300 && status < 400) return 'bg-blue-100 text-blue-700';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-700';
    if (status >= 500) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }

  async saveBackendUrl() {
    try {
      const url = this.elements.backendUrl.value.trim();
      
      if (url && !url.startsWith('http')) {
        throw new Error('Invalid URL format. URL must start with http:// or https://');
      }
      
      await chrome.storage.local.set({ backendUrl: url });
      this.showSaveSuccess(this.elements.saveUrlButton);
    } catch (error) {
      console.error('Error saving backend URL:', error);
      alert(error.message);
    }
  }

  async saveFilterUrls() {
    try {
      const urls = this.elements.filterUrls.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url);
      
      // Validate URLs
      urls.forEach(url => {
        if (!url.startsWith('http')) {
          throw new Error(`Invalid URL format: ${url}\nURLs must start with http:// or https://`);
        }
      });
      
      await chrome.storage.local.set({ filterUrls: urls });
      this.filterUrls = urls;
      this.showSaveSuccess(this.elements.saveFiltersButton);
      this.filterRequests();
    } catch (error) {
      console.error('Error saving filter URLs:', error);
      alert(error.message);
    }
  }

  showSaveSuccess(button) {
    const originalText = button.textContent;
    button.textContent = 'Saved!';
    button.classList.add('bg-green-500');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('bg-green-500');
    }, 2000);
  }

  async toggleBackend() {
    try {
      const { sendToBackend } = await chrome.storage.local.get('sendToBackend');
      const newState = !sendToBackend;
      
      await chrome.storage.local.set({ sendToBackend: newState });
      this.updateBackendToggleUI(newState);
    } catch (error) {
      console.error('Error toggling backend:', error);
    }
  }

  updateBackendToggleUI(enabled) {
    const toggle = this.elements.backendToggle.querySelector('.toggle');
    const thumb = this.elements.backendToggle.querySelector('.toggle-thumb');
    const status = this.elements.backendToggle.querySelector('span:last-child');
    
    toggle.dataset.state = enabled ? 'checked' : 'unchecked';
    thumb.dataset.state = enabled ? 'checked' : 'unchecked';
    status.textContent = enabled ? 'Sending to Backend' : 'Send to Backend';
  }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  new RequestsManager();
}); 