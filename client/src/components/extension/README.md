# Gmail DISC Extension

This Chrome extension provides AI-powered email categorization and personalized response suggestions based on DISC communication styles.

## Features

- **Email Analysis**: Automatically analyzes incoming emails for priority and communication style
- **Sender Categorization**: Creates custom categories for email senders (e.g., "parents", "students", "staff")
- **DISC Profiling**: Analyzes your communication style from sent emails
- **Response Suggestions**: Generates personalized response suggestions based on your DISC profile
- **Gmail Integration**: Seamlessly integrates with Gmail interface

## Installation

### Prerequisites
1. Google OAuth credentials for Chrome extension
2. Running backend server with Gmail API integration

### Setup Steps
1. **Get Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API
   - Create OAuth client ID for "Chrome extension"
   - Copy the Client ID

2. **Configure Extension**:
   - Update `manifest.json` with your Google Client ID
   - Ensure backend server is running on `localhost:5000`

3. **Build Extension**:
   ```bash
   node build.js
   ```

4. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build` folder

## File Structure

```
extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker for background tasks
├── content.js         # Content script injected into Gmail
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
├── styles.css         # Gmail integration styles
├── oauth.ts           # OAuth flow handling
├── build.js           # Build script
└── icons/             # Extension icons
```

## How It Works

1. **Authentication**: Extension authenticates with Gmail using OAuth2
2. **Email Monitoring**: Content script monitors Gmail for new emails
3. **AI Analysis**: Background script sends emails to backend for AI analysis
4. **UI Integration**: Results are displayed directly in Gmail interface
5. **Response Generation**: AI generates personalized responses based on user's DISC profile

## API Endpoints

The extension communicates with these backend endpoints:

- `POST /api/gmail/callback` - Save Gmail access tokens
- `POST /api/emails/analyze` - Analyze email content
- `POST /api/disc/analyze` - Analyze user's DISC profile
- `POST /api/responses/suggest` - Generate response suggestions
- `GET /api/categories` - Get user's sender categories

## Development

### Testing
1. Load extension in Chrome
2. Navigate to Gmail
3. Check console for extension logs
4. Test authentication flow
5. Verify email analysis features

### Debugging
- Check Chrome extension console in `chrome://extensions/`
- Monitor network requests in DevTools
- Review background script logs
- Test OAuth flow manually

## Permissions

The extension requires these permissions:
- `activeTab` - Access current Gmail tab
- `storage` - Store extension data
- `identity` - OAuth authentication
- `https://mail.google.com/*` - Gmail access
- `https://www.googleapis.com/*` - Google APIs

## Security

- OAuth tokens are securely stored and transmitted
- All API communication uses HTTPS
- No sensitive data is logged or stored locally
- Extension follows Chrome security best practices