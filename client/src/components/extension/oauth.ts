// Chrome Extension OAuth flow for Gmail API
/// <reference types="chrome"/>

export class ChromeGmailOAuth {
  private static readonly GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
  ];

  static async authenticateWithGmail(): Promise<{ access_token: string; refresh_token?: string }> {
    return new Promise((resolve, reject) => {
      // For Chrome extensions, we use chrome.identity API
      if (chrome.identity && chrome.identity.getAuthToken) {
        chrome.identity.getAuthToken({ 
          interactive: true,
          scopes: this.GMAIL_SCOPES 
        }, (token) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (token) {
            resolve({ access_token: token });
          } else {
            reject(new Error('No token received'));
          }
        });
      } else {
        // Fallback for web-based OAuth flow
        const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This will be set when user provides credentials
        const redirectUri = chrome.identity.getRedirectURL();
        const scopes = this.GMAIL_SCOPES.join(' ');
        
        const authUrl = `https://accounts.google.com/oauth/authorize?` +
          `client_id=${clientId}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `access_type=offline`;

        chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true
        }, (responseUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (responseUrl) {
            const url = new URL(responseUrl);
            const code = url.searchParams.get('code');
            
            if (code) {
              // Exchange code for tokens (would need backend endpoint)
              this.exchangeCodeForTokens(code)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error('No authorization code received'));
            }
          } else {
            reject(new Error('No response URL received'));
          }
        });
      }
    });
  }

  private static async exchangeCodeForTokens(code: string): Promise<{ access_token: string; refresh_token?: string }> {
    // This would call your backend to exchange the code for tokens
    const response = await fetch('/api/gmail/exchange-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    return response.json();
  }

  static async saveTokensToBackend(tokens: { access_token: string; refresh_token?: string }): Promise<void> {
    const response = await fetch('/api/gmail/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(tokens)
    });

    if (!response.ok) {
      throw new Error('Failed to save tokens to backend');
    }
  }
}