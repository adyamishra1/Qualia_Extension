import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  gmailAccessToken: text("gmail_access_token"),
  gmailRefreshToken: text("gmail_refresh_token"),
  discProfile: jsonb("disc_profile").$type<{
    primaryStyle: 'D' | 'I' | 'S' | 'C';
    scores: { D: number; I: number; S: number; C: number };
    analysis: string;
    confidence: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const senderCategories = pgTable("sender_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  color: varchar("color").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailClassifications = pgTable("email_classifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  emailId: varchar("email_id").notNull(), // Gmail message ID
  senderEmail: varchar("sender_email").notNull(),
  categoryId: varchar("category_id").references(() => senderCategories.id, { onDelete: 'set null' }),
  discStyle: varchar("disc_style", { enum: ['D', 'I', 'S', 'C'] }),
  summary: text("summary"),
  priority: varchar("priority", { enum: ['low', 'medium', 'high'] }),
  confidence: integer("confidence"), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const responseTemplates = pgTable("response_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  discStyle: varchar("disc_style", { enum: ['D', 'I', 'S', 'C'] }).notNull(),
  template: text("template").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSenderCategorySchema = createInsertSchema(senderCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailClassificationSchema = createInsertSchema(emailClassifications).omit({
  id: true,
  createdAt: true,
});

export const insertResponseTemplateSchema = createInsertSchema(responseTemplates).omit({
  id: true,
  createdAt: true,
});

// Types
// DISC Coaching Recommendations
export const discCoachingRecommendations = pgTable("disc_coaching_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  discType: varchar("disc_type").notNull(), // "dominant", "influential", "steady", "conscientious"
  recommendationType: varchar("recommendation_type").notNull(), // "communication", "email_style", "time_management", "conflict_resolution"
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  actionableSteps: jsonb("actionable_steps").notNull().$type<string[]>(),
  priority: varchar("priority").notNull().default("medium"), // "high", "medium", "low"
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User DISC Analysis Results
export const userDiscAnalysis = pgTable("user_disc_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dominantScore: integer("dominant_score").notNull(),
  influentialScore: integer("influential_score").notNull(),
  steadyScore: integer("steady_score").notNull(),
  conscientiousScore: integer("conscientious_score").notNull(),
  primaryType: varchar("primary_type").notNull(),
  secondaryType: varchar("secondary_type"),
  communicationStyle: varchar("communication_style").notNull(),
  strengthsAnalysis: jsonb("strengths_analysis").notNull().$type<string[]>(),
  improvementAreas: jsonb("improvement_areas").notNull().$type<string[]>(),
  emailPatterns: jsonb("email_patterns").notNull().$type<{
    responseTime: string;
    emailLength: string;
    formalityLevel: string;
    directnessLevel: string;
  }>(),
  analysisDate: timestamp("analysis_date").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDiscCoachingRecommendationSchema = createInsertSchema(discCoachingRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserDiscAnalysisSchema = createInsertSchema(userDiscAnalysis).omit({
  id: true,
  analysisDate: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type SenderCategory = typeof senderCategories.$inferSelect;
export type InsertSenderCategory = z.infer<typeof insertSenderCategorySchema>;
export type EmailClassification = typeof emailClassifications.$inferSelect;
export type InsertEmailClassification = z.infer<typeof insertEmailClassificationSchema>;
export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = z.infer<typeof insertResponseTemplateSchema>;
export type DiscCoachingRecommendation = typeof discCoachingRecommendations.$inferSelect;
export type InsertDiscCoachingRecommendation = z.infer<typeof insertDiscCoachingRecommendationSchema>;
export type UserDiscAnalysis = typeof userDiscAnalysis.$inferSelect;
export type InsertUserDiscAnalysis = z.infer<typeof insertUserDiscAnalysisSchema>;
