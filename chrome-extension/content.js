// Gmail DISC Extension - Content Script for Gmail Integration

console.log('Gmail DISC Extension content script loaded');

let isExtensionActive = false;
let currentEmailData = null;

// Initialize extension when Gmail loads
function initializeExtension() {
  if (isExtensionActive) return;
  
  console.log('Initializing Gmail DISC Extension');
  isExtensionActive = true;
  
  // Start monitoring Gmail interface
  observeGmailChanges();
  
  // Add initial email analysis if email is already open
  setTimeout(() => {
    processCurrentEmail();
  }, 2000);
}

// Monitor Gmail DOM changes
function observeGmailChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if new email content was loaded
            if (node.matches?.('[role="main"]') || 
                node.querySelector?.('[role="main"]') ||
                node.matches?.('.ii.gt') ||
                node.querySelector?.('.ii.gt')) {
              shouldProcess = true;
            }
          }
        });
      }
    });
    
    if (shouldProcess) {
      setTimeout(processCurrentEmail, 1000);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Process currently open email
function processCurrentEmail() {
  const emailContainer = document.querySelector('[role="main"]');
  if (!emailContainer) return;
  
  // Add Gmail toolbar icon first
  addGmailToolbarIcon();
  
  // Extract email data
  const emailData = extractEmailData();
  if (!emailData || !emailData.content) return;
  
  // Avoid processing the same email multiple times
  if (currentEmailData && currentEmailData.content === emailData.content) return;
  currentEmailData = emailData;
  
  console.log('Processing email:', emailData);
  
  // Add AI summary above email content
  addEmailSummary(emailData);
  
  // Add sender category badge
  addSenderCategoryBadge(emailData);
  
  // Monitor for reply/compose buttons
  monitorComposeArea();
}

// Extract email content and metadata
function extractEmailData() {
  try {
    // Get email subject
    const subjectElement = document.querySelector('h2[data-thread-perm-id]') || 
                          document.querySelector('.hP');
    const subject = subjectElement?.textContent?.trim() || '';
    
    // Get sender information
    const senderElement = document.querySelector('.go .gD') || 
                         document.querySelector('.yW .yY');
    const sender = senderElement?.getAttribute('email') || 
                  senderElement?.textContent?.trim() || '';
    
    // Get email content
    const contentElement = document.querySelector('.ii.gt div[dir="ltr"]') ||
                          document.querySelector('.ii.gt .a3s.aiL') ||
                          document.querySelector('.a3s.aiL');
    const content = contentElement?.textContent?.trim() || '';
    
    // Get timestamp
    const timeElement = document.querySelector('.g3 .g2') ||
                       document.querySelector('.gH .g3');
    const timestamp = timeElement?.getAttribute('title') || 
                     timeElement?.textContent?.trim() || '';
    
    return {
      subject,
      sender,
      content,
      timestamp,
      url: window.location.href
    };
  } catch (error) {
    console.error('Error extracting email data:', error);
    return null;
  }
}

// Add AI summary above email content
function addEmailSummary(emailData) {
  // Check if summary already exists
  if (document.querySelector('.disc-ai-summary')) return;
  
  const emailContainer = document.querySelector('.ii.gt') || 
                        document.querySelector('[role="main"] .adn.ads');
  if (!emailContainer) return;
  
  // Create summary container
  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'disc-ai-summary';
  summaryContainer.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      font-family: 'Google Sans', Roboto, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <strong style="font-size: 14px;">AI Analysis</strong>
      </div>
      <div class="summary-content" style="font-size: 13px; line-height: 1.4; opacity: 0.9;">
        Analyzing email content...
      </div>
    </div>
  `;
  
  // Insert summary before email content
  emailContainer.insertBefore(summaryContainer, emailContainer.firstChild);
  
  // Request AI analysis
  requestEmailAnalysis(emailData, summaryContainer);
}

// Add sender category badge
function addSenderCategoryBadge(emailData) {
  if (!emailData.sender) return;
  
  // Check if badge already exists
  if (document.querySelector('.disc-sender-badge')) return;
  
  const senderContainer = document.querySelector('.go .gD') ||
                         document.querySelector('.yW .yY') ||
                         document.querySelector('.gH .g2');
  
  if (!senderContainer) return;
  
  const badge = document.createElement('span');
  badge.className = 'disc-sender-badge';
  badge.innerHTML = `
    <span style="
      background: #4CAF50;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      margin-left: 8px;
      font-weight: 500;
    ">Work</span>
  `;
  
  senderContainer.appendChild(badge);
}

// Add Gmail toolbar icon (next to settings)
function addGmailToolbarIcon() {
  // Check if icon already exists
  if (document.querySelector('.disc-extension-toolbar-icon')) return;
  
  // Find Gmail's header toolbar (where settings icon is)
  const toolbar = document.querySelector('header .aeN') || 
                 document.querySelector('.gb_pc') ||
                 document.querySelector('[gh="tm"] .ar9') ||
                 document.querySelector('.aeH');
  
  if (!toolbar) {
    console.log('Gmail toolbar not found');
    return;
  }
  
  // Create extension icon
  const iconContainer = document.createElement('div');
  iconContainer.className = 'disc-extension-toolbar-icon';
  iconContainer.innerHTML = `
    <div class="disc-toolbar-btn" title="Gmail DISC Extension" style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      margin: 0 4px;
      color: #5f6368;
      transition: background-color 0.2s;
    " onmouseover="this.style.backgroundColor='#f1f3f4'" onmouseout="this.style.backgroundColor='transparent'">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
  `;
  
  // Add click handler
  iconContainer.addEventListener('click', () => {
    openExtensionPanel();
  });
  
  // Insert into toolbar
  toolbar.appendChild(iconContainer);
  
  console.log('Gmail toolbar icon added');
}

// Open extension panel/popup
function openExtensionPanel() {
  // For now, just show a notification
  showNotification('Extension popup would open here', 'info', 2000);
  
  // In a full implementation, this could open a side panel or overlay
  // For testing, just trigger the browser extension popup
  console.log('Extension panel triggered');
}

// Monitor compose/reply area for response suggestions
function monitorComposeArea() {
  const composeArea = document.querySelector('[role="textbox"][contenteditable="true"]');
  if (!composeArea) {
    // Check again later
    setTimeout(monitorComposeArea, 2000);
    return;
  }
  
  // Check if suggestions panel already exists
  if (document.querySelector('.disc-suggestions-panel')) return;
  
  // Add response suggestions panel
  addResponseSuggestionsPanel(composeArea);
}

// Add response suggestions panel
function addResponseSuggestionsPanel(composeArea) {
  const composeContainer = composeArea.closest('.iN') || composeArea.closest('.Am');
  if (!composeContainer) return;
  
  const suggestionsPanel = document.createElement('div');
  suggestionsPanel.className = 'disc-suggestions-panel';
  suggestionsPanel.innerHTML = `
    <div style="
      background: white;
      border: 1px solid #dadce0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    ">
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1a73e8" style="margin-right: 8px;">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <strong style="color: #1a73e8; font-size: 14px;">Response Suggestions</strong>
      </div>
      <div class="suggestions-content" style="font-size: 13px;">
        <div style="color: #5f6368; margin-bottom: 8px;">Generating DISC-based suggestions...</div>
      </div>
    </div>
  `;
  
  composeContainer.insertBefore(suggestionsPanel, composeArea.parentNode);
  
  // Request response suggestions
  if (currentEmailData) {
    requestResponseSuggestions(currentEmailData, suggestionsPanel);
  }
}

// Request email analysis from background script
function requestEmailAnalysis(emailData, summaryContainer) {
  chrome.runtime.sendMessage({
    action: 'analyzeEmail',
    emailData: emailData
  }, (response) => {
    const contentDiv = summaryContainer.querySelector('.summary-content');
    
    if (response && response.success) {
      const analysis = response.analysis;
      contentDiv.innerHTML = `
        <div style="margin-bottom: 6px;">
          <strong>Priority:</strong> ${analysis.priority || 'Medium'} | 
          <strong>Category:</strong> ${analysis.category || 'General'} |
          <strong>Style:</strong> ${analysis.communicationStyle || 'Professional'}
        </div>
        <div>${analysis.summary || 'Email analysis completed.'}</div>
      `;
    } else {
      // Local analysis fallback
      const localAnalysis = analyzeEmailLocally(emailData);
      contentDiv.innerHTML = `
        <div style="margin-bottom: 6px;">
          <strong>Priority:</strong> ${localAnalysis.priority} | 
          <strong>Category:</strong> ${localAnalysis.category} |
          <strong>Style:</strong> ${localAnalysis.style}
        </div>
        <div>${localAnalysis.summary}</div>
      `;
    }
  });
}

// Request response suggestions from background script
function requestResponseSuggestions(emailData, suggestionsPanel) {
  chrome.runtime.sendMessage({
    action: 'getResponseSuggestions',
    emailData: emailData
  }, (response) => {
    const contentDiv = suggestionsPanel.querySelector('.suggestions-content');
    
    if (response && response.success && response.suggestions) {
      displayResponseSuggestions(response.suggestions, contentDiv);
    } else {
      // Local suggestions fallback
      const localSuggestions = generateLocalSuggestions(emailData);
      displayResponseSuggestions(localSuggestions, contentDiv);
    }
  });
}

// Display response suggestions
function displayResponseSuggestions(suggestions, container) {
  container.innerHTML = suggestions.map((suggestion, index) => `
    <div style="
      background: #f8f9fa;
      border: 1px solid #e8eaed;
      border-radius: 6px;
      padding: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: background-color 0.2s;
    " 
    onmouseover="this.style.background='#e8f0fe'"
    onmouseout="this.style.background='#f8f9fa'"
    onclick="document.querySelector('[role=\\"textbox\\"][contenteditable=\\"true\\"]').innerHTML = '${suggestion.text.replace(/'/g, "\\'")}'; this.style.background='#d4edda';">
      <div style="font-weight: 500; color: #1a73e8; font-size: 12px; margin-bottom: 4px;">
        ${suggestion.style} Style
      </div>
      <div style="line-height: 1.4;">
        ${suggestion.text}
      </div>
    </div>
  `).join('');
}

// Local email analysis fallback
function analyzeEmailLocally(emailData) {
  const content = emailData.content.toLowerCase();
  const subject = emailData.subject.toLowerCase();
  
  // Priority detection
  let priority = 'Medium';
  if (content.includes('urgent') || content.includes('asap') || subject.includes('urgent')) {
    priority = 'High';
  } else if (content.includes('fyi') || content.includes('no rush')) {
    priority = 'Low';
  }
  
  // Category detection
  let category = 'General';
  if (content.includes('meeting') || content.includes('schedule')) {
    category = 'Meeting';
  } else if (content.includes('project') || content.includes('deadline')) {
    category = 'Project';
  } else if (content.includes('invoice') || content.includes('payment')) {
    category = 'Finance';
  }
  
  // Style detection
  let style = 'Professional';
  if (content.includes('thanks') && content.includes('appreciate')) {
    style = 'Friendly';
  } else if (content.length < 100) {
    style = 'Direct';
  }
  
  return {
    priority,
    category,
    style,
    summary: `${priority} priority ${category.toLowerCase()} email with ${style.toLowerCase()} tone.`
  };
}

// Local response suggestions fallback
function generateLocalSuggestions(emailData) {
  const content = emailData.content.toLowerCase();
  
  const suggestions = [];
  
  // Dominant style - direct and results-focused
  suggestions.push({
    style: 'Dominant',
    text: 'Thanks for your email. I\'ll review this and get back to you with next steps by end of day.'
  });
  
  // Influential style - enthusiastic and people-focused
  suggestions.push({
    style: 'Influential',
    text: 'Hi! Thanks so much for reaching out. I\'d love to discuss this further. How about we set up a quick call?'
  });
  
  // Steady style - supportive and collaborative
  suggestions.push({
    style: 'Steady',
    text: 'Thank you for bringing this to my attention. I want to make sure we handle this properly. Let me know how I can support you.'
  });
  
  // Conscientious style - detailed and analytical
  suggestions.push({
    style: 'Conscientious',
    text: 'Thank you for your detailed message. I need to review the information thoroughly and will provide a comprehensive response within 24 hours.'
  });
  
  return suggestions;
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

// Also initialize on navigation changes (Gmail is a SPA)
window.addEventListener('popstate', () => {
  setTimeout(initializeExtension, 1000);
});