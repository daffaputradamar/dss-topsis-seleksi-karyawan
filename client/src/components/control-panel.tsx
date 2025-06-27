import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface ControlPanelProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  candidateCount: number;
  candidates: any[]; // Add candidates prop
}

export default function ControlPanel({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  candidateCount,
  candidates,
}: ControlPanelProps) {
  const { toast } = useToast();

  const handleExportResults = () => {
    if (candidateCount === 0) {
      toast({
        title: "Tidak ditemukan data kandidat",
        description: "Mohon unggah data kandidat terlebih dahulu sebelum melakukan ekspor.",
        variant: "destructive",
      });
      return;
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(candidates);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "candidate-results.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Berhasil",
        description: "Hasil kandidat telah diekspor ke file Excel.",
      });
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: error instanceof Error ? error.message : "Gagal melakukan ekspor hasil kandidat.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Cari kandidat..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 w-64"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
            </div>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Sort by Score</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="experience">Sort by Experience</SelectItem>
                <SelectItem value="age">Sort by Age</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600">
              {candidateCount} candidates loaded
            </span>
            <Button 
              onClick={handleExportResults}
              className="bg-green-600 hover:bg-green-700"
            >
              <i className="fas fa-file-export mr-2"></i>
              Export hasil
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
