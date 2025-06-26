import { candidates, type Candidate, type InsertCandidate } from "@shared/schema";

export interface IStorage {
  // Candidate operations
  getAllCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  createCandidates(candidates: InsertCandidate[]): Promise<Candidate[]>;
  updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined>;
  deleteCandidate(id: number): Promise<boolean>;
  deleteAllCandidates(): Promise<void>;
  updateCandidateScores(candidates: Candidate[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private candidates: Map<number, Candidate>;
  private currentId: number;

  constructor() {
    this.candidates = new Map();
    this.currentId = 1;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentId++;
    const candidate: Candidate = { 
      ...insertCandidate, 
      id,
      finalScore: null
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async createCandidates(insertCandidates: InsertCandidate[]): Promise<Candidate[]> {
    const newCandidates: Candidate[] = [];
    for (const insertCandidate of insertCandidates) {
      const candidate = await this.createCandidate(insertCandidate);
      newCandidates.push(candidate);
    }
    return newCandidates;
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;

    const updatedCandidate = { ...candidate, ...updates };
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }

  async deleteCandidate(id: number): Promise<boolean> {
    return this.candidates.delete(id);
  }

  async deleteAllCandidates(): Promise<void> {
    this.candidates.clear();
    this.currentId = 1;
  }

  async updateCandidateScores(updatedCandidates: Candidate[]): Promise<void> {
    for (const candidate of updatedCandidates) {
      this.candidates.set(candidate.id, candidate);
    }
  }
}

export const storage = new MemStorage();
