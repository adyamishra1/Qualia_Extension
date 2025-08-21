import { google } from 'googleapis';
import { storage } from '../storage';

const gmail = google.gmail('v1');

export interface GmailEmail {
  id: string;
  subject: string;
  from: string;
  body: string;
  snippet: string;
  date: Date;
  labels: string[];
}

export class GmailService {
  private async getAuthClient(userId: string) {
    const user = await storage.getUser(userId);
    if (!user?.gmailAccessToken) {
      throw new Error('No Gmail access token found for user');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob' // For Chrome extensions
    );

    oauth2Client.setCredentials({
      access_token: user.gmailAccessToken,
      refresh_token: user.gmailRefreshToken,
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await storage.updateGmailTokens(
          userId,
          tokens.access_token,
          tokens.refresh_token || user.gmailRefreshToken
        );
      }
    });

    return oauth2Client;
  }

  async getEmails(userId: string, query?: string, maxResults = 50): Promise<GmailEmail[]> {
    try {
      const auth = await this.getAuthClient(userId);
      
      const response = await gmail.users.messages.list({
        auth,
        userId: 'me',
        q: query,
        maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      const emails: GmailEmail[] = [];
      
      for (const message of response.data.messages) {
        if (message.id) {
          const emailData = await this.getEmailById(userId, message.id);
          if (emailData) {
            emails.push(emailData);
          }
        }
      }

      return emails;
    } catch (error) {
      throw new Error(`Failed to fetch emails: ${(error as Error).message}`);
    }
  }

  async getEmailById(userId: string, emailId: string): Promise<GmailEmail | null> {
    try {
      const auth = await this.getAuthClient(userId);
      
      const response = await gmail.users.messages.get({
        auth,
        userId: 'me',
        id: emailId,
        format: 'full',
      });

      const message = response.data;
      if (!message.payload) {
        return null;
      }

      const headers = message.payload.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';

      let body = '';
      if (message.payload.body?.data) {
        body = Buffer.from(message.payload.body.data, 'base64').toString();
      } else if (message.payload.parts) {
        // Handle multipart messages
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            break;
          }
        }
      }

      return {
        id: emailId,
        subject,
        from,
        body,
        snippet: message.snippet || '',
        date: new Date(date),
        labels: message.labelIds || [],
      };
    } catch (error) {
      console.error(`Failed to fetch email ${emailId}:`, error);
      return null;
    }
  }

  async sendEmail(userId: string, to: string, subject: string, body: string, replyToId?: string): Promise<string> {
    try {
      const auth = await this.getAuthClient(userId);
      
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body
      ].join('\n');

      const encodedEmail = Buffer.from(email).toString('base64url');

      const response = await gmail.users.messages.send({
        auth,
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId: replyToId,
        },
      });

      return response.data.id || '';
    } catch (error) {
      throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    try {
      const auth = await this.getAuthClient(userId);
      
      const response = await gmail.users.getProfile({
        auth,
        userId: 'me',
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user profile: ${(error as Error).message}`);
    }
  }
}

export const gmailService = new GmailService();
