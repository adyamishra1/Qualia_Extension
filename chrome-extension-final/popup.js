// Gmail DISC Extension Popup Script

document.addEventListener('DOMContentLoaded', function() {
  console.log('Gmail DISC Extension popup loaded');
  
  // Initialize popup
  initializePopup();
  
  // Add event listeners
  document.getElementById('connect-gmail').addEventListener('click', handleGmailConnection);
  document.getElementById('refresh-status').addEventListener('click', refreshAllStatus);
});

// Initialize popup with current status
function initializePopup() {
  console.log('Initializing popup...');
  
  // Check Gmail connection status
  checkGmailStatus();
  
  // Check backend server status
  checkBackendStatus();
  
  // Check AI analysis status
  checkAIStatus();
  
  // Load DISC profile
  loadDiscProfile();
  
  // Load usage statistics
  loadUsageStats();
}

// Check Gmail connection status
function checkGmailStatus() {
  const statusElement = document.getElementById('gmail-status');
  
  chrome.storage.local.get(['gmailConnected', 'gmailToken'], (result) => {
    if (result.gmailConnected && result.gmailToken) {
      statusElement.textContent = 'Connected';
      statusElement.className = 'status-indicator status-connected';
      
      // Update button text
      const connectBtn = document.getElementById('connect-gmail');
      connectBtn.textContent = 'Reconnect Gmail';
      connectBtn.style.background = 'rgba(255,255,255,0.3)';
    } else {
      statusElement.textContent = 'Disconnected';
      statusElement.className = 'status-indicator status-disconnected';
      
      // Update button text
      const connectBtn = document.getElementById('connect-gmail');
      connectBtn.textContent = 'Connect Gmail';
      connectBtn.style.background = 'rgba(255,255,255,0.2)';
    }
  });
}

// Check backend server status
function checkBackendStatus() {
  const statusElement = document.getElementById('backend-status');
  
  // Try to connect to backend server
  fetch('http://localhost:5000/api/health', { 
    method: 'GET',
    mode: 'no-cors' // Avoid CORS issues in extension
  })
  .then(() => {
    statusElement.textContent = 'Connected';
    statusElement.className = 'status-indicator status-connected';
  })
  .catch(() => {
    statusElement.textContent = 'Disconnected';
    statusElement.className = 'status-indicator status-disconnected';
  });
}

// Check AI analysis status
function checkAIStatus() {
  const statusElement = document.getElementById('ai-status');
  
  // Check if we have DISC profile and analysis capabilities
  chrome.storage.local.get(['discProfile', 'aiAnalysisEnabled'], (result) => {
    if (result.discProfile && result.aiAnalysisEnabled !== false) {
      statusElement.textContent = 'Active';
      statusElement.className = 'status-indicator status-connected';
    } else {
      statusElement.textContent = 'Inactive';
      statusElement.className = 'status-indicator status-disconnected';
    }
  });
}

// Load DISC profile from storage
function loadDiscProfile() {
  chrome.storage.local.get(['discProfile'], (result) => {
    if (result.discProfile) {
      const profile = result.discProfile;
      
      // Update DISC scores
      document.getElementById('d-score').textContent = profile.scores?.D || '--';
      document.getElementById('i-score').textContent = profile.scores?.I || '--';
      document.getElementById('s-score').textContent = profile.scores?.S || '--';
      document.getElementById('c-score').textContent = profile.scores?.C || '--';
      
      // Highlight primary style
      highlightPrimaryStyle(profile.primaryStyle);
    } else {
      // Set default balanced scores
      document.getElementById('d-score').textContent = '25';
      document.getElementById('i-score').textContent = '25';
      document.getElementById('s-score').textContent = '25';
      document.getElementById('c-score').textContent = '25';
    }
  });
}

// Highlight primary DISC style
function highlightPrimaryStyle(primaryStyle) {
  const scores = document.querySelectorAll('.disc-score');
  scores.forEach(score => {
    score.style.background = 'rgba(255,255,255,0.1)';
  });
  
  if (primaryStyle) {
    const primaryScore = document.getElementById(`${primaryStyle.toLowerCase()}-score`);
    if (primaryScore) {
      primaryScore.closest('.disc-score').style.background = 'rgba(255,255,255,0.3)';
    }
  }
}

// Load usage statistics
function loadUsageStats() {
  chrome.storage.local.get(['emailsAnalyzed', 'suggestionsUsed', 'categoriesCreated'], (result) => {
    document.getElementById('emails-analyzed').textContent = result.emailsAnalyzed || 0;
    document.getElementById('suggestions-used').textContent = result.suggestionsUsed || 0;
    document.getElementById('categories-created').textContent = result.categoriesCreated || 0;
  });
}

// Handle Gmail connection
function handleGmailConnection() {
  const connectBtn = document.getElementById('connect-gmail');
  const originalText = connectBtn.textContent;
  
  // Show connecting state
  connectBtn.textContent = 'Connecting...';
  connectBtn.disabled = true;
  
  // Request Gmail authentication
  chrome.runtime.sendMessage({
    action: 'getGmailToken'
  }, (response) => {
    if (response && response.success) {
      console.log('Gmail connected successfully');
      
      // Update status
      checkGmailStatus();
      
      // Show success message
      showNotification('Gmail connected successfully!', 'success');
      
      // Update usage stats
      loadUsageStats();
    } else {
      console.error('Gmail connection failed:', response?.error);
      
      // Show error message
      showNotification('Gmail connection failed. Please try again.', 'error');
      
      // Reset button
      connectBtn.textContent = originalText;
      connectBtn.disabled = false;
    }
  });
}

// Refresh all status indicators
function refreshAllStatus() {
  const refreshBtn = document.getElementById('refresh-status');
  const originalText = refreshBtn.textContent;
  
  // Show refreshing state
  refreshBtn.textContent = 'Refreshing...';
  refreshBtn.disabled = true;
  
  // Refresh all statuses
  Promise.all([
    new Promise(resolve => {
      checkGmailStatus();
      setTimeout(resolve, 500);
    }),
    new Promise(resolve => {
      checkBackendStatus();
      setTimeout(resolve, 500);
    }),
    new Promise(resolve => {
      checkAIStatus();
      setTimeout(resolve, 500);
    })
  ]).then(() => {
    // Reset button
    refreshBtn.textContent = originalText;
    refreshBtn.disabled = false;
    
    // Show success message
    showNotification('Status refreshed successfully!', 'success');
  });
}

// Show notification message
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    z-index: 1000;
    max-width: 300px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Set background color based on type
  switch (type) {
    case 'success':
      notification.style.background = '#4CAF50';
      break;
    case 'error':
      notification.style.background = '#f44336';
      break;
    case 'warning':
      notification.style.background = '#ff9800';
      break;
    default:
      notification.style.background = '#2196F3';
  }
  
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Listen for storage changes to update UI
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    // Update relevant sections when storage changes
    if (changes.gmailConnected || changes.gmailToken) {
      checkGmailStatus();
    }
    
    if (changes.discProfile) {
      loadDiscProfile();
    }
    
    if (changes.emailsAnalyzed || changes.suggestionsUsed || changes.categoriesCreated) {
      loadUsageStats();
    }
  }
});

// Update status every 30 seconds to keep it current
setInterval(() => {
  checkGmailStatus();
  checkAIStatus();
}, 30000);