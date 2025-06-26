import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  pengalaman: integer("pengalaman").notNull(), // years of experience
  pendidikan: integer("pendidikan").notNull(), // education level 1-5
  wawancara: integer("wawancara").notNull(), // interview score 0-100
  usia: integer("usia").notNull(), // age
  finalScore: real("final_score"), // calculated final score
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  finalScore: true,
});

export const updateCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
});

// Scoring weights schema
export const scoringWeightsSchema = z.object({
  experience: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  interview: z.number().min(0).max(100),
  age: z.number().min(0).max(100),
});

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type UpdateCandidate = z.infer<typeof updateCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;
export type ScoringWeights = z.infer<typeof scoringWeightsSchema>;

// Default scoring weights
export const defaultWeights: ScoringWeights = {
  experience: 25,
  education: 20,
  interview: 40,
  age: 15,
};

// Excel template structure
export const excelTemplateSchema = z.object({
  Nama: z.string().min(1, "Name is required"),
  Pengalaman: z.number().min(0, "Experience must be 0 or more years"),
  Pendidikan: z.number().min(1).max(5, "Education must be between 1-5"),
  Wawancara: z.number().min(0).max(100, "Interview score must be between 0-100"),
  Usia: z.number().min(18).max(65, "Age must be between 18-65"),
});

export type ExcelTemplateRow = z.infer<typeof excelTemplateSchema>;
