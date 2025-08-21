import {
  users,
  senderCategories,
  emailClassifications,
  responseTemplates,
  type User,
  type UpsertUser,
  type SenderCategory,
  type InsertSenderCategory,
  type EmailClassification,
  type InsertEmailClassification,
  type ResponseTemplate,
  type InsertResponseTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Sender Categories
  getUserCategories(userId: string): Promise<SenderCategory[]>;
  createCategory(category: InsertSenderCategory): Promise<SenderCategory>;
  updateCategory(id: string, category: Partial<InsertSenderCategory>): Promise<SenderCategory>;
  deleteCategory(id: string): Promise<void>;
  
  // Email Classifications
  getEmailClassification(userId: string, emailId: string): Promise<EmailClassification | undefined>;
  createEmailClassification(classification: InsertEmailClassification): Promise<EmailClassification>;
  getUserEmailClassifications(userId: string, limit?: number): Promise<EmailClassification[]>;
  
  // Response Templates
  getResponseTemplates(userId: string, discStyle?: string): Promise<ResponseTemplate[]>;
  createResponseTemplate(template: InsertResponseTemplate): Promise<ResponseTemplate>;
  
  // DISC Profile
  updateUserDiscProfile(userId: string, discProfile: {
    primaryStyle: 'D' | 'I' | 'S' | 'C';
    scores: { D: number; I: number; S: number; C: number };
    analysis: string;
    confidence: number;
  }): Promise<User>;
  
  // Gmail Tokens
  updateGmailTokens(userId: string, accessToken: string, refreshToken?: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      // Try to insert new user with generated ID
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          id: userData.id || crypto.randomUUID()
        })
        .returning();
      return user;
    } catch (error) {
      // If user exists, update existing user
      const [user] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          gmailAccessToken: userData.gmailAccessToken,
          gmailRefreshToken: userData.gmailRefreshToken,
          discProfile: userData.discProfile,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id!))
        .returning();
      return user;
    }
  }

  // Sender Categories
  async getUserCategories(userId: string): Promise<SenderCategory[]> {
    return await db
      .select()
      .from(senderCategories)
      .where(and(eq(senderCategories.userId, userId), eq(senderCategories.isActive, true)));
  }

  async createCategory(category: InsertSenderCategory): Promise<SenderCategory> {
    const [newCategory] = await db
      .insert(senderCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertSenderCategory>): Promise<SenderCategory> {
    const [updatedCategory] = await db
      .update(senderCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(senderCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db
      .update(senderCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(senderCategories.id, id));
  }

  // Email Classifications
  async getEmailClassification(userId: string, emailId: string): Promise<EmailClassification | undefined> {
    const [classification] = await db
      .select()
      .from(emailClassifications)
      .where(and(
        eq(emailClassifications.userId, userId),
        eq(emailClassifications.emailId, emailId)
      ));
    return classification;
  }

  async createEmailClassification(classification: InsertEmailClassification): Promise<EmailClassification> {
    const [newClassification] = await db
      .insert(emailClassifications)
      .values(classification)
      .returning();
    return newClassification;
  }

  async getUserEmailClassifications(userId: string, limit = 100): Promise<EmailClassification[]> {
    return await db
      .select()
      .from(emailClassifications)
      .where(eq(emailClassifications.userId, userId))
      .limit(limit)
      .orderBy(emailClassifications.createdAt);
  }

  // Response Templates
  async getResponseTemplates(userId: string, discStyle?: string): Promise<ResponseTemplate[]> {
    const conditions = [eq(responseTemplates.userId, userId), eq(responseTemplates.isActive, true)];
    if (discStyle) {
      conditions.push(eq(responseTemplates.discStyle, discStyle as any));
    }
    
    return await db
      .select()
      .from(responseTemplates)
      .where(and(...conditions));
  }

  async createResponseTemplate(template: InsertResponseTemplate): Promise<ResponseTemplate> {
    const [newTemplate] = await db
      .insert(responseTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  // DISC Profile
  async updateUserDiscProfile(userId: string, discProfile: {
    primaryStyle: 'D' | 'I' | 'S' | 'C';
    scores: { D: number; I: number; S: number; C: number };
    analysis: string;
    confidence: number;
  }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ discProfile, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Gmail Tokens
  async updateGmailTokens(userId: string, accessToken: string, refreshToken?: string): Promise<User> {
    const updateData: any = { gmailAccessToken: accessToken, updatedAt: new Date() };
    if (refreshToken) {
      updateData.gmailRefreshToken = refreshToken;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
}

export const storage = new DatabaseStorage();
