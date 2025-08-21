import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSenderCategorySchema, insertEmailClassificationSchema } from "@shared/schema";
import { analyzeDISCProfile, analyzeEmail, generateResponseSuggestions, categorizeEmailSender } from "./services/openai";
import { gmailService } from "./services/gmail";
import { google } from 'googleapis';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Simple Gmail auth redirect for extension
  app.get('/api/gmail/auth', (req, res) => {
    // Redirect to onboarding page instead of direct OAuth
    res.json({ 
      authUrl: `${req.protocol}://${req.hostname}/onboarding`,
      message: "Use web interface for Gmail setup"
    });
  });

  app.get('/api/gmail/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      const userId = state as string;

      if (!code || !userId) {
        return res.status(400).json({ message: 'Missing code or user ID' });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${req.protocol}://${req.hostname}/api/gmail/callback`
      );

      const { tokens } = await oauth2Client.getToken(code as string);
      
      await storage.updateGmailTokens(
        userId,
        tokens.access_token!,
        tokens.refresh_token || undefined
      );

      res.redirect('/onboarding?step=categories');
    } catch (error) {
      console.error('Gmail OAuth error:', error);
      res.status(500).json({ message: 'Failed to complete Gmail authentication' });
    }
  });

  // Extension API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/api/ai-status", (req, res) => {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    res.json({ 
      available: hasOpenAI,
      status: hasOpenAI ? "connected" : "missing_api_key"
    });
  });

  app.post("/api/gmail-token", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token required" });
      }
      
      // Store token for this session or user
      // For now, just acknowledge receipt
      res.json({ message: "Token received", success: true });
    } catch (error) {
      console.error("Gmail token error:", error);
      res.status(500).json({ message: "Failed to process token" });
    }
  });

  app.get("/api/disc-profile", (req, res) => {
    // Return demo DISC profile for now
    res.json({
      dominant: 75,
      influential: 60,
      steady: 45,
      conscientious: 80
    });
  });

  app.get("/api/stats", (req, res) => {
    // Return demo stats
    res.json({
      emailsAnalyzed: 47,
      suggestionsUsed: 23,
      categoriesCreated: 8
    });
  });

  app.get("/api/gmail-status", (req, res) => {
    // Check if Gmail is connected (simplified for demo)
    // In production, this would check database for user's Gmail tokens
    res.json({
      connected: false,
      token: null,
      message: "Complete setup in web interface"
    });
  });

  app.post("/api/analyze-email", async (req, res) => {
    try {
      const { emailData } = req.body;
      
      // For now, return mock analysis
      // In production, this would use OpenAI
      const analysis = {
        summary: "This is a demo analysis of your email content.",
        category: "Business",
        priority: "Medium",
        discStyle: "Direct",
        suggestedAction: "Reply within 24 hours"
      };
      
      res.json(analysis);
    } catch (error) {
      console.error("Email analysis error:", error);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // DISC Coaching Routes
  app.post('/api/disc/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailSamples } = req.body;

      if (!emailSamples || !Array.isArray(emailSamples) || emailSamples.length === 0) {
        return res.status(400).json({ message: 'Email samples are required' });
      }

      const { discCoachingService } = await import('./services/discCoachingService');
      const analysis = await discCoachingService.analyzeUserCommunicationStyle(userId, emailSamples);

      res.json(analysis);
    } catch (error) {
      console.error('DISC analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze communication style' });
    }
  });

  app.get('/api/disc/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { discCoachingService } = await import('./services/discCoachingService');
      
      const recommendations = await discCoachingService.getCoachingRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ message: 'Failed to fetch recommendations' });
    }
  });

  app.get('/api/disc/analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { discCoachingService } = await import('./services/discCoachingService');
      
      const analysis = await discCoachingService.getUserDiscAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error('Error fetching DISC analysis:', error);
      res.status(500).json({ message: 'Failed to fetch DISC analysis' });
    }
  });

  app.post('/api/disc/recommendations/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const recommendationId = req.params.id;
      const { discCoachingService } = await import('./services/discCoachingService');
      
      await discCoachingService.markRecommendationCompleted(recommendationId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error completing recommendation:', error);
      res.status(500).json({ message: 'Failed to complete recommendation' });
    }
  });

  app.post('/api/disc/generate-response', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailContext, recipientStyle } = req.body;

      if (!emailContext) {
        return res.status(400).json({ message: 'Email context is required' });
      }

      const { discCoachingService } = await import('./services/discCoachingService');
      
      // Get user's DISC analysis first
      const userAnalysis = await discCoachingService.getUserDiscAnalysis(userId);
      if (!userAnalysis) {
        return res.status(400).json({ message: 'DISC analysis required. Please complete your profile first.' });
      }

      const response = await discCoachingService.generatePersonalizedEmailResponse(
        userAnalysis.primaryType,
        emailContext,
        recipientStyle
      );

      res.json({ response });
    } catch (error) {
      console.error('Error generating response:', error);
      res.status(500).json({ message: 'Failed to generate response' });
    }
  });

  app.post("/api/response-suggestions", async (req, res) => {
    try {
      const { emailData } = req.body;
      
      // Return demo response suggestions
      const suggestions = [
        {
          style: "Direct",
          text: "Thank you for your email. I'll review this and get back to you shortly."
        },
        {
          style: "Friendly", 
          text: "Hi! Thanks for reaching out. This looks interesting - let me take a closer look and I'll respond soon."
        },
        {
          style: "Professional",
          text: "Thank you for your correspondence. I will examine your request and provide a comprehensive response within the next business day."
        }
      ];
      
      res.json(suggestions);
    } catch (error) {
      console.error("Response suggestions error:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Sender Categories API
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getUserCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = insertSenderCategorySchema.parse({
        ...req.body,
        userId
      });
      
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ message: 'Failed to create category' });
    }
  });

  app.put('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const categoryData = insertSenderCategorySchema.partial().parse(req.body);
      
      const category = await storage.updateCategory(id, categoryData);
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ message: 'Failed to update category' });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ message: 'Failed to delete category' });
    }
  });

  // Email Analysis API
  app.post('/api/emails/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailId, content, senderEmail } = req.body;

      // Check if already analyzed
      const existing = await storage.getEmailClassification(userId, emailId);
      if (existing) {
        return res.json(existing);
      }

      // Analyze email with OpenAI
      const analysis = await analyzeEmail(content, senderEmail);
      
      // Get user categories for sender categorization
      const categories = await storage.getUserCategories(userId);
      const categoryNames = categories.map(c => c.name);
      
      let categoryId = null;
      if (analysis.isPersonalEmail && categoryNames.length > 0) {
        const categorization = await categorizeEmailSender(senderEmail, content, categoryNames);
        const matchedCategory = categories.find(c => c.name === categorization.category);
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }
      }

      // Save classification
      const classification = await storage.createEmailClassification({
        userId,
        emailId,
        senderEmail,
        categoryId,
        discStyle: analysis.discStyle,
        summary: analysis.summary,
        priority: analysis.priority,
        confidence: analysis.confidence,
      });

      res.json(classification);
    } catch (error) {
      console.error('Error analyzing email:', error);
      res.status(500).json({ message: 'Failed to analyze email' });
    }
  });

  // DISC Profile Analysis
  app.post('/api/disc/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user's sent emails for analysis
      const emails = await gmailService.getEmails(userId, 'in:sent', 20);
      const emailContents = emails.map(email => email.body).filter(body => body.length > 100);
      
      if (emailContents.length < 5) {
        return res.status(400).json({ message: 'Not enough email data for DISC analysis' });
      }

      const discProfile = await analyzeDISCProfile(emailContents);
      
      await storage.updateUserDiscProfile(userId, discProfile);
      
      res.json(discProfile);
    } catch (error) {
      console.error('Error analyzing DISC profile:', error);
      res.status(500).json({ message: 'Failed to analyze DISC profile' });
    }
  });

  // Response Suggestions (authenticated)
  app.post('/api/responses/suggest', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { emailContent, recipientDiscStyle } = req.body;

      const user = await storage.getUser(userId);
      if (!user?.discProfile) {
        return res.status(400).json({ message: 'User DISC profile not found' });
      }

      const suggestions = await generateResponseSuggestions(
        emailContent,
        user.discProfile,
        recipientDiscStyle
      );

      res.json({ suggestions });
    } catch (error) {
      console.error('Error generating response suggestions:', error);
      res.status(500).json({ message: 'Failed to generate response suggestions' });
    }
  });

  // Response Suggestions for Extension (no auth required)
  app.post('/api/responses/suggest-extension', async (req: any, res) => {
    try {
      const { emailContent, recipientDiscStyle, userDiscProfile } = req.body;

      if (!emailContent) {
        return res.status(400).json({ message: 'Email content is required' });
      }

      // Use provided DISC profile or default
      const discProfile = userDiscProfile || {
        primaryStyle: 'S',
        scores: { D: 25, I: 25, S: 25, C: 25 },
        analysis: 'Balanced communication style'
      };

      const suggestions = await generateResponseSuggestions(
        emailContent,
        discProfile,
        recipientDiscStyle
      );

      res.json({ suggestions });
    } catch (error) {
      console.error('Error generating response suggestions for extension:', error);
      res.status(500).json({ message: 'Failed to generate response suggestions' });
    }
  });

  // Gmail Integration
  app.get('/api/gmail/emails', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { query, maxResults } = req.query;
      
      const emails = await gmailService.getEmails(
        userId, 
        query as string, 
        parseInt(maxResults as string) || 50
      );
      
      res.json(emails);
    } catch (error) {
      console.error('Error fetching Gmail emails:', error);
      res.status(500).json({ message: 'Failed to fetch emails' });
    }
  });

  app.get('/api/gmail/emails/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const email = await gmailService.getEmailById(userId, id);
      
      if (!email) {
        return res.status(404).json({ message: 'Email not found' });
      }
      
      res.json(email);
    } catch (error) {
      console.error('Error fetching Gmail email:', error);
      res.status(500).json({ message: 'Failed to fetch email' });
    }
  });

  app.post('/api/gmail/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { to, subject, body, replyToId } = req.body;
      
      const messageId = await gmailService.sendEmail(userId, to, subject, body, replyToId);
      
      res.json({ messageId });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ message: 'Failed to send email' });
    }
  });

  // Gmail OAuth callback for handling tokens from Chrome extension
  app.post('/api/gmail/callback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { access_token, refresh_token } = req.body;
      
      if (!access_token) {
        return res.status(400).json({ message: 'Access token is required' });
      }
      
      await storage.updateGmailTokens(userId, access_token, refresh_token);
      
      res.json({ success: true, message: 'Gmail tokens saved successfully' });
    } catch (error) {
      console.error('Error saving Gmail tokens:', error);
      res.status(500).json({ message: 'Failed to save Gmail tokens' });
    }
  });

  // Serve onboarding page without authentication
  app.get('/onboarding', (req, res) => {
    res.redirect('/#/onboarding');
  });

  const httpServer = createServer(app);
  return httpServer;
}
