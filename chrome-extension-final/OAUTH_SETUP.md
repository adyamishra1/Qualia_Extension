# OAuth Setup Guide for Gmail DISC Extension

## Google Cloud Console Configuration

### 1. Create/Verify OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Verify OAuth 2.0 Client ID exists: `1021208088365-ih8ilr1icfi7fripq3qmfc3q3jk990fm.apps.googleusercontent.com`

### 2. Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Set **User Type**: External (for testing) or Internal (for organization)
3. Fill required fields:
   - **App name**: Gmail DISC Extension
   - **User support email**: Your email
   - **Developer contact information**: Your email

### 3. Add Required Scopes

Add these scopes in the OAuth consent screen:
- `openid`
- `email` 
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.modify`

### 4. Enable Gmail API

1. Go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Enable the Gmail API

### 5. Configure Authorized Origins (if using web OAuth)

In OAuth 2.0 Client ID settings:
- **Authorized JavaScript origins**: `http://localhost:5000`
- **Authorized redirect URIs**: `http://localhost:5000/api/gmail/callback`

## Extension Installation Steps

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `chrome-extension-final` folder
5. Extension should appear with Gmail DISC Extension icon

### 2. Test OAuth Flow

1. Click the extension icon in Chrome toolbar
2. Click **Connect Gmail** button
3. Google OAuth page should open
4. Grant permissions for Gmail access
5. Should see "Connected" status in popup

## Troubleshooting Common Issues

### Issue: "OAuth2 not granted" or "Access blocked"

**Cause**: OAuth consent screen not properly configured or app not published

**Solution**:
1. Check OAuth consent screen is saved and published
2. Add your Google account as a test user if using External user type
3. Ensure all required scopes are added

### Issue: "Invalid client" error

**Cause**: Client ID mismatch or not properly configured

**Solution**:
1. Verify client ID in manifest.json matches Google Cloud Console
2. Check OAuth client type is set to "Chrome Extension" or "Web application"
3. Ensure Gmail API is enabled

### Issue: Extension popup shows errors

**Debugging**:
1. Right-click extension icon → **Inspect popup**
2. Check Console tab for detailed error messages
3. Look for OAuth-specific errors

### Issue: "Token verification failed"

**Cause**: Token doesn't have sufficient permissions

**Solution**:
1. Clear extension storage: Right-click extension → Options → Clear data
2. Remove extension and reinstall
3. Try OAuth flow again with fresh permissions

## Extension Permissions Explained

**Required Permissions**:
- `activeTab`: Access current Gmail tab
- `storage`: Store OAuth tokens and user preferences
- `identity`: Use Chrome's OAuth flow
- `identity.email`: Access user email address

**Host Permissions**:
- `https://mail.google.com/*`: Gmail access
- `https://gmail.com/*`: Gmail access
- `http://localhost:5000/*`: Backend communication (optional)

## Testing the Extension

### 1. Verify Connection
- Extension popup shows "Connected" status
- User email displayed in status

### 2. Test Gmail Integration
- Go to Gmail
- Open any email
- Should see AI analysis summary above email content

### 3. Test Extension Features
- Email categorization working
- Response suggestions appearing
- DISC analysis functioning

## Production Deployment

For production deployment:
1. Publish OAuth consent screen
2. Add production domain to authorized origins
3. Submit extension to Chrome Web Store
4. Update client ID if needed for production

## Support

If OAuth still fails after following this guide:
1. Check browser console for specific error messages
2. Verify all Google Cloud Console settings
3. Try with a fresh Chrome profile
4. Contact support with specific error messages