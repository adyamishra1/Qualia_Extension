// Background service worker for Gmail DISC Extension

class ExtensionBackground {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log('Gmail DISC Extension installed');
    });

    // Handle messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle Gmail authentication
    chrome.identity.onSignInChanged.addListener((account, signedIn) => {
      if (signedIn) {
        this.handleGmailAuth();
      }
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'authenticate_gmail':
          const tokens = await this.authenticateWithGmail();
          sendResponse({ success: true, tokens });
          break;

        case 'analyze_email':
          const analysis = await this.analyzeEmail(message.data);
          sendResponse({ success: true, analysis });
          break;

        case 'get_response_suggestions':
          const suggestions = await this.getResponseSuggestions(message.data);
          sendResponse({ success: true, suggestions });
          break;

        case 'categorize_sender':
          const category = await this.categorizeSender(message.data);
          sendResponse({ success: true, category });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async authenticateWithGmail() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (token) {
          // Save token to backend
          try {
            await this.saveTokenToBackend(token);
            resolve({ access_token: token });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No token received'));
        }
      });
    });
  }

  async saveTokenToBackend(token) {
    const response = await fetch('http://localhost:5000/api/gmail/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ access_token: token })
    });

    if (!response.ok) {
      throw new Error('Failed to save token to backend');
    }
  }

  async analyzeEmail(emailData) {
    const response = await fetch('http://localhost:5000/api/emails/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error('Failed to analyze email');
    }

    return response.json();
  }

  async getResponseSuggestions(data) {
    const response = await fetch('http://localhost:5000/api/responses/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to get response suggestions');
    }

    return response.json();
  }

  async categorizeSender(data) {
    const response = await fetch('http://localhost:5000/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to categorize sender');
    }

    return response.json();
  }

  async handleGmailAuth() {
    // Automatically authenticate when user signs into Gmail
    try {
      await this.authenticateWithGmail();
      console.log('Gmail authentication successful');
    } catch (error) {
      console.error('Gmail authentication failed:', error);
    }
  }
}

// Initialize background script
new ExtensionBackground();