# Chrome Extension Installation Instructions

## Installation Steps

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/` in your Chrome browser
   - Or click the three dots menu → More tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `build` folder in this directory
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Gmail DISC Extension" and click the pin icon
   - The extension icon will now appear in your toolbar

## Testing the Extension

1. **Navigate to Gmail**
   - Go to `https://mail.google.com/` or `https://gmail.com/`
   - Make sure you're logged into your Gmail account

2. **Authorize Gmail Access**
   - Click the extension icon in your toolbar
   - Click "Connect Gmail" button
   - Complete the OAuth flow to grant Gmail permissions

3. **Test Features**
   - Open any email in Gmail
   - You should see:
     - AI summary box above the email content
     - Sender category badge next to the sender name
   - Click Reply on any email
   - You should see response suggestions panel

## Troubleshooting

### Extension Not Loading
- Make sure you selected the `build` folder, not the parent folder
- Check that all required files are present in the build folder
- Look for error messages in the Chrome Extensions page

### Gmail Authentication Issues
- Verify your Google Client ID is correctly configured
- Make sure the extension has the correct OAuth scopes
- Check the Chrome Developer Console for error messages

### Features Not Working
- Ensure you're connected to the internet
- Verify the backend server is running on localhost:5000
- Check that you've completed the Gmail authentication step
- Look for error messages in the extension popup

## Development and Debugging

### View Extension Logs
- Right-click the extension icon → "Inspect popup"
- Check the Console tab for popup-related logs
- Go to chrome://extensions/ and click "background page" for service worker logs

### Content Script Debugging
- Open Gmail and press F12 to open Developer Tools
- Check the Console for content script logs
- Look for network requests to your backend API

### Backend Connection
- Make sure your backend server is running on `http://localhost:5000`
- Test API endpoints directly using curl or Postman
- Check server logs for incoming requests from the extension

## File Structure

```
build/
├── manifest.json          # Extension configuration
├── background.js         # Service worker for API calls
├── content.js           # Gmail integration script
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── styles.css           # Gmail styling
└── icons/               # Extension icons
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

## Next Steps

Once installed and working:
1. Test the extension with real emails in Gmail
2. Verify DISC analysis and response suggestions
3. Customize sender categories in the web interface
4. Complete your DISC profile analysis for better suggestions

For issues or questions, check the browser console and extension logs for detailed error information.