// Simple content script
console.log('Gmail DISC Extension content script loaded');

// Add a simple indicator to Gmail
if (window.location.hostname.includes('mail.google.com')) {
  const indicator = document.createElement('div');
  indicator.innerHTML = '✓ Gmail DISC Extension Active';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #4CAF50;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10000;
    font-family: Arial, sans-serif;
  `;
  
  setTimeout(() => {
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
      indicator.remove();
    }, 3000);
  }, 1000);
}