import type { Candidate, ScoringWeights } from "@shared/schema";

export function calculateCandidateScore(
  candidate: Omit<Candidate, 'id' | 'finalScore'>,
  weights: ScoringWeights
): number {
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

export function recalculateAllScores(
  candidates: Candidate[],
  weights: ScoringWeights
): Candidate[] {
  return candidates.map(candidate => ({
    ...candidate,
    finalScore: calculateCandidateScore(candidate, weights)
  }));
}

export function getCandidateRanking(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
}

export function getCandidateStats(candidates: Candidate[]) {
  const totalCandidates = candidates.length;
  
  if (totalCandidates === 0) {
    return {
      total: 0,
      recommended: 0,
      averageScore: 0,
      topScore: 0
    };
  }

  const scores = candidates.map(c => c.finalScore || 0);
  const recommended = candidates.filter(c => (c.finalScore || 0) >= 80).length;
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalCandidates;
  const topScore = Math.max(...scores);

  return {
    total: totalCandidates,
    recommended,
    averageScore: Math.round(averageScore * 10) / 10,
    topScore: Math.round(topScore * 10) / 10
  };
}
