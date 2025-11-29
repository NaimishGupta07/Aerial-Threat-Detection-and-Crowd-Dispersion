import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Threat Detection Analysis
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url"),
  threatCount: integer("threat_count").notNull().default(0),
  crowdCount: integer("crowd_count").notNull().default(0),
  density: text("density").notNull(), // LOW, MEDIUM, HIGH, CRITICAL
  status: text("status").notNull(), // SAFE, WARNING, DANGER
  detections: jsonb("detections"), // Array of detected objects with bounding boxes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analyses).omit({
  id: true,
  createdAt: true,
});

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

// Historical Threat Datasets
export const threatDatasets = pgTable("threat_datasets", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  threats: jsonb("threats").notNull(), // Array of threat objects
  crowdStats: jsonb("crowd_stats").notNull(), // Crowd density time series
  classificationStats: jsonb("classification_stats").notNull(), // Threat classification data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertThreatDatasetSchema = createInsertSchema(threatDatasets).omit({
  createdAt: true,
});

export type InsertThreatDataset = z.infer<typeof insertThreatDatasetSchema>;
export type ThreatDataset = typeof threatDatasets.$inferSelect;
