import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Candidate } from "@shared/schema";

interface CandidateTableProps {
  candidates: Candidate[];
  isLoading: boolean;
}

const getStatusInfo = (score: number | null) => {
  if (!score) return { label: "Pending", className: "bg-gray-100 text-gray-800" };
  
  if (score >= 80) return { label: "Recommended", className: "bg-green-100 text-green-800" };
  if (score >= 70) return { label: "Consider", className: "bg-blue-100 text-blue-800" };
  if (score >= 60) return { label: "Review", className: "bg-yellow-100 text-yellow-800" };
  return { label: "Not Recommended", className: "bg-red-100 text-red-800" };
};

const getScoreColor = (score: number | null) => {
  if (!score) return "text-slate-600";
  if (score >= 80) return "text-green-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
};

const getScoreLabel = (score: number | null) => {
  if (!score) return "Pending";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Very Good";
  if (score >= 60) return "Good";
  return "Poor";
};

const getRankBadgeColor = (rank: number) => {
  if (rank === 1) return "bg-green-600";
  if (rank === 2) return "bg-blue-600";
  if (rank === 3) return "bg-amber-500";
  return "bg-slate-400";
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <i
      key={i}
      className={`fas fa-star ${i < rating ? 'text-yellow-400' : 'text-slate-300'}`}
    />
  ));
};

export default function CandidateTable({ candidates, isLoading }: CandidateTableProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Candidate Evaluation Results</CardTitle>
          <p className="text-sm text-slate-600">Ranked by weighted scoring algorithm</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Candidate Evaluation Results</CardTitle>
          <p className="text-sm text-slate-600">Ranked by weighted scoring algorithm</p>
        </CardHeader>
        <CardContent className="text-center py-12">
          <i className="fas fa-users text-4xl text-slate-300 mb-4"></i>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Candidates Found</h3>
          <p className="text-slate-600">Upload an Excel file to get started with candidate evaluation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Candidate Evaluation Results</CardTitle>
        <p className="text-sm text-slate-600">Ranked by weighted scoring algorithm</p>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Education</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Interview</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Age</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Final Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {candidates.map((candidate, index) => {
              const rank = index + 1;
              const statusInfo = getStatusInfo(candidate.finalScore);
              
              return (
                <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 ${getRankBadgeColor(rank)} text-white text-xs font-bold rounded-full`}>
                        {rank}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center mr-3">
                        <i className="fas fa-user text-slate-500 text-sm"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{candidate.nama}</div>
                        <div className="text-sm text-slate-500">ID: EMP{candidate.id.toString().padStart(3, '0')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{candidate.pengalaman} years</div>
                    <div className="text-sm text-slate-500">
                      {candidate.pengalaman >= 5 ? 'Senior Level' : 
                       candidate.pengalaman >= 3 ? 'Mid Level' : 'Junior Level'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-slate-900 mr-2">{candidate.pendidikan}</div>
                      <div className="flex">
                        {renderStars(candidate.pendidikan)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">{candidate.wawancara}/100</div>
                    <Progress 
                      value={candidate.wawancara} 
                      className="h-1.5 mt-1"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {candidate.usia}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-lg font-bold ${getScoreColor(candidate.finalScore)}`}>
                      {candidate.finalScore?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {getScoreLabel(candidate.finalScore)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={statusInfo.className}>
                      {statusInfo.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
