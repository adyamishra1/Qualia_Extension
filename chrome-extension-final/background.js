// Background script for Gmail DISC Extension
console.log('Gmail DISC Extension background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Set default storage values
    chrome.storage.local.set({
      gmailConnected: false,
      discProfile: null,
      extensionActive: true
    });
    
    console.log('Extension installed successfully');
  }
});

// Handle OAuth token requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getGmailToken') {
    handleGmailAuth(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'clearAuth') {
    clearAuthTokens(sendResponse);
    return true;
  }
});

// Handle Gmail authentication
async function handleGmailAuth(sendResponse) {
  try {
    // Clear any existing cached tokens
    chrome.identity.clearAllCachedAuthTokens(() => {
      console.log('Cleared all cached auth tokens');
      
      // Get new token using manifest oauth2 config
      chrome.identity.getAuthToken({
        interactive: true
      }, (token) => {
        if (chrome.runtime.lastError) {
          console.error('OAuth error:', chrome.runtime.lastError);
          sendResponse({ 
            success: false, 
            error: chrome.runtime.lastError.message 
          });
        } else if (!token) {
          sendResponse({ 
            success: false, 
            error: 'No token received from Google' 
          });
        } else {
          console.log('Token obtained successfully');
          
          // Store token and update status
          chrome.storage.local.set({
            gmailToken: token,
            gmailConnected: true,
            connectionTime: Date.now()
          }, () => {
            // Verify token works with Gmail API
            verifyGmailToken(token, sendResponse);
          });
        }
      });
    });
  } catch (error) {
    console.error('Auth handler error:', error);
    sendResponse({ 
      success: false, 
      error: error.message 
    });
  }
}

// Verify Gmail token works
async function verifyGmailToken(token, sendResponse) {
  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('Gmail API verification successful:', profile.emailAddress);
      
      sendResponse({ 
        success: true, 
        token: token,
        email: profile.emailAddress 
      });
    } else {
      console.log('Gmail API verification failed, but token stored');
      sendResponse({ 
        success: true, 
        token: token,
        warning: 'Gmail API verification failed'
      });
    }
  } catch (error) {
    console.log('Gmail API test failed:', error);
    // Still consider success since token was obtained
    sendResponse({ 
      success: true, 
      token: token,
      warning: 'Gmail API test failed but token stored'
    });
  }
}

// Clear authentication tokens
function clearAuthTokens(sendResponse) {
  chrome.identity.clearAllCachedAuthTokens(() => {
    chrome.storage.local.remove(['gmailToken', 'gmailConnected', 'connectionTime'], () => {
      console.log('All auth tokens cleared');
      sendResponse({ success: true });
    });
  });
}

// Handle content script messages
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'gmail-content') {
    port.onMessage.addListener(async (msg) => {
      if (msg.action === 'analyzeEmail') {
        // Get stored token
        chrome.storage.local.get(['gmailToken'], (result) => {
          if (result.gmailToken) {
            // Forward to content script with token
            port.postMessage({
              action: 'tokenAvailable',
              token: result.gmailToken
            });
          } else {
            port.postMessage({
              action: 'tokenRequired'
            });
          }
        });
      }
    });
  }
});

// Handle tab updates to inject content scripts
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('mail.google.com') || tab.url.includes('gmail.com')) {
      console.log('Gmail tab detected, content script should be active');
    }
  }
});

console.log('Background script setup complete');