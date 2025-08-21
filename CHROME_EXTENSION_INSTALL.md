# Chrome Extension Installation Guide

## The Problem
Chrome says "Manifest file is missing" because you need to select the correct folder.

## Solution: Download from Replit

### Step 1: Download the Extension Folder
1. In your Replit Files panel (left sidebar), find the `chrome-extension` folder
2. Right-click on the `chrome-extension` folder 
3. Select "Download" to download the entire folder as a ZIP file
4. Extract the ZIP file on your computer (e.g., to Desktop)

### Step 2: Install in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" 
4. Navigate to and select the extracted `chrome-extension` folder
   - Make sure you select the folder that contains `manifest.json` directly
   - NOT a parent folder or subfolder

### Step 3: Verify Installation
- The extension should appear as "Gmail DISC Extension"
- Pin it to your toolbar by clicking the puzzle piece icon
- Click on the extension icon to open the popup

## If Still Getting "Manifest Missing" Error

### Check These:
1. **Correct Folder**: Make sure the folder you select contains these files:
   - manifest.json (must be directly in the folder)
   - background.js
   - content.js
   - popup.html
   - popup.js
   - styles.css
   - icons/ folder

2. **File Permissions**: Make sure the files aren't corrupted during download

3. **Chrome Version**: Ensure you're using Chrome 88+ for Manifest V3 support

### Alternative: Manual Creation
If download doesn't work, create a new folder on your Desktop called `gmail-disc-extension` and copy each file content manually from the Replit project.

## Your Extension Details
- **Name**: Gmail DISC Extension  
- **Google Client ID**: Already configured
- **Backend URL**: http://localhost:5000
- **Permissions**: Gmail read/write access

Once installed, go to Gmail and the extension will automatically start analyzing emails!