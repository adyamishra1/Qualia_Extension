// Gmail DISC Extension - Content Script for Gmail Integration

console.log('Gmail DISC Extension content script loaded');

let isExtensionActive = false;
let currentEmailData = null;
let userDiscProfile = null;

// Initialize extension when Gmail loads
function initializeExtension() {
  if (isExtensionActive) return;
  
  console.log('Initializing Gmail DISC Extension');
  isExtensionActive = true;
  
  // Load user DISC profile
  loadUserDiscProfile();
  
  // Start monitoring Gmail interface
  observeGmailChanges();
  
  // Add initial email analysis if email is already open
  setTimeout(() => {
    processCurrentEmail();
  }, 2000);
}

// Load user DISC profile from storage
function loadUserDiscProfile() {
  chrome.storage.local.get(['discProfile'], (result) => {
    if (result.discProfile) {
      userDiscProfile = result.discProfile;
      console.log('User DISC profile loaded:', userDiscProfile);
    } else {
      // Default DISC profile if none exists
      userDiscProfile = {
        primaryStyle: 'S',
        scores: { D: 25, I: 25, S: 25, C: 25 },
        analysis: 'Balanced communication style'
      };
    }
  });
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
  
  // Add comprehensive AI analysis panel above email content
  addComprehensiveAnalysisPanel(emailData);
  
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

// Add comprehensive AI analysis panel (replaces simple summary)
function addComprehensiveAnalysisPanel(emailData) {
  // Check if panel already exists
  if (document.querySelector('.disc-ai-analysis-panel')) return;
  
  const emailContainer = document.querySelector('.ii.gt') || 
                        document.querySelector('[role="main"] .adn.ads');
  if (!emailContainer) return;
  
  // Create comprehensive analysis panel
  const analysisPanel = document.createElement('div');
  analysisPanel.className = 'disc-ai-analysis-panel';
  analysisPanel.innerHTML = `
    <div style="
      background: white;
      border: 1px solid #dadce0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: 'Google Sans', Roboto, sans-serif;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" style="margin-right: 8px;">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <strong style="font-size: 16px; color: #1a73e8;">AI Email Analysis</strong>
        </div>
        <span style="
          background: #1a73e8;
          color: white;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
        ">DISC Extension</span>
      </div>
      
      <div class="analysis-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
        <!-- Communication Style Card -->
        <div class="analysis-card" style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        ">
          <div style="margin-bottom: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#34a853" style="margin: 0 auto;">
              <path d="M7 14l3-3 2 2 7-7 2 2-9 9-4-4z"/>
            </svg>
          </div>
          <div style="font-size: 12px; color: #5f6368; margin-bottom: 4px;">Communication Style</div>
          <div class="style-result" style="font-size: 18px; font-weight: 600; color: #202124;">Analyzing...</div>
          <div class="style-description" style="font-size: 11px; color: #5f6368; margin-top: 4px;">Processing...</div>
        </div>
        
        <!-- Priority Level Card -->
        <div class="analysis-card" style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        ">
          <div style="margin-bottom: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#ea4335" style="margin: 0 auto;">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div style="font-size: 12px; color: #5f6368; margin-bottom: 4px;">Priority Level</div>
          <div class="priority-result" style="font-size: 18px; font-weight: 600; color: #202124;">Analyzing...</div>
          <div class="priority-tags" style="margin-top: 8px;"></div>
        </div>
        
        <!-- Response Style Card -->
        <div class="analysis-card" style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        ">
          <div style="margin-bottom: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#4285f4" style="margin: 0 auto;">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div style="font-size: 12px; color: #5f6368; margin-bottom: 4px;">Response Style</div>
          <div class="response-result" style="font-size: 14px; color: #202124; line-height: 1.3;">Analyzing...</div>
        </div>
      </div>
      
      <!-- AI-Generated Response Suggestion -->
      <div class="response-suggestion-section" style="
        background: #f8f9fa;
        border: 1px solid #e8eaed;
        border-radius: 8px;
        padding: 16px;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1a73e8" style="margin-right: 8px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <strong style="color: #1a73e8; font-size: 14px;">AI-Generated Response Suggestion</strong>
        </div>
        <div class="response-content" style="
          background: white;
          border: 1px solid #e8eaed;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
          font-size: 13px;
          line-height: 1.5;
          color: #202124;
        ">
          <div class="response-text">Analyzing email content and generating personalized response...</div>
        </div>
        <div style="
          font-size: 11px;
          color: #5f6368;
          margin-bottom: 12px;
          font-style: italic;
        ">Calibrated to your DISC profile and sender's communication style</div>
        <div style="display: flex; gap: 8px;">
          <button class="copy-response-btn" style="
            background: white;
            border: 1px solid #dadce0;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 12px;
            color: #5f6368;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
            Copy Response
          </button>
          <button class="use-draft-btn" style="
            background: #1a73e8;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 12px;
            color: white;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          " onmouseover="this.style.background='#1557b0'" onmouseout="this.style.background='#1a73e8'">
            Use as Draft
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Insert panel before email content
  emailContainer.insertBefore(analysisPanel, emailContainer.firstChild);
  
  // Perform comprehensive analysis
  performComprehensiveAnalysis(emailData, analysisPanel);
  
  // Add event listeners for buttons
  addAnalysisPanelEventListeners(analysisPanel);
}

// Perform comprehensive DISC-based email analysis
function performComprehensiveAnalysis(emailData, analysisPanel) {
  // Analyze communication style
  const communicationStyle = analyzeCommunicationStyle(emailData);
  const styleCard = analysisPanel.querySelector('.style-result');
  const styleDesc = analysisPanel.querySelector('.style-description');
  
  if (styleCard && styleDesc) {
    styleCard.textContent = communicationStyle.style;
    styleDesc.textContent = communicationStyle.description;
  }
  
  // Analyze priority level
  const priorityAnalysis = analyzePriorityLevel(emailData);
  const priorityCard = analysisPanel.querySelector('.priority-result');
  const priorityTags = analysisPanel.querySelector('.priority-tags');
  
  if (priorityCard && priorityTags) {
    priorityCard.textContent = priorityAnalysis.level;
    priorityCard.style.color = priorityAnalysis.color;
    priorityTags.innerHTML = priorityAnalysis.tags.map(tag => 
      `<span style="
        background: #e8f0fe;
        color: #1a73e8;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        margin: 2px;
        display: inline-block;
      ">${tag}</span>`
    ).join('');
  }
  
  // Analyze response style
  const responseStyle = analyzeResponseStyle(emailData, userDiscProfile);
  const responseCard = analysisPanel.querySelector('.response-result');
  
  if (responseCard) {
    responseCard.textContent = responseStyle;
  }
  
  // Generate AI response suggestion
  generateAIResponseSuggestion(emailData, analysisPanel);
}

