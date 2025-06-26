import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import UploadSection from "@/components/upload-section";
import ControlPanel from "@/components/control-panel";
import CandidateTable from "@/components/candidate-table";
import StatsSummary from "@/components/stats-summary";
import WeightingPanel from "@/components/weighting-panel";
import type { Candidate } from "@shared/schema";
import { useState } from "react";

export default function Dashboard() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("score");

  const { data: candidates = [], isLoading, refetch } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  const handleUploadSuccess = () => {
    refetch();
    toast({
      title: "Upload Berhasil",
      description: "Data kandidat berhasil diunggah dan dikalkulasi.",
    });
  };

  const handleRecalculateSuccess = () => {
    refetch();
    toast({
      title: "Kalkulasi Ulang Berhasil", 
      description: "Semua skor kandidat telah diperbarui dengan bobot baru",
    });
  };

  // Filter and sort candidates
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
        />
        
        <CandidateTable 
          candidates={filteredAndSortedCandidates}
          isLoading={isLoading}
        />
        
        <StatsSummary candidates={candidates} />
        
        <WeightingPanel onRecalculateSuccess={handleRecalculateSuccess} />
      </div>
    </div>
  );
}
