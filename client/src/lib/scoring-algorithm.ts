import type { Candidate, ScoringWeights, TopsisResult } from "@shared/schema";

function calculateCandidateScore(
  candidates: Candidate[],
  weights: ScoringWeights
): TopsisResult[] {
  const kriteria: ("benefit" | "cost")[] = [
    "benefit",
    "benefit",
    "benefit",
    "cost",
  ];

  // Step 1: Normalisasi Matriks
  const sumSquares = [0, 0, 0, 0];
  candidates.forEach((c) => {
    sumSquares[0] += c.pengalaman ** 2;
    sumSquares[1] += c.pendidikan ** 2;
    sumSquares[2] += c.wawancara ** 2;
    sumSquares[3] += c.usia ** 2;
  });
  const denominators = sumSquares.map(Math.sqrt);

  const normalized = candidates.map((c) => [
    c.pengalaman / denominators[0],
    c.pendidikan / denominators[1],
    c.wawancara / denominators[2],
    c.usia / denominators[3],
  ]);

  // Step 2: Matriks Ternormalisasi Terbobot
  const bobotArr = [
    weights.experience,
    weights.education,
    weights.interview,
    weights.age,
  ];

  const weighted = normalized.map((row) =>
    row.map((val, idx) => val * bobotArr[idx])
  );

  // Step 3: Tentukan Ideal Positif & Negatif
  const idealPositif: number[] = [];
  const idealNegatif: number[] = [];

  for (let j = 0; j < 4; j++) {
    const col = weighted.map((r) => r[j]);
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

export function recalculateAllScores(
  candidates: Candidate[],
  weights: ScoringWeights
): Candidate[] {
  const results = calculateCandidateScore(candidates, weights);

  const candidatesWithScores = candidates.map((candidate) => {
    const result = results.find((r: TopsisResult) => r.nama === candidate.nama);
    return { ...candidate, finalScore: result?.score ?? 0 };
  });

  return candidatesWithScores
}

export function getCandidateRanking(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort(
    (a, b) => (b.finalScore || 0) - (a.finalScore || 0)
  );
}

export function getCandidateStats(candidates: Candidate[]) {
  const totalCandidates = candidates.length;

  if (totalCandidates === 0) {
    return {
      total: 0,
      recommended: 0,
      averageScore: 0,
      topScore: 0,
    };
  }

  const scores = candidates.map((c) => c.finalScore || 0);
  const recommended = candidates.filter(
    (c) => (c.finalScore || 0) >= 80
  ).length;
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / totalCandidates;
  const topScore = Math.max(...scores);

  return {
    total: totalCandidates,
    recommended,
    averageScore: Math.round(averageScore * 10) / 10,
    topScore: Math.round(topScore * 10) / 10,
  };
}
