# Download Chrome Extension

## Step 1: Download Extension Files

The extension files are packaged in a ZIP file that you need to download to your computer:

**Download:** `gmail-disc-extension.zip`

## Step 2: Extract Files

1. Download the ZIP file to your computer
2. Extract it to create a folder (e.g., on your Desktop)
3. You should now have a `build` folder containing:
   - manifest.json
   - background.js
   - content.js
   - popup.html
   - popup.js
   - styles.css
   - icons/ folder

## Step 3: Install in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the extracted `build` folder from your computer
5. The extension should now load successfully

## If You Still Get "Manifest Missing" Error

Make sure you're selecting the `build` folder, not the parent folder. The folder you select should directly contain the `manifest.json` file.

## Alternative: Manual File Creation

If the ZIP download doesn't work, you can manually create the files on your computer using the content from the Replit project.