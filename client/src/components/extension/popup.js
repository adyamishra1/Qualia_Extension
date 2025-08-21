// Popup script for Gmail DISC Extension

class ExtensionPopup {
  constructor() {
    this.init();
  }

  async init() {
    await this.checkStatus();
    this.setupEventListeners();
    this.loadStats();
    
    // Hide loading and show main content
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('main-content').classList.remove('hidden');
  }

  setupEventListeners() {
    document.getElementById('connect-gmail').addEventListener('click', () => {
      this.connectGmail();
    });

    document.getElementById('analyze-disc').addEventListener('click', () => {
      this.analyzeDISC();
    });
  }

  async checkStatus() {
    // Check Gmail connection
    try {
      const gmailStatus = await this.checkGmailConnection();
      this.updateStatusIndicator('gmail-status', gmailStatus);
    } catch (error) {
      this.updateStatusIndicator('gmail-status', false);
    }

    // Check backend connection
    try {
      const backendStatus = await this.checkBackendConnection();
      this.updateStatusIndicator('backend-status', backendStatus);
    } catch (error) {
      this.updateStatusIndicator('backend-status', false);
    }

    // Check DISC profile
    try {
      const discProfile = await this.checkDISCProfile();
      this.updateStatusIndicator('disc-status', !!discProfile);
      if (discProfile) {
        this.displayDISCProfile(discProfile);
      }
    } catch (error) {
      this.updateStatusIndicator('disc-status', false);
    }
  }

  async checkGmailConnection() {
    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: false }, (token) => {
        resolve(!!token && !chrome.runtime.lastError);
      });
    });
  }

  async checkBackendConnection() {
    try {
      const response = await fetch('http://localhost:5000/api/auth/user', {
        credentials: 'include'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async checkDISCProfile() {
    try {
      const response = await fetch('http://localhost:5000/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const user = await response.json();
        return user.discProfile;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  updateStatusIndicator(elementId, isConnected) {
    const indicator = document.getElementById(elementId);
    indicator.className = `status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`;
  }

  async connectGmail() {
    const button = document.getElementById('connect-gmail');
    const originalText = button.textContent;
    
    button.textContent = 'Connecting...';
    button.disabled = true;
    
    this.updateStatusIndicator('gmail-status', null); // Show loading state
    document.getElementById('gmail-status').className = 'status-indicator status-loading';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'authenticate_gmail'
      });

      if (response.success) {
        this.updateStatusIndicator('gmail-status', true);
        this.showNotification('Gmail connected successfully!', 'success');
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Gmail connection failed:', error);
      this.updateStatusIndicator('gmail-status', false);
      this.showNotification('Failed to connect Gmail: ' + error.message, 'error');
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  async analyzeDISC() {
    const button = document.getElementById('analyze-disc');
    const originalText = button.textContent;
    
    button.textContent = 'Analyzing...';
    button.disabled = true;
    
    this.updateStatusIndicator('disc-status', null);
    document.getElementById('disc-status').className = 'status-indicator status-loading';

    try {
      const response = await fetch('http://localhost:5000/api/disc/analyze', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const discProfile = await response.json();
        this.updateStatusIndicator('disc-status', true);
        this.displayDISCProfile(discProfile);
        this.showNotification('DISC profile analyzed successfully!', 'success');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('DISC analysis failed:', error);
      this.updateStatusIndicator('disc-status', false);
      this.showNotification('DISC analysis failed: ' + error.message, 'error');
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  displayDISCProfile(profile) {
    document.getElementById('profile-section').classList.remove('hidden');
    
    // Update DISC scores
    document.getElementById('dominant-score').textContent = Math.round(profile.dominant * 100) + '%';
    document.getElementById('influential-score').textContent = Math.round(profile.influential * 100) + '%';
    document.getElementById('steady-score').textContent = Math.round(profile.steady * 100) + '%';
    document.getElementById('conscientious-score').textContent = Math.round(profile.conscientious * 100) + '%';
  }

  async loadStats() {
    try {
      // Get stats from storage
      const result = await chrome.storage.local.get(['stats']);
      const stats = result.stats || {
        emailsAnalyzed: 0,
        suggestionsGenerated: 0
      };

      document.getElementById('emails-analyzed').textContent = stats.emailsAnalyzed;
      document.getElementById('suggestions-generated').textContent = stats.suggestionsGenerated;
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      background: ${type === 'success' ? '#34a853' : type === 'error' ? '#ea4335' : '#1a73e8'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ExtensionPopup();
});