// Analyze communication style using DISC framework
function analyzeCommunicationStyle(emailData) {
  const content = emailData.content.toLowerCase();
  const subject = emailData.subject.toLowerCase();
  
  // DISC style detection logic
  let style = 'Balanced';
  let description = 'Professional tone';
  
  // Dominant (D) - Direct, results-focused
  if (content.includes('urgent') || content.includes('asap') || content.includes('deadline') ||
      content.includes('need') || content.includes('must') || content.includes('immediately')) {
    style = 'Dominant';
    description = 'Urgent/Direct';
  }
  // Influential (I) - Enthusiastic, people-focused
  else if (content.includes('great') || content.includes('excited') || content.includes('wonderful') ||
           content.includes('love') || content.includes('amazing') || content.includes('fantastic')) {
    style = 'Influential';
    description = 'Enthusiastic/People-oriented';
  }
  // Steady (S) - Supportive, collaborative
  else if (content.includes('support') || content.includes('help') || content.includes('collaborate') ||
           content.includes('together') || content.includes('partnership') || content.includes('assist')) {
    style = 'Steady';
    description = 'Supportive/Collaborative';
  }
  // Conscientious (C) - Analytical, detailed
  else if (content.includes('review') || content.includes('analyze') || content.includes('details') ||
           content.includes('process') || content.includes('procedure') || content.includes('documentation')) {
    style = 'Conscientious';
    description = 'Analytical/Detailed';
  }
  
  return { style, description };
}

// Analyze priority level with tags
function analyzePriorityLevel(emailData) {
  const content = emailData.content.toLowerCase();
  const subject = emailData.subject.toLowerCase();
  
  let level = 'Medium';
  let color = '#f9ab00';
  let tags = [];
  
  // High priority indicators
  if (content.includes('urgent') || content.includes('asap') || content.includes('emergency') ||
      subject.includes('urgent') || subject.includes('asap') || subject.includes('emergency')) {
    level = 'High';
    color = '#ea4335';
    tags = ['Urgent', 'Deadline', 'Action Required'];
  }
  // Low priority indicators
  else if (content.includes('fyi') || content.includes('no rush') || content.includes('when convenient') ||
           content.includes('informational') || content.includes('update')) {
    level = 'Low';
    color = '#34a853';
    tags = ['Informational', 'No Action Required'];
  }
  // Medium priority (default)
  else {
    tags = ['Standard', 'Business'];
    
    // Add specific tags based on content
    if (content.includes('meeting') || content.includes('schedule')) tags.push('Meeting');
    if (content.includes('project') || content.includes('deadline')) tags.push('Project');
    if (content.includes('budget') || content.includes('financial')) tags.push('Budget');
    if (content.includes('review') || content.includes('feedback')) tags.push('Review');
  }
  
  return { level, color, tags };
}

