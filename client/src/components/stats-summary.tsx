import { Card, CardContent } from "@/components/ui/card";
import type { Candidate } from "@shared/schema";

interface StatsSummaryProps {
  candidates: Candidate[];
}

export default function StatsSummary({ candidates }: StatsSummaryProps) {
  const totalCandidates = candidates.length;
  const recommended = candidates.filter(c => c.finalScore && c.finalScore >= 80).length;
  const averageScore = totalCandidates > 0 
    ? candidates.reduce((sum, c) => sum + (c.finalScore || 0), 0) / totalCandidates
    : 0;

  return (
    <div className="grid md:grid-cols-4 gap-6 mt-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Candidates</p>
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
              <p className="text-sm font-medium text-slate-600">Recommended</p>
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
              <p className="text-sm font-medium text-slate-600">Average Score</p>
              <p className="text-2xl font-bold text-slate-900">{averageScore.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-amber-600 text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Processing Time</p>
              <p className="text-2xl font-bold text-slate-900">0.3s</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-purple-600 text-xl"></i>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
