import OpenAI from "openai";
import { db } from "../db";
import { discCoachingRecommendations, userDiscAnalysis, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DiscCoachingAnalysis {
  primaryType: 'D' | 'I' | 'S' | 'C';
  secondaryType?: 'D' | 'I' | 'S' | 'C';
  scores: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
  communicationStyle: string;
  strengths: string[];
  improvementAreas: string[];
  emailPatterns: {
    responseTime: string;
    emailLength: string;
    formalityLevel: string;
    directnessLevel: string;
  };
  recommendations: {
    type: string;
    title: string;
    description: string;
    steps: string[];
    priority: 'high' | 'medium' | 'low';
  }[];
}

export class DiscCoachingService {
  async analyzeUserCommunicationStyle(userId: string, emailSamples: string[]): Promise<DiscCoachingAnalysis> {
    const prompt = `
    Analyze the following email samples and provide a comprehensive DISC personality assessment:

    Email Samples:
    ${emailSamples.join('\n\n---\n\n')}

    Please analyze these emails and respond with JSON in this exact format:
    {
      "primaryType": "D|I|S|C",
      "secondaryType": "D|I|S|C or null",
      "scores": {
        "D": number (0-100),
        "I": number (0-100), 
        "S": number (0-100),
        "C": number (0-100)
      },
      "communicationStyle": "brief description of overall style",
      "strengths": ["strength1", "strength2", "strength3"],
      "improvementAreas": ["area1", "area2", "area3"],
      "emailPatterns": {
        "responseTime": "fast/moderate/slow",
        "emailLength": "brief/moderate/detailed",
        "formalityLevel": "formal/semi-formal/casual",
        "directnessLevel": "direct/moderate/indirect"
      },
      "recommendations": [
        {
          "type": "communication|email_style|time_management|conflict_resolution",
          "title": "recommendation title",
          "description": "detailed description",
          "steps": ["step1", "step2", "step3"],
          "priority": "high|medium|low"
        }
      ]
    }

    DISC Types:
    - D (Dominant): Direct, results-focused, decisive, problem-solver
    - I (Influential): Enthusiastic, optimistic, people-focused, persuasive
    - S (Steady): Patient, loyal, good listener, team player
    - C (Conscientious): Accurate, analytical, systematic, high standards
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a certified DISC assessment expert. Analyze communication patterns and provide actionable coaching recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content!);
      
      // Store the analysis in the database
      await this.storeDiscAnalysis(userId, analysis);
      await this.storeCoachingRecommendations(userId, analysis.recommendations);
      
      return analysis;
    } catch (error) {
      console.error('DISC analysis failed:', error);
      throw new Error('Failed to analyze communication style');
    }
  }

  private async storeDiscAnalysis(userId: string, analysis: DiscCoachingAnalysis) {
    await db.insert(userDiscAnalysis).values({
      userId,
      dominantScore: analysis.scores.D,
      influentialScore: analysis.scores.I,
      steadyScore: analysis.scores.S,
      conscientiousScore: analysis.scores.C,
      primaryType: analysis.primaryType,
      secondaryType: analysis.secondaryType || null,
      communicationStyle: analysis.communicationStyle,
      strengthsAnalysis: analysis.strengths,
      improvementAreas: analysis.improvementAreas,
      emailPatterns: analysis.emailPatterns,
    }).onConflictDoUpdate({
      target: userDiscAnalysis.userId,
      set: {
        dominantScore: analysis.scores.D,
        influentialScore: analysis.scores.I,
        steadyScore: analysis.scores.S,
        conscientiousScore: analysis.scores.C,
        primaryType: analysis.primaryType,
        secondaryType: analysis.secondaryType || null,
        communicationStyle: analysis.communicationStyle,
        strengthsAnalysis: analysis.strengths,
        improvementAreas: analysis.improvementAreas,
        emailPatterns: analysis.emailPatterns,
        updatedAt: new Date(),
      }
    });
  }

  private async storeCoachingRecommendations(userId: string, recommendations: any[]) {
    // Clear existing recommendations
    await db.delete(discCoachingRecommendations).where(eq(discCoachingRecommendations.userId, userId));
    
    // Insert new recommendations
    for (const rec of recommendations) {
      await db.insert(discCoachingRecommendations).values({
        userId,
        discType: rec.type.includes('D') ? 'dominant' : 
                  rec.type.includes('I') ? 'influential' :
                  rec.type.includes('S') ? 'steady' : 'conscientious',
        recommendationType: rec.type,
        title: rec.title,
        description: rec.description,
        actionableSteps: rec.steps,
        priority: rec.priority,
      });
    }
  }

  async getCoachingRecommendations(userId: string) {
    return await db.select().from(discCoachingRecommendations)
      .where(eq(discCoachingRecommendations.userId, userId));
  }

  async getUserDiscAnalysis(userId: string) {
    const [analysis] = await db.select().from(userDiscAnalysis)
      .where(eq(userDiscAnalysis.userId, userId));
    return analysis;
  }

  async markRecommendationCompleted(recommendationId: string) {
    await db.update(discCoachingRecommendations)
      .set({ isCompleted: true, updatedAt: new Date() })
      .where(eq(discCoachingRecommendations.id, recommendationId));
  }

  async generatePersonalizedEmailResponse(userDiscType: string, emailContext: string, recipientStyle?: string): Promise<string> {
    const prompt = `
    Generate a personalized email response based on DISC communication styles:
    
    Sender DISC Type: ${userDiscType}
    ${recipientStyle ? `Recipient DISC Type: ${recipientStyle}` : ''}
    Email Context: ${emailContext}
    
    Create a response that:
    1. Matches the sender's natural communication style
    2. ${recipientStyle ? `Adapts to the recipient's preferred style` : 'Uses professional tone'}
    3. Is concise but complete
    4. Maintains appropriate business tone
    
    Provide just the email response text, no additional formatting.
    `;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in DISC-based communication. Generate professional email responses that match personality styles."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.choices[0].message.content!.trim();
    } catch (error) {
      console.error('Email response generation failed:', error);
      throw new Error('Failed to generate personalized response');
    }
  }
}

export const discCoachingService = new DiscCoachingService();