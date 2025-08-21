// Simple background service worker
console.log('Gmail DISC Extension loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});