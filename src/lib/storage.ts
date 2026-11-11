import type { Answer } from '../data/content';

export const STORAGE_KEY = 'career-discovery-prototype-v1';

export interface Profile {
  name: string;
  currentStage: string;
  studyArea: string;
  activities: string;
  targetLocation: string;
}

export interface EvidenceReview {
  note: string;
  status: 'needs-review' | 'confirmed' | 'disputed';
  taskTags?: string[];
}

export interface ReportSnapshot {
  id: string;
  completedAt: string;
  assessmentVersion: string;
  profile: Profile;
  answers: Record<string, Answer>;
  evidenceReviews: Record<string, EvidenceReview>;
}

export interface PrototypeState {
  version: 1;
  assessmentVersion: 'draft-v1.3';
  privacyAccepted: boolean;
  profile: Profile;
  answers: Record<string, Answer>;
  skippedQuestionIds: string[];
  evidenceReviews: Record<string, EvidenceReview>;
  sessionStatus: 'not-started' | 'in-progress' | 'paused' | 'completed';
  roadmapProgress: string[];
  completedAt?: string;
  history: ReportSnapshot[];
}

export const createEmptyState = (): PrototypeState => ({
  version: 1,
  assessmentVersion: 'draft-v1.3',
  privacyAccepted: false,
  profile: { name: '', currentStage: '', studyArea: '', activities: '', targetLocation: '' },
  answers: {},
  skippedQuestionIds: [],
  evidenceReviews: {},
  sessionStatus: 'not-started',
  roadmapProgress: [],
  history: [],
});

export function hasLegacyLocalState(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearLocalState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The account workspace is stored separately on the server.
  }
}
