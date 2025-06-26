import { Card, CardContent } from "@/components/ui/card";
import type { Candidate } from "@shared/schema";
import { useEffect, useState } from "react";

interface StatsSummaryProps {
  candidates: Candidate[];
}

export default function StatsSummary({ candidates }: StatsSummaryProps) {
  const [processingTime, setProcessingTime] = useState(0.3);

  useEffect(() => {
    const startTime = performance.now();

    // Simulate processing logic (replace with actual processing if needed)
    const totalCandidates = candidates.length;
    const recommended = candidates.filter(c => c.finalScore && c.finalScore >= .6).length;
    const averageScore = totalCandidates > 0 
      ? candidates.reduce((sum, c) => sum + (c.finalScore || 0), 0) / totalCandidates
      : 0;

    const endTime = performance.now();
    let timeTaken = parseFloat(((endTime - startTime) / 1000).toFixed(2));

    if (timeTaken < .3) {
      timeTaken = 0.3; // Ensure minimum processing time is 0.3 seconds
    }

    setProcessingTime(timeTaken);
  }, [candidates]);

  const totalCandidates = candidates.length;
  const recommended = candidates.filter(c => c.finalScore && c.finalScore >= .6).length;
  const averageScore = totalCandidates > 0 
    ? candidates.reduce((sum, c) => sum + (c.finalScore || 0), 0) / totalCandidates
    : 0;

  return (
    <div className="grid md:grid-cols-3 gap-6 mt-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Kandidat</p>
              <p className="text-2xl font-bold text-slate-900">{totalCandidates}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Rekomendasi</p>
              <p className="text-2xl font-bold text-green-600">{recommended}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Skor Rata-rata</p>
              <p className="text-2xl font-bold text-slate-900">{averageScore.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-amber-600 text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Processing Time</p>
              <p className="text-2xl font-bold text-slate-900">{processingTime}s</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-purple-600 text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
