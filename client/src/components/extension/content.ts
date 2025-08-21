// Content script for Gmail DISC Extension
/// <reference types="chrome"/>
// This script runs in the Gmail page context and injects React components

// Wait for Gmail to load
let gmailLoaded = false;
let extensionActive = false;

// Gmail DOM selectors
const SELECTORS = {
  emailList: 'tr.zA',
  emailContent: '.ii.gt .a3s.aiL',
  emailSubject: '.hP',
  emailSender: '.go span[email]',
  composeButton: '.T-I.T-I-KE.L3',
  sendButton: '.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3',
  sidebar: '.aeN',
  composeDraft: '.M9',
};

// Initialize extension when Gmail loads
function initializeExtension() {
  if (extensionActive) return;
  
  console.log('Initializing Gmail DISC Extension');
  extensionActive = true;
  
  // Add extension indicator to Gmail header
  addExtensionIndicator();
  
  // Add sender categories to sidebar
  addSenderCategories();
  
  // Monitor email list changes
  observeEmailList();
  
  // Monitor compose window
  observeCompose();
  
  // Process existing emails
  processExistingEmails();
}

function addExtensionIndicator() {
  const header = document.querySelector('.gb_Pc.gb_Wc.gb_ad.gb_9d');
  if (!header || document.querySelector('.disc-extension-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.className = 'disc-extension-indicator';
  indicator.innerHTML = `
    <div style="
      background: #e8f5e8;
      color: #16a34a;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      margin-right: 16px;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      DISC Extension Active
    </div>
  `;
  
  header.appendChild(indicator);
}

function addSenderCategories() {
  const sidebar = document.querySelector(SELECTORS.sidebar);
  if (!sidebar || document.querySelector('.disc-sender-categories')) return;
  
  const categoriesContainer = document.createElement('div');
  categoriesContainer.className = 'disc-sender-categories';
  categoriesContainer.innerHTML = `
    <div style="
      padding: 16px 0;
      border-top: 1px solid #e8eaed;
      margin-top: 16px;
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 0 16px;
      ">
        <h3 style="
          font-size: 14px;
          font-weight: 500;
          color: #202124;
          margin: 0;
        ">My Sender Categories</h3>
        <button class="disc-settings-btn" style="
          background: none;
          border: none;
          color: #1a73e8;
          cursor: pointer;
          padding: 4px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
        </button>
      </div>
      <div class="disc-categories-list" id="disc-categories-list">
        <div style="padding: 8px 16px; color: #5f6368; font-size: 13px;">
          Loading categories...
        </div>
      </div>
    </div>
  `;
  
  sidebar.appendChild(categoriesContainer);
  
  // Load categories
  loadSenderCategories();
}

async function loadSenderCategories() {
  try {
    const response = await fetch('/api/categories', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const categories = await response.json();
      renderCategories(categories);
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

function renderCategories(categories: any[]) {
  const container = document.getElementById('disc-categories-list');
  if (!container) return;
  
  if (categories.length === 0) {
    container.innerHTML = `
      <div style="padding: 8px 16px; color: #5f6368; font-size: 13px; text-align: center;">
        <p>No categories yet</p>
        <button style="
          background: none;
          border: 1px solid #dadce0;
          color: #1a73e8;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          margin-top: 4px;
        " onclick="window.open('/onboarding?step=categories', '_blank')">
          Create Categories
        </button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = categories.map(category => `
    <a href="#" class="disc-category-link" data-category="${category.id}" style="
      display: flex;
      align-items: center;
      padding: 8px 16px;
      text-decoration: none;
      color: #5f6368;
      font-size: 13px;
      border-radius: 0 16px 16px 0;
      margin-right: 8px;
    " onmouseover="this.style.backgroundColor='#f1f3f4'" onmouseout="this.style.backgroundColor='transparent'">
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: ${category.color};
        margin-right: 12px;
      "></div>
      <span style="flex: 1;">${category.name}</span>
      <span style="font-size: 11px; color: #80868b;">0</span>
    </a>
  `).join('');
}

function observeEmailList() {
  const emailList = document.querySelector('.AO');
  if (!emailList) return;
  
  const observer = new MutationObserver(() => {
    processNewEmails();
  });
  
  observer.observe(emailList, {
    childList: true,
    subtree: true
  });
}

function processExistingEmails() {
  const emailRows = document.querySelectorAll(SELECTORS.emailList);
  emailRows.forEach(processEmailRow);
}

function processNewEmails() {
  const emailRows = document.querySelectorAll(SELECTORS.emailList + ':not(.disc-processed)');
  emailRows.forEach(processEmailRow);
}

function processEmailRow(emailRow: Element) {
  emailRow.classList.add('disc-processed');
  
  // Add category indicator and DISC style badge
  const senderElement = emailRow.querySelector('.yW span');
  if (!senderElement) return;
  
  // Create category and DISC indicators
  const indicatorContainer = document.createElement('div');
  indicatorContainer.className = 'disc-indicators';
  indicatorContainer.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: 8px;
  `;
  
  // Category badge (placeholder - would be populated by AI classification)
  const categoryBadge = document.createElement('span');
  categoryBadge.className = 'disc-category-badge';
  categoryBadge.style.cssText = `
    background: #fee2e2;
    color: #dc2626;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 8px;
  `;
  categoryBadge.textContent = 'Parents';
  
  // DISC style indicator
  const discBadge = document.createElement('div');
  discBadge.className = 'disc-style-badge';
  discBadge.style.cssText = `
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #eab308;
    color: white;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  discBadge.textContent = 'I';
  discBadge.title = 'Influence Style';
  
  indicatorContainer.appendChild(categoryBadge);
  indicatorContainer.appendChild(discBadge);
  
  senderElement.parentNode?.appendChild(indicatorContainer);
}

function observeCompose() {
  // Monitor for compose windows
  const observer = new MutationObserver(() => {
    const composeWindows = document.querySelectorAll('.M9:not(.disc-enhanced)');
    composeWindows.forEach(enhanceComposeWindow);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function enhanceComposeWindow(composeWindow: Element) {
  composeWindow.classList.add('disc-enhanced');
  
  // Find the send button area
  const sendButton = composeWindow.querySelector('.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3');
  if (!sendButton) return;
  
  // Add response suggestions container
  const suggestionsContainer = document.createElement('div');
  suggestionsContainer.className = 'disc-response-suggestions';
  suggestionsContainer.innerHTML = `
    <div style="
      margin-top: 16px;
      background: linear-gradient(to right, #eff6ff, #f0fdf4);
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 16px;
    ">
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      ">
        <h3 style="
          font-size: 14px;
          font-weight: 500;
          color: #202124;
          margin: 0;
          display: flex;
          align-items: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px; color: #1a73e8;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          AI Response Suggestions
          <span style="
            background: #dbeafe;
            color: #1e40af;
            font-size: 11px;
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 8px;
            margin-left: 8px;
          ">Your Style: Steadiness</span>
        </h3>
        <button style="
          background: none;
          border: none;
          color: #5f6368;
          font-size: 12px;
          cursor: pointer;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
          </svg>
          Customize
        </button>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="disc-response-option" style="
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.borderColor='#1a73e8'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          ">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #16a34a;
                color: white;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
              ">S</div>
              <span style="font-size: 12px; font-weight: 500; color: #16a34a;">Supportive & Collaborative</span>
            </div>
            <button style="
              background: none;
              border: none;
              color: #1a73e8;
              font-size: 11px;
              font-weight: 500;
              cursor: pointer;
            ">Use This</button>
          </div>
          <p style="
            font-size: 12px;
            color: #4b5563;
            line-height: 1.4;
            margin: 0 0 8px 0;
          ">
            "Hi Sarah, I really appreciate you reaching out - it shows how much you care about Emma's success. I've noticed the same challenges and would love to work together on a plan..."
          </p>
          <div style="
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #6b7280;
          ">
            <span>Tone: Reassuring, collaborative</span>
            <span>✓ 94% match</span>
          </div>
        </div>
        
        <div class="disc-response-option" style="
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.borderColor='#1a73e8'; this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          ">
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #eab308;
                color: white;
                font-size: 10px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
              ">I</div>
              <span style="font-size: 12px; font-weight: 500; color: #eab308;">Warm & Encouraging</span>
            </div>
            <button style="
              background: none;
              border: none;
              color: #1a73e8;
              font-size: 11px;
              font-weight: 500;
              cursor: pointer;
            ">Use This</button>
          </div>
          <p style="
            font-size: 12px;
            color: #4b5563;
            line-height: 1.4;
            margin: 0 0 8px 0;
          ">
            "Dear Sarah, Thank you so much for this thoughtful email! Your dedication to Emma's success is wonderful to see. I completely understand your concerns..."
          </p>
          <div style="
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #6b7280;
          ">
            <span>Tone: Enthusiastic, personal</span>
            <span>✓ 87% match</span>
          </div>
        </div>
      </div>
      
      <div style="
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #6b7280;
      ">
        <div style="display: flex; gap: 16px;">
          <span>🧠 Based on your Steadiness communication style</span>
          <span>📊 Learned from 247 similar emails</span>
        </div>
        <button style="
          background: none;
          border: none;
          color: #1a73e8;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        ">Generate New Options</button>
      </div>
    </div>
  `;
  
  // Insert after the send button area
  sendButton.parentNode?.parentNode?.appendChild(suggestionsContainer);
}

// Enhanced email view with summary
function enhanceEmailView() {
  const emailContent = document.querySelector('.ii.gt');
  if (!emailContent || emailContent.querySelector('.disc-email-summary')) return;
  
  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'disc-email-summary';
  summaryContainer.innerHTML = `
    <div style="
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    ">
      <div style="
        display: flex;
        align-items: start;
        justify-content: space-between;
        margin-bottom: 12px;
      ">
        <h3 style="
          font-size: 14px;
          font-weight: 500;
          color: #1e3a8a;
          margin: 0;
          display: flex;
          align-items: center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          AI Summary
        </h3>
        <div style="display: flex; gap: 8px;">
          <span style="
            background: #fee2e2;
            color: #dc2626;
            font-size: 11px;
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 8px;
          ">Parents</span>
          <div style="
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #eab308;
            color: white;
            font-size: 10px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
          " title="Influence Communication Style">I</div>
        </div>
      </div>
      <p style="
        color: #1e40af;
        line-height: 1.5;
        margin: 0 0 12px 0;
        font-size: 14px;
      ">
        <strong>Parent wants to schedule a conference</strong> to discuss their child Emma's recent progress in math class. 
        They're concerned about her grades and want to understand how to better support her at home. 
        Tone is supportive but anxious - typical Influence style seeking personal connection and reassurance.
      </p>
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 12px;
        border-top: 1px solid #dbeafe;
      ">
        <div style="
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #1d4ed8;
        ">
          <span>⏰ Response expected within 24h</span>
          <span>🚩 High priority</span>
        </div>
        <button style="
          background: none;
          border: none;
          color: #1a73e8;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        ">View Analysis Details</button>
      </div>
    </div>
  `;
  
  const firstEmailDiv = emailContent.querySelector('.a3s.aiL');
  if (firstEmailDiv) {
    firstEmailDiv.parentNode?.insertBefore(summaryContainer, firstEmailDiv);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeExtension, 1000);
  });
} else {
  setTimeout(initializeExtension, 1000);
}

// Re-initialize on navigation changes (Gmail SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    setTimeout(() => {
      if (url.includes('mail.google.com')) {
        enhanceEmailView();
      }
    }, 500);
  }
}).observe(document, { subtree: true, childList: true });

// Message listener for background script
chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
  if (request.action === 'pageLoaded') {
    initializeExtension();
  }
});
