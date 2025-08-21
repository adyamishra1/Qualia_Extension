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

// Get user DISC profile as a Promise
function getUserDiscProfile() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['discProfile'], (result) => {
      if (result.discProfile) {
        resolve(result.discProfile);
      } else {
        // Default DISC profile if none exists
        resolve({
          primaryStyle: 'S',
          scores: { D: 25, I: 25, S: 25, C: 25 },
          analysis: 'Balanced communication style'
        });
      }
    });
  });
}

// Display response suggestions with "Use as Draft" buttons
function displayResponseSuggestions(suggestions, container) {
  const suggestionsHtml = suggestions.map((suggestion, index) => {
    const discStyleColors = {
      'D': '#ea4335', // Red for Dominant
      'I': '#fbbc04', // Yellow for Influential  
      'S': '#34a853', // Green for Steady
      'C': '#4285f4'  // Blue for Conscientious
    };
    
    const color = discStyleColors[suggestion.discStyle] || '#5f6368';
    
    return `
      <div class="suggestion-card" style="
        background: white;
        border: 1px solid #e8eaed;
        border-radius: 6px;
        padding: 10px;
        margin-bottom: 8px;
        font-size: 12px;
        line-height: 1.4;
        color: #202124;
      ">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="
            background: ${color}20;
            color: ${color};
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 500;
          ">
            ${suggestion.discStyle} Style
          </div>
          <div style="font-size: 10px; color: #5f6368;">
            ${suggestion.tone}
          </div>
        </div>
        <div class="suggestion-content" style="margin-bottom: 8px;">
          ${suggestion.content.replace(/\n/g, '<br>')}
        </div>
        <button class="use-draft-btn" data-suggestion-index="${index}" style="
          background: #1a73e8;
          border: none;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          color: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          width: 100%;
        " onmouseover="this.style.background='#1557b0'" onmouseout="this.style.background='#1a73e8'">
          Use as Draft
        </button>
      </div>
    `;
  }).join('');
  
  container.innerHTML = suggestionsHtml;
  
  // Add event listeners for "Use as Draft" buttons
  const draftButtons = container.querySelectorAll('.use-draft-btn');
  draftButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      useSuggestionAsDraft(suggestions[index], button);
    });
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
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: 'Google Sans', Roboto, sans-serif;
    ">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a73e8" style="margin-right: 8px;">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <strong style="font-size: 15px; color: #1a73e8;">AI Email Analysis</strong>
        </div>
        <span style="
          background: #1a73e8;
          color: white;
          padding: 3px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 500;
        ">DISC Extension</span>
      </div>
      
      <div class="analysis-cards" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
        <!-- Communication Style Card -->
        <div class="analysis-card" style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          min-width: 0;
        ">
          <div style="margin-bottom: 6px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#34a853" style="margin: 0 auto;">
              <path d="M7 14l3-3 2 2 7-7 2 2-9 9-4-4z"/>
            </svg>
          </div>
          <div style="font-size: 11px; color: #5f6368; margin-bottom: 3px;">Communication Style</div>
          <div class="style-result" style="font-size: 16px; font-weight: 600; color: #202124; margin-bottom: 2px;">Analyzing...</div>
          <div class="style-description" style="font-size: 10px; color: #5f6368;">Processing...</div>
        </div>
        
        <!-- Priority Level Card -->
        <div class="analysis-card" style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          min-width: 0;
        ">
          <div style="margin-bottom: 6px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ea4335" style="margin: 0 auto;">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div style="font-size: 11px; color: #5f6368; margin-bottom: 3px;">Priority Level</div>
          <div class="priority-result" style="font-size: 16px; font-weight: 600; color: #202124; margin-bottom: 2px;">Analyzing...</div>
          <div class="priority-tags" style="margin-top: 6px;"></div>
        </div>
        
        <!-- Response Style Card -->
        <div class="analysis-card" style="
          background: #f8f9fa;
          border: 1px solid #e8eaed;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          min-width: 0;
        ">
          <div style="margin-bottom: 6px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#4285f4" style="margin: 0 auto;">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div style="font-size: 11px; color: #5f6368; margin-bottom: 3px;">Response Style</div>
          <div class="response-result" style="font-size: 12px; color: #202124; line-height: 1.3;">Analyzing...</div>
        </div>
      </div>
      
      <!-- AI-Generated Response Suggestions -->
      <div class="response-suggestion-section" style="
        background: #f8f9fa;
        border: 1px solid #e8eaed;
        border-radius: 8px;
        padding: 14px;
      ">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1a73e8" style="margin-right: 8px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <strong style="color: #1a73e8; font-size: 13px;">AI-Generated Response Suggestions</strong>
        </div>
        
        <div class="suggestions-container" style="margin-bottom: 10px;">
          <div class="suggestion-loading" style="
            background: white;
            border: 1px solid #e8eaed;
            border-radius: 6px;
            padding: 10px;
            font-size: 12px;
            line-height: 1.4;
            color: #202124;
            text-align: center;
          ">
            Analyzing email content and generating personalized responses...
          </div>
        </div>
        
        <div style="
          font-size: 10px;
          color: #5f6368;
          margin-bottom: 10px;
          font-style: italic;
        ">Calibrated to your DISC profile and sender's communication style</div>
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
        padding: 1px 6px;
        border-radius: 10px;
        font-size: 9px;
        margin: 1px;
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
  
  // Generate AI response suggestions
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
      content.includes('need') || content.includes('must') || content.includes('immediately') ||
      content.includes('budget') || content.includes('financial')) {
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
  if (content.includes('deadline') || content.includes('urgent')) tags.push('Deadline');
  if (content.includes('board') || content.includes('executive')) tags.push('Board Meeting');
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

// Generate AI-powered response suggestions using OpenAI API
async function generateAIResponseSuggestion(emailData, analysisPanel) {
  const suggestionsContainer = analysisPanel.querySelector('.suggestions-container');
  if (!suggestionsContainer) return;
  
  try {
    // Show loading state
    suggestionsContainer.innerHTML = `
      <div class="suggestion-loading" style="
        background: white;
        border: 1px solid #e8eaed;
        border-radius: 6px;
        padding: 10px;
        font-size: 12px;
        line-height: 1.4;
        color: #202124;
        text-align: center;
      ">
        Analyzing email content and generating personalized responses...
      </div>
    `;
    
    // Get user DISC profile from storage
    const userProfile = await getUserDiscProfile();
    if (!userProfile) {
      throw new Error('User DISC profile not found');
    }
    
    // Call backend API for response suggestions
    const response = await fetch('http://localhost:5000/api/responses/suggest-extension', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailContent: emailData.content,
        recipientDiscStyle: analyzeCommunicationStyle(emailData).style,
        userDiscProfile: userProfile
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate suggestions');
    }
    
    const data = await response.json();
    const suggestions = data.suggestions || [];
    
    if (suggestions.length === 0) {
      throw new Error('No suggestions generated');
    }
    
    // Display suggestions
    displayResponseSuggestions(suggestions, suggestionsContainer);
    
  } catch (error) {
    console.error('Error generating response suggestions:', error);
    suggestionsContainer.innerHTML = `
      <div style="
        background: white;
        border: 1px solid #e8eaed;
        border-radius: 6px;
        padding: 10px;
        font-size: 12px;
        line-height: 1.4;
        color: #ea4335;
        text-align: center;
      ">
        Unable to generate suggestions. Please try again.
      </div>
    `;
  }
}

// Legacy function - replaced by OpenAI API integration
function generatePersonalizedResponse(emailData, userProfile) {
  // This function is kept for compatibility but is no longer used
  // The new system uses the OpenAI API for response generation
  return "This response generation has been replaced by AI-powered suggestions.";
}

// Use a suggestion as a draft in Gmail compose area
function useSuggestionAsDraft(suggestion, button) {
  try {
    // Find Gmail compose area
    const composeArea = document.querySelector('[role="textbox"][contenteditable="true"]');
    if (!composeArea) {
      // Try alternative selectors for Gmail compose
      const alternativeCompose = document.querySelector('.Am.Al.editable') || 
                                document.querySelector('[contenteditable="true"]') ||
                                document.querySelector('.gmail_default');
      
      if (!alternativeCompose) {
        console.error('Gmail compose area not found');
        showNotification('Please open Gmail compose to use this suggestion', 'error', 3000);
        return;
      }
      
      // Use alternative compose area
      alternativeCompose.innerHTML = suggestion.content;
      alternativeCompose.focus();
    } else {
      // Use primary compose area
      composeArea.innerHTML = suggestion.content;
      composeArea.focus();
    }
    
    // Show success feedback
    const originalText = button.textContent;
    const originalBackground = button.style.background;
    
    button.textContent = 'Draft Inserted!';
    button.style.background = '#34a853';
    button.disabled = true;
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = originalBackground;
      button.disabled = false;
    }, 2000);
    
    // Show notification
    showNotification('Response inserted into Gmail compose', 'success', 2000);
    
  } catch (error) {
    console.error('Error inserting draft:', error);
    showNotification('Failed to insert draft. Please try again.', 'error', 3000);
  }
}

// Add event listeners for analysis panel buttons (legacy - no longer needed)
function addAnalysisPanelEventListeners(analysisPanel) {
  // This function is kept for compatibility but the new system uses individual button listeners
  console.log('Analysis panel event listeners added');
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

// Show notification to user
function showNotification(message, type = 'info', duration = 3000) {
  // Remove existing notification if any
  const existingNotification = document.querySelector('.disc-notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const colors = {
    success: '#34a853',
    error: '#ea4335',
    info: '#1a73e8',
    warning: '#fbbc04'
  };
  
  const notification = document.createElement('div');
  notification.className = 'disc-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border: 1px solid ${colors[type]};
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 14px;
    color: #202124;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, duration);
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