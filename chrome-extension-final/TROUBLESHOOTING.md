# Gmail DISC Extension - Troubleshooting Guide

## Common OAuth Issues and Solutions

### Issue: "OAuth failed" or "Permission Denied"

**Possible Causes:**
1. Google Client ID not properly configured
2. OAuth consent screen not set up
3. Extension not properly installed

**Solutions:**
1. **Check Google Cloud Console:**
   - Go to Google Cloud Console
   - Navigate to "APIs & Services" > "Credentials"
   - Verify OAuth 2.0 Client ID exists: `1021208088365-ih8ilr1icfi7fripq3qmfc3q3jk990fm.apps.googleusercontent.com`
   - Check "Authorized JavaScript origins" and "Authorized redirect URIs"

2. **OAuth Consent Screen:**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Ensure app is published or you're using a test user
   - Add required scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`

3. **Extension Installation:**
   - Ensure extension is loaded in Developer Mode
   - Try removing and re-adding the extension
   - Check for manifest errors in Chrome Extensions page

### Issue: "No token received"

**Solutions:**
1. Clear extension storage:
   ```javascript
   // In browser console on extension popup:
   chrome.storage.local.clear()
   ```

2. Clear Chrome auth cache:
   - Go to chrome://settings/content/all
   - Search for "accounts.google.com"
   - Remove all stored data

3. Restart Chrome completely

### Issue: Extension popup shows errors

**Debugging Steps:**
1. Right-click extension icon → "Inspect popup"
2. Check Console tab for error messages
3. Look for network errors or permission issues

### Issue: Gmail integration not working

**Check:**
1. Extension has proper permissions in manifest.json
2. Content script is loading on Gmail pages
3. Gmail API calls are properly authenticated

## Manual Testing Steps

1. **Install Extension:**
   - Go to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked" → Select chrome-extension-final folder

2. **Test OAuth:**
   - Click extension icon
   - Click "Connect Gmail"
   - Should open Google OAuth page
   - Grant permissions
   - Should show "Connected" status

3. **Test Gmail Integration:**
   - Go to Gmail
   - Open any email
   - Should see email analysis above content

## Error Code Reference

- `OAuth2 not granted`: User denied permission
- `Invalid client`: Client ID configuration issue
- `Access blocked`: OAuth consent screen not configured
- `Network error`: Internet connectivity or API issue
- `Token invalid`: Need to re-authenticate

## Support

If issues persist:
1. Check browser console for detailed error messages
2. Verify all Google Cloud Console settings
3. Ensure extension manifest.json is valid
4. Try with a fresh Chrome profile