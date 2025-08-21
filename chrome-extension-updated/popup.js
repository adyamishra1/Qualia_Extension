// Gmail DISC Extension - Popup Interface

const BACKEND_URL = 'http://localhost:5000';

// DOM elements
const gmailStatus = document.getElementById('gmail-status');
const backendStatus = document.getElementById('backend-status');
const aiStatus = document.getElementById('ai-status');
const connectGmailBtn = document.getElementById('connect-gmail');
const refreshStatusBtn = document.getElementById('refresh-status');

// DISC score elements
const dScore = document.getElementById('d-score');
const iScore = document.getElementById('i-score');
const sScore = document.getElementById('s-score');
const cScore = document.getElementById('c-score');

// Stats elements
const emailsAnalyzed = document.getElementById('emails-analyzed');
const suggestionsUsed = document.getElementById('suggestions-used');
const categoriesCreated = document.getElementById('categories-created');

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  checkAllStatus();
  loadDISCProfile();
  loadStats();
  
  connectGmailBtn.addEventListener('click', connectGmail);
  refreshStatusBtn.addEventListener('click', checkAllStatus);
});

// Check all connection statuses
async function checkAllStatus() {
  setStatus(gmailStatus, 'checking', 'Checking...');
  setStatus(backendStatus, 'checking', 'Checking...');
  setStatus(aiStatus, 'checking', 'Checking...');
  
  // Check Gmail connection
  try {
    const token = await getStoredGmailToken();
    if (token) {
      setStatus(gmailStatus, 'connected', 'Connected');
      connectGmailBtn.textContent = 'Reconnect Gmail';
    } else {
      setStatus(gmailStatus, 'disconnected', 'Not Connected');
      connectGmailBtn.textContent = 'Connect Gmail';
    }
  } catch (error) {
    setStatus(gmailStatus, 'disconnected', 'Error');
  }
  
  // Check backend connection
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      setStatus(backendStatus, 'connected', 'Connected');
      
      // If backend is connected, check AI
      try {
        const aiResponse = await fetch(`${BACKEND_URL}/api/ai-status`);
        if (aiResponse.ok) {
          setStatus(aiStatus, 'connected', 'Available');
        } else {
          setStatus(aiStatus, 'disconnected', 'Unavailable');
        }
      } catch (aiError) {
        setStatus(aiStatus, 'disconnected', 'Error');
      }
    } else {
      setStatus(backendStatus, 'disconnected', 'Unavailable');
      setStatus(aiStatus, 'disconnected', 'Backend Down');
    }
  } catch (error) {
    setStatus(backendStatus, 'disconnected', 'Unavailable');
    setStatus(aiStatus, 'disconnected', 'Backend Down');
  }
}

// Set status indicator
function setStatus(element, status, text) {
  element.className = `status-indicator status-${status}`;
  element.textContent = text;
}

// Get stored Gmail token
async function getStoredGmailToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['gmailToken'], (result) => {
      resolve(result.gmailToken);
    });
  });
}

// Connect to Gmail
async function connectGmail() {
  connectGmailBtn.disabled = true;
  connectGmailBtn.textContent = 'Connecting...';
  
  try {
    // Use Chrome identity API to get Gmail token with manifest oauth2 config
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ 
        interactive: true
      }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('Gmail auth error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else if (!token) {
          reject(new Error('No token received'));
        } else {
          resolve(token);
        }
      });
    });
    
    // Store token locally
    await chrome.storage.local.set({ gmailToken: token });
    
    // Update UI
    setStatus(gmailStatus, 'connected', 'Connected');
    connectGmailBtn.textContent = 'Reconnect Gmail';
    
    // Send token to backend if available
    try {
      const response = await fetch(`${BACKEND_URL}/api/gmail-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        console.log('Token synced with backend');
      }
    } catch (backendError) {
      console.log('Backend not available, token stored locally only');
    }
    
  } catch (error) {
    console.error('Gmail connection failed:', error);
    
    // Show more specific error message
    let errorMessage = 'Failed';
    if (error.message?.includes('OAuth2 not granted')) {
      errorMessage = 'Permission Denied';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network Error';
    }
    
    setStatus(gmailStatus, 'disconnected', errorMessage);
    connectGmailBtn.textContent = 'Retry Connection';
  }
  
  connectGmailBtn.disabled = false;
}

// Load DISC profile
async function loadDISCProfile() {
  try {
    // Try to load from backend first
    const response = await fetch(`${BACKEND_URL}/api/disc-profile`);
    if (response.ok) {
      const profile = await response.json();
      updateDISCScores(profile);
      return;
    }
  } catch (error) {
    console.log('Backend not available, using demo profile');
  }
  
  // Fallback to demo data
  updateDISCScores({
    dominant: 75,
    influential: 60,
    steady: 45,
    conscientious: 80
  });
}

// Update DISC scores display
function updateDISCScores(profile) {
  dScore.textContent = profile.dominant || '--';
  iScore.textContent = profile.influential || '--';
  sScore.textContent = profile.steady || '--';
  cScore.textContent = profile.conscientious || '--';
}

// Load usage statistics
async function loadStats() {
  try {
    // Try to load from backend
    const response = await fetch(`${BACKEND_URL}/api/stats`);
    if (response.ok) {
      const stats = await response.json();
      updateStats(stats);
      return;
    }
  } catch (error) {
    console.log('Backend not available, using local stats');
  }
  
  // Fallback to local storage
  chrome.storage.local.get(['stats'], (result) => {
    const stats = result.stats || {
      emailsAnalyzed: 0,
      suggestionsUsed: 0,
      categoriesCreated: 0
    };
    updateStats(stats);
  });
}

// Update stats display
function updateStats(stats) {
  emailsAnalyzed.textContent = stats.emailsAnalyzed || 0;
  suggestionsUsed.textContent = stats.suggestionsUsed || 0;
  categoriesCreated.textContent = stats.categoriesCreated || 0;
}

// Open web interface
function openWebInterface() {
  chrome.tabs.create({ url: `${BACKEND_URL}` });
}

// Add click handlers for additional features
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('disc-score')) {
    // Show detailed DISC explanation
    showDISCDetails(e.target);
  }
});

// Show DISC details (placeholder for future feature)
function showDISCDetails(element) {
  const type = element.querySelector('.disc-score-label').textContent;
  const score = element.querySelector('.disc-score-value').textContent;
  
  // Could show detailed explanation in a modal or open web interface
  console.log(`${type} score: ${score}`);
}

// Auto-refresh status every 30 seconds
setInterval(checkAllStatus, 30000);