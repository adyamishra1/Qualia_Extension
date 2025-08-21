// Gmail DISC Extension - Background Service Worker

const BACKEND_URL = 'http://localhost:5000';

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Gmail DISC Extension installed');
});

// Handle OAuth authentication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'authenticateGmail') {
    handleGmailAuth(sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'analyzeEmail') {
    analyzeEmailContent(request.emailData, sendResponse);
    return true;
  }
  
  if (request.action === 'getResponseSuggestions') {
    getResponseSuggestions(request.emailData, sendResponse);
    return true;
  }
});

async function handleGmailAuth(sendResponse) {
  try {
    const token = await getAuthToken();
    if (token) {
      // Store token and notify content script
      await chrome.storage.local.set({ gmailToken: token });
      sendResponse({ success: true, token: token });
    } else {
      sendResponse({ success: false, error: 'Failed to get auth token' });
    }
  } catch (error) {
    console.error('Gmail auth error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ 
      interactive: true,
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      ]
    }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

async function analyzeEmailContent(emailData, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/analyze-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    sendResponse({ success: true, analysis: result });
  } catch (error) {
    console.error('Email analysis error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function getResponseSuggestions(emailData, sendResponse) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/response-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });
    
    const result = await response.json();
    sendResponse({ success: true, suggestions: result });
  } catch (error) {
    console.error('Response suggestions error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle tab updates to inject content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      (tab.url?.includes('mail.google.com') || tab.url?.includes('gmail.com'))) {
    console.log('Gmail tab detected, content script should be active');
  }
});