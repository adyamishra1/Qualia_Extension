# Simple Chrome Extension - Test Installation

## This is a minimal test extension to verify Chrome can load extensions from your setup.

### Files:
- manifest.json (minimal, valid)
- background.js (simple service worker)
- content.js (shows "Extension Active" on Gmail)
- popup.html (basic popup)

### Install:
1. Download this `chrome-extension-simple` folder
2. Chrome → chrome://extensions/
3. Developer mode ON
4. Load unpacked → Select this folder
5. Go to Gmail - you should see "Extension Active" message

### If this works:
Then the issue is with the complex manifest in the main extension.

### If this fails:
Then there's a fundamental issue with your Chrome setup or download process.

Test this first, then we'll fix the main extension based on the results.