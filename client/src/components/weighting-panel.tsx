import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ScoringWeights } from "@shared/schema";

interface WeightingPanelProps {
  onRecalculateSuccess: () => void;
}

export default function WeightingPanel({ onRecalculateSuccess }: WeightingPanelProps) {
  const [weights, setWeights] = useState<ScoringWeights>({
    experience: 25,
    education: 20,
    interview: 40,
    age: 15,
  });
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { toast } = useToast();

  const totalWeight = weights.experience + weights.education + weights.interview + weights.age;

  const handleWeightChange = (criterion: keyof ScoringWeights, value: number[]) => {
    setWeights(prev => ({
      ...prev,
      [criterion]: value[0]
    }));
  };

  const handleRecalculate = async () => {
    if (Math.abs(totalWeight - 100) > 0.1) {
      toast({
        title: "Bobot Tidak Valid",
        description: "Total bobot harus sama dengan 100%",
        variant: "destructive",
      });
      return;
    }

    setIsRecalculating(true);

    try {
      await apiRequest("POST", "/api/candidates/recalculate", weights);
      
      toast({
        title: "Kalkulasi Ulang Berhasil",
        description: "Semua skor kandidat telah diperbarui dengan bobot baru",
      });

      onRecalculateSuccess();
    } catch (error) {
      toast({
        title: "Kalkulasi Ulang Gagal",
        description: error instanceof Error ? error.message : "Gagal melakukan kalkulasi ulang skor",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Konfigurasi Penilaian Bobot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <Label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-2">
              Bobot Pengalaman <span className="text-xs text-green-600">(Benefit)</span>
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={[weights.experience]}
                onValueChange={(value) => handleWeightChange('experience', value)}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-900 w-10">
                {weights.experience}%
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="education" className="block text-sm font-medium text-slate-700 mb-2">
              Bobot Pendidikan <span className="text-xs text-green-600">(Benefit)</span>
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={[weights.education]}
                onValueChange={(value) => handleWeightChange('education', value)}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-900 w-10">
                {weights.education}%
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="interview" className="block text-sm font-medium text-slate-700 mb-2">
              Bobot Wawancara <span className="text-xs text-green-600">(Benefit)</span>
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={[weights.interview]}
                onValueChange={(value) => handleWeightChange('interview', value)}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-900 w-10">
                {weights.interview}%
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-2">
              Bobot Usia <span className="text-xs text-red-600">(Cost)</span>
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={[weights.age]}
                onValueChange={(value) => handleWeightChange('age', value)}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-sm font-medium text-slate-900 w-10">
                {weights.age}%
              </span>
            </div>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={handleRecalculate}
              disabled={isRecalculating || Math.abs(totalWeight - 100) > 0.1}
              className="w-full bg-primary hover:bg-blue-700"
            >
              <i className="fas fa-calculator mr-2"></i>
              {isRecalculating ? 'Sedang Proses Kalkulasi...' : 'Kalkulasi Ulang'}
            </Button>
          </div>
        </div>

        <div className={`mt-4 p-3 rounded-lg ${Math.abs(totalWeight - 100) > 0.1 ? 'bg-red-50' : 'bg-blue-50'}`}>
          <p className={`text-sm ${Math.abs(totalWeight - 100) > 0.1 ? 'text-red-800' : 'text-blue-800'}`}>
            <i className={`fas ${Math.abs(totalWeight - 100) > 0.1 ? 'fa-exclamation-triangle' : 'fa-info-circle'} mr-2`}></i>
            Total Nilai Bobot: {totalWeight}% {Math.abs(totalWeight - 100) > 0.1 ? '(Total harus 100%)' : '(Sesuai)'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
