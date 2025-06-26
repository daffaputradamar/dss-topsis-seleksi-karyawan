import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCandidateSchema, scoringWeightsSchema, excelTemplateSchema, defaultWeights, type Candidate, type ScoringWeights, TopsisResult } from "@shared/schema";
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
function calculateScore(
  candidates: Candidate[],
  weights: ScoringWeights
): TopsisResult[] {

  const kriteria: ("benefit" | "cost")[] = ["benefit", "benefit", "benefit", "cost"];

  // Step 1: Normalisasi Matriks
  const sumSquares = [0, 0, 0, 0];
  candidates.forEach(c => {
    sumSquares[0] += c.pengalaman ** 2;
    sumSquares[1] += c.pendidikan ** 2;
    sumSquares[2] += c.wawancara ** 2;
    sumSquares[3] += c.usia ** 2;
  });
  const denominators = sumSquares.map(Math.sqrt);

  const normalized = candidates.map(c => [
    c.pengalaman / denominators[0],
    c.pendidikan / denominators[1],
    c.wawancara / denominators[2],
    c.usia / denominators[3]
  ]);

  // Step 2: Matriks Ternormalisasi Terbobot
  const bobotArr = [
    weights.experience,
    weights.education,
    weights.interview,
    weights.age
  ];

  const weighted = normalized.map(row =>
    row.map((val, idx) => val * bobotArr[idx])
  );

  // Step 3: Tentukan Ideal Positif & Negatif
  const idealPositif: number[] = [];
  const idealNegatif: number[] = [];

  for (let j = 0; j < 4; j++) {
    const col = weighted.map(r => r[j]);
    if (kriteria[j] === "benefit") {
      idealPositif[j] = Math.max(...col);
      idealNegatif[j] = Math.min(...col);
    } else {
      idealPositif[j] = Math.min(...col);
      idealNegatif[j] = Math.max(...col);
    }
  }

  // Step 4: Hitung Jarak ke Ideal Positif & Negatif
  const hasil = candidates.map((c, idx) => {
    const row = weighted[idx];
    const dPositif = Math.sqrt(
      row.reduce((sum, val, j) => sum + (val - idealPositif[j]) ** 2, 0)
    );
    const dNegatif = Math.sqrt(
      row.reduce((sum, val, j) => sum + (val - idealNegatif[j]) ** 2, 0)
    );

    const cc = dNegatif / (dPositif + dNegatif);

    return { nama: c.nama, score: Math.round(cc * 1000) / 1000 };
  });

  // Urutkan dari skor tertinggi
  return hasil.sort((a, b) => b.score - a.score);
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
      // Specify custom headers to map columns correctly
      const data = XLSX.utils.sheet_to_json(worksheet, {
        header: [
          "Nama Lengkap",
          "Pengalaman (tahun)",
          "Pendidikan (1-5)",
          "Wawancara (0-100)",
          "Usia"
        ],
        range: 1 // skip the first row if it is the header
      });

      if (data.length === 0) {
        return res.status(400).json({ message: "Excel file is empty" });
      }

      // Validate and transform data
      const validatedCandidates = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          // Map custom headers to schema fields
          const mappedRow = {
            Nama: row["Nama Lengkap"],
            Pengalaman: row["Pengalaman (tahun)"],
            Pendidikan: row["Pendidikan (1-5)"],
            Wawancara: row["Wawancara (0-100)"],
            Usia: row["Usia"]
          };
          const validated = excelTemplateSchema.parse(mappedRow);

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
      const results = calculateScore(candidates, defaultWeights);
      
      const candidatesWithScores = candidates.map(candidate => {
          const result = results.find(r => r.nama === candidate.nama);
          return { ...candidate, finalScore: result?.score ?? 0 };
      });

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
          "Nama Lengkap": "Reza",
          "Pengalaman (tahun)": 5,
          "Pendidikan (1-5)": 4,
          "Wawancara (0-100)": 85,
          "Usia": 30
        },
        {
          "Nama Lengkap": "Teuku", 
          "Pengalaman (tahun)": 3,
          "Pendidikan (1-5)": 5,
          "Wawancara (0-100)": 92,
          "Usia": 28
        }
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(templateData, { header: [
        "Nama Lengkap",
        "Pengalaman (tahun)",
        "Pendidikan (1-5)",
        "Wawancara (0-100)",
        "Usia"
      ]});

      // Set column widths
      worksheet['!cols'] = [
        { width: 20 }, // Nama Lengkap
        { width: 18 }, // Pengalaman (tahun)
        { width: 18 }, // Pendidikan (1-5)
        { width: 18 }, // Wawancara (0-100)
        { width: 10 }  // Usia
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, "Kandidat Karyawan");

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
      
      console.log(candidates, defaultWeights);
      
      const results = calculateScore(candidates, defaultWeights);
      
      const updatedCandidates = candidates.map(candidate => {
          const result = results.find(r => r.nama === candidate.nama);
          return { ...candidate, finalScore: result?.score ?? 0 };
      });

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
