import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface DISCProfile {
  primaryStyle: 'D' | 'I' | 'S' | 'C';
  scores: { D: number; I: number; S: number; C: number };
  analysis: string;
  confidence: number;
}

export interface EmailAnalysis {
  summary: string;
  discStyle?: 'D' | 'I' | 'S' | 'C';
  priority: 'low' | 'medium' | 'high';
  confidence: number;
  isPersonalEmail: boolean;
}

export interface ResponseSuggestion {
  content: string;
  discStyle: 'D' | 'I' | 'S' | 'C';
  tone: string;
  confidence: number;
}

export async function analyzeDISCProfile(emailSamples: string[]): Promise<DISCProfile> {
  try {
    const prompt = `Analyze the communication style of these email samples and determine the sender's DISC personality profile. DISC styles are:

D (Dominance): Direct, decisive, results-focused, prefers brief communication
I (Influence): Enthusiastic, optimistic, people-oriented, uses warm language
S (Steadiness): Patient, reliable, supportive, collaborative tone
C (Conscientiousness): Analytical, accurate, detail-oriented, formal

Email samples:
${emailSamples.join('\n\n---\n\n')}

Respond with JSON in this exact format:
{
  "primaryStyle": "D|I|S|C",
  "scores": {
    "D": number (0-100),
    "I": number (0-100),
    "S": number (0-100),
    "C": number (0-100)
  },
  "analysis": "detailed explanation of the communication patterns observed",
  "confidence": number (0-100)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a DISC personality analysis expert. Analyze communication patterns and provide accurate personality assessments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      primaryStyle: result.primaryStyle,
      scores: result.scores,
      analysis: result.analysis,
      confidence: Math.max(0, Math.min(100, result.confidence))
    };
  } catch (error) {
    throw new Error("Failed to analyze DISC profile: " + (error as Error).message);
  }
}

export async function analyzeEmail(emailContent: string, senderEmail: string): Promise<EmailAnalysis> {
  try {
    const prompt = `Analyze this email content and provide:
1. A concise summary (2-3 sentences)
2. The sender's DISC communication style if it's a personal email (not newsletters, notifications, automated emails)
3. Priority level based on urgency and importance
4. Whether this appears to be a personal email vs automated/marketing

Email from: ${senderEmail}
Content: ${emailContent}

Respond with JSON in this exact format:
{
  "summary": "concise summary of the email",
  "discStyle": "D|I|S|C or null if not personal email",
  "priority": "low|medium|high",
  "confidence": number (0-100),
  "isPersonalEmail": boolean
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an email analysis expert. Classify emails accurately and identify communication styles."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      summary: result.summary,
      discStyle: result.discStyle,
      priority: result.priority,
      confidence: Math.max(0, Math.min(100, result.confidence)),
      isPersonalEmail: result.isPersonalEmail
    };
  } catch (error) {
    throw new Error("Failed to analyze email: " + (error as Error).message);
  }
}

export async function generateResponseSuggestions(
  emailContent: string,
  userDiscProfile: DISCProfile,
  recipientDiscStyle?: string
): Promise<ResponseSuggestion[]> {
  try {
    const prompt = `Generate 2 personalized email response suggestions based on:

User's DISC Profile: ${userDiscProfile.primaryStyle} (${userDiscProfile.analysis})
Recipient's DISC Style: ${recipientDiscStyle || 'Unknown'}
Original Email: ${emailContent}

DISC Response Guidelines:
- D: Brief, direct, results-focused, bullet points
- I: Warm, enthusiastic, personal connection, positive language
- S: Patient, supportive, collaborative, reassuring
- C: Detailed, accurate, formal, well-structured

Generate one response in the user's natural style and one slightly adapted toward the recipient's style if known.

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "content": "full email response text",
      "discStyle": "D|I|S|C",
      "tone": "description of tone used",
      "confidence": number (0-100)
    },
    {
      "content": "full email response text",
      "discStyle": "D|I|S|C", 
      "tone": "description of tone used",
      "confidence": number (0-100)
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert email communication coach specializing in DISC personality-based responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return result.suggestions.map((suggestion: any) => ({
      content: suggestion.content,
      discStyle: suggestion.discStyle,
      tone: suggestion.tone,
      confidence: Math.max(0, Math.min(100, suggestion.confidence))
    }));
  } catch (error) {
    throw new Error("Failed to generate response suggestions: " + (error as Error).message);
  }
}

export async function categorizeEmailSender(
  senderEmail: string,
  emailContent: string,
  categories: string[]
): Promise<{ category: string; confidence: number }> {
  try {
    const prompt = `Categorize this email sender based on the email content and available categories:

Sender: ${senderEmail}
Email Content: ${emailContent}
Available Categories: ${categories.join(', ')}

Analyze the sender's role/relationship and choose the most appropriate category.

Respond with JSON in this exact format:
{
  "category": "exact category name from the list",
  "confidence": number (0-100)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an email categorization expert. Classify email senders accurately based on context and content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      category: result.category,
      confidence: Math.max(0, Math.min(100, result.confidence))
    };
  } catch (error) {
    throw new Error("Failed to categorize email sender: " + (error as Error).message);
  }
}