// Analyze response style based on user's DISC profile and email content
function analyzeResponseStyle(emailData, userProfile) {
  if (!userProfile) return 'Professional, Balanced';
  
  const userStyle = userProfile.primaryStyle;
  const content = emailData.content.toLowerCase();
  
  const responseStyles = {
    'D': 'Professional, Direct, Action-oriented',
    'I': 'Enthusiastic, Engaging, People-focused',
    'S': 'Supportive, Collaborative, Patient',
    'C': 'Detailed, Analytical, Thorough'
  };
  
  return responseStyles[userStyle] || 'Professional, Balanced';
}

// Generate AI-powered response suggestion
function generateAIResponseSuggestion(emailData, analysisPanel) {
  const responseText = analysisPanel.querySelector('.response-text');
  if (!responseText) return;
  
  // Generate response based on DISC analysis and email content
  const response = generatePersonalizedResponse(emailData, userDiscProfile);
  
  responseText.innerHTML = response.replace(/\n/g, '<br>');
}

// Generate personalized response based on DISC profile and email content
function generatePersonalizedResponse(emailData, userProfile) {
  const content = emailData.content.toLowerCase();
  const subject = emailData.subject.toLowerCase();
  const sender = emailData.sender;
  
  // Extract sender name
  const senderName = sender.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Base response structure
  let response = `Hi ${senderName},\n\n`;
  
  // Analyze email intent and generate appropriate response
  if (content.includes('meeting') || content.includes('schedule')) {
    response += `Thank you for reaching out about scheduling. I'd be happy to coordinate a meeting time that works for both of us.\n\n`;
    response += `Could you please let me know your availability for this week or next? I'm flexible and can work around your schedule.\n\n`;
  } else if (content.includes('project') || content.includes('deadline')) {
    response += `I appreciate you bringing this project to my attention. I'll review the requirements and get back to you with a timeline and next steps.\n\n`;
    response += `To ensure we're aligned, could you confirm the key deliverables and any specific constraints I should be aware of?\n\n`;
  } else if (content.includes('review') || content.includes('feedback')) {
    response += `Thank you for sharing this for review. I'll take the time to thoroughly examine the content and provide detailed feedback.\n\n`;
    response += `I should be able to get back to you with my thoughts within the next 24-48 hours. Is there anything specific you'd like me to focus on?\n\n`;
  } else if (content.includes('urgent') || content.includes('asap')) {
    response += `I understand this is time-sensitive. I'll prioritize this and get back to you as soon as possible.\n\n`;
    response += `To help me respond effectively, could you please clarify the most critical aspects that need immediate attention?\n\n`;
  } else {
    response += `Thank you for your email. I've reviewed the content and will follow up with any questions or next steps.\n\n`;
    response += `Is there anything specific you'd like me to address or any particular timeline I should be aware of?\n\n`;
  }
  
  // Add DISC-appropriate closing
  const closings = {
    'D': 'Best regards,',
    'I': 'Looking forward to connecting!',
    'S': 'Thank you for your time and consideration.',
    'C': 'I appreciate your attention to this matter.'
  };
  
  response += closings[userProfile?.primaryStyle] || 'Best regards,';
  
  return response;
}

// Add event listeners for analysis panel buttons
function addAnalysisPanelEventListeners(analysisPanel) {
  const copyBtn = analysisPanel.querySelector('.copy-response-btn');
  const useDraftBtn = analysisPanel.querySelector('.use-draft-btn');
  
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const responseText = analysisPanel.querySelector('.response-text');
      if (responseText) {
        const text = responseText.textContent || responseText.innerText;
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy Response';
          }, 2000);
        });
      }
    });
  }
  
  if (useDraftBtn) {
    useDraftBtn.addEventListener('click', () => {
      const responseText = analysisPanel.querySelector('.response-text');
      if (responseText) {
        const text = responseText.textContent || responseText.innerText;
        
        // Find Gmail compose area and insert the response
        const composeArea = document.querySelector('[role="textbox"][contenteditable="true"]');
        if (composeArea) {
          composeArea.innerHTML = text;
          composeArea.focus();
          
          // Show success feedback
          useDraftBtn.textContent = 'Draft Inserted!';
          useDraftBtn.style.background = '#34a853';
          setTimeout(() => {
            useDraftBtn.textContent = 'Use as Draft';
            useDraftBtn.style.background = '#1a73e8';
          }, 2000);
        }
      }
    });
  }
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

// These functions are no longer needed as we now have comprehensive DISC analysis

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