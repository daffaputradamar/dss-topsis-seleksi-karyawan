import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCandidateSchema, scoringWeightsSchema, excelTemplateSchema, defaultWeights, type Candidate, type ScoringWeights } from "@shared/schema";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/excel'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

// Calculate weighted score for a candidate
function calculateScore(candidate: Omit<Candidate, 'id' | 'finalScore'>, weights: ScoringWeights): number {
  // Normalize each criterion to 0-100 scale
  const normalizedExperience = Math.min(candidate.pengalaman * 10, 100); // Cap at 10 years = 100
  const normalizedEducation = (candidate.pendidikan / 5) * 100; // 1-5 scale to 0-100
  const normalizedInterview = candidate.wawancara; // Already 0-100
  const normalizedAge = Math.max(0, 100 - Math.abs(candidate.usia - 30) * 2); // Optimal age around 30

  // Calculate weighted score
  const totalWeight = weights.experience + weights.education + weights.interview + weights.age;
  
  const score = (
    (normalizedExperience * weights.experience) +
    (normalizedEducation * weights.education) +
    (normalizedInterview * weights.interview) +
    (normalizedAge * weights.age)
  ) / totalWeight;

  return Math.round(score * 10) / 10; // Round to 1 decimal place
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all candidates
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  // Upload Excel file and process candidates
  app.post("/api/candidates/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      // Validate and transform data
      const validatedCandidates = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          const validated = excelTemplateSchema.parse(row);
          
          validatedCandidates.push({
            nama: validated.Nama,
            pengalaman: validated.Pengalaman,
            pendidikan: validated.Pendidikan,
            wawancara: validated.Wawancara,
            usia: validated.Usia,
          });
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(`Row ${i + 2}: ${error.errors.map(e => e.message).join(', ')}`);
          } else {
            errors.push(`Row ${i + 2}: Invalid data format`);
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: "Data validation failed", 
          errors: errors
        });
      }

      // Clear existing candidates and add new ones
      await storage.deleteAllCandidates();
      const candidates = await storage.createCandidates(validatedCandidates);

      // Calculate scores with default weights
      const candidatesWithScores = candidates.map(candidate => ({
        ...candidate,
        finalScore: calculateScore(candidate, defaultWeights)
      }));

      await storage.updateCandidateScores(candidatesWithScores);

      res.json({ 
        message: "File uploaded successfully", 
        count: candidates.length,
        candidates: candidatesWithScores.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to process uploaded file" });
    }
  });

  // Download Excel template
  app.get("/api/template/download", (req, res) => {
    try {
      // Create sample data for template
      const templateData = [
        {
          Nama: "John Doe",
          Pengalaman: 5,
          Pendidikan: 4,
          Wawancara: 85,
          Usia: 30
        },
        {
          Nama: "Jane Smith", 
          Pengalaman: 3,
          Pendidikan: 5,
          Wawancara: 92,
          Usia: 28
        }
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Set column widths
      worksheet['!cols'] = [
        { width: 20 }, // Nama
        { width: 12 }, // Pengalaman
        { width: 12 }, // Pendidikan
        { width: 12 }, // Wawancara
        { width: 10 }  // Usia
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="candidate-template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error('Template download error:', error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Recalculate scores with new weights
  app.post("/api/candidates/recalculate", async (req, res) => {
    try {
      const weights = scoringWeightsSchema.parse(req.body);
      
      // Validate weights sum to 100
      const totalWeight = weights.experience + weights.education + weights.interview + weights.age;
      if (Math.abs(totalWeight - 100) > 0.1) {
        return res.status(400).json({ message: "Weights must sum to 100%" });
      }

      const candidates = await storage.getAllCandidates();
      
      const updatedCandidates = candidates.map(candidate => ({
        ...candidate,
        finalScore: calculateScore(candidate, weights)
      }));

      await storage.updateCandidateScores(updatedCandidates);

      res.json({
        message: "Scores recalculated successfully",
        candidates: updatedCandidates.sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid weights format" });
      }
      console.error('Recalculation error:', error);
      res.status(500).json({ message: "Failed to recalculate scores" });
    }
  });

  // Export results to Excel
  app.get("/api/candidates/export", async (req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      
      if (candidates.length === 0) {
        return res.status(400).json({ message: "No candidates to export" });
      }

      // Format data for export
      const exportData = candidates.map((candidate, index) => ({
        Rank: index + 1,
        Nama: candidate.nama,
        'Pengalaman (tahun)': candidate.pengalaman,
        'Pendidikan (1-5)': candidate.pendidikan, 
        'Wawancara (0-100)': candidate.wawancara,
        Usia: candidate.usia,
        'Final Score': candidate.finalScore?.toFixed(1) || '0.0',
        Status: candidate.finalScore && candidate.finalScore >= 80 ? 'Recommended' : 
                candidate.finalScore && candidate.finalScore >= 70 ? 'Consider' : 
                candidate.finalScore && candidate.finalScore >= 60 ? 'Review' : 'Not Recommended'
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet['!cols'] = [
        { width: 8 },  // Rank
        { width: 20 }, // Nama
        { width: 15 }, // Pengalaman
        { width: 15 }, // Pendidikan
        { width: 15 }, // Wawancara
        { width: 8 },  // Usia
        { width: 12 }, // Final Score
        { width: 15 }  // Status
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Disposition', 'attachment; filename="candidate-results.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export results" });
    }
  });

  // Delete all candidates
  app.delete("/api/candidates", async (req, res) => {
    try {
      await storage.deleteAllCandidates();
      res.json({ message: "All candidates deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete candidates" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
