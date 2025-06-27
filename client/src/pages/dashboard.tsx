import { useState } from "react";
import UploadSection from "@/components/upload-section";
import ControlPanel from "@/components/control-panel";
import CandidateTable from "@/components/candidate-table";
import StatsSummary from "@/components/stats-summary";
import WeightingPanel from "@/components/weighting-panel";
import { excelTemplateSchema, ScoringWeights, type Candidate } from "@shared/schema";
import { recalculateAllScores } from "@/lib/scoring-algorithm";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [weights, setWeights] = useState<ScoringWeights>({
    experience: 25,
    education: 20,
    interview: 40,
    age: 15,
  });

  const handleUploadSuccess = (uploadedCandidates: Candidate[]) => {

    if (uploadedCandidates.length === 0) {
      return toast({
        title: "Tidak ada kandidat ditemukan",
        description: "Pastikan file yang diunggah berisi data kandidat yang valid.",
        variant: "destructive",
      });
    }

    // Validate and transform data
    const validatedCandidates: Candidate[] = [];
    const errors = [];

    for (let i = 0; i < uploadedCandidates.length; i++) {
      try {
        const row = uploadedCandidates[i] as any;
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
          id: i + 1,
          nama: validated.Nama,
          pengalaman: validated.Pengalaman,
          pendidikan: validated.Pendidikan,
          wawancara: validated.Wawancara,
          usia: validated.Usia,
          finalScore: null
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
      toast({
        title: "Data Validasi Gagal",
        description: `Beberapa baris tidak valid:\n${errors.join('\n')}`,
        variant: "destructive",
      });
      return;
    }

    console.log("Validated Candidates:", validatedCandidates);
    console.log("Scoring Weights:", weights);
    
    
    const scoredCandidates = recalculateAllScores(validatedCandidates, weights);

    console.log("Scored Candidates:", scoredCandidates);
    
    setCandidates(scoredCandidates);
  };

  const handleRecalculateSuccess = (updatedCandidates: Candidate[]) => {
    setCandidates(updatedCandidates);
  };

  const handleWeightChange = (criterion: keyof ScoringWeights, value: number[]) => {
    setWeights(prev => ({
      ...prev,
      [criterion]: value[0],
    }));
  };

  const filteredAndSortedCandidates = candidates
    .filter(candidate =>
      candidate.nama.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.nama.localeCompare(b.nama);
        case "experience":
          return b.pengalaman - a.pengalaman;
        case "age":
          return a.usia - b.usia;
        case "score":
        default:
          return (b.finalScore || 0) - (a.finalScore || 0);
      }
    });

  return (
    <div className="font-inter bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-white text-lg"></i>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">DSS - Seleksi Karyawan</h1>
                <p className="text-sm text-slate-500">TOPSIS</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UploadSection onUploadSuccess={handleUploadSuccess} />

        <ControlPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          candidateCount={candidates.length}
          candidates={candidates}
        />

        <CandidateTable
          candidates={filteredAndSortedCandidates}
          isLoading={false}
        />

        <StatsSummary candidates={candidates} />

        <WeightingPanel
          candidates={candidates}
          weights={weights}
          onWeightChange={handleWeightChange}
          onRecalculateSuccess={(updatedCandidates: Candidate[]) => handleRecalculateSuccess(updatedCandidates)}
        />
      </div>
    </div>
  );
}
