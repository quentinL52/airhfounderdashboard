/**
 * Domain module for Growth Hypotheses logic & ICE / PIE prioritization frameworks.
 * Modular Monolith Architecture - GTM Module (Domain Layer)
 */

export type HypothesisStatus = 'draft' | 'testing' | 'validated' | 'invalidated' | 'pivoted';
export type HypothesisRisk = 'critical' | 'high' | 'medium' | 'low';
export type HypothesisCategory = 'problem' | 'solution' | 'channel' | 'revenue' | 'segment';

export interface GrowthHypothesis {
  id: string;
  createdAt: string;
  updatedAt: string;

  // Formulation
  statement: string;
  category: HypothesisCategory;
  riskLevel: HypothesisRisk;

  // Build phase
  testMethod: string;
  successCriteria: string;
  deadline?: string;
  cost?: number;

  // Prioritization (ICE score factors 1-10)
  impactScore?: number;     // 1 - 10
  confidenceScore?: number; // 1 - 10
  easeScore?: number;       // 1 - 10

  // Measure phase
  measureNotes?: string;

  // Learn phase
  status: HypothesisStatus;
  actualResult?: string;
  learnings?: string;
  nextAction?: string;

  // Pivot tracking
  pivotedFromId?: string;
}

export interface ICEScoreResult {
  iceScore: number; // Average of Impact, Confidence, Ease (1-10)
  priorityTier: 'P1' | 'P2' | 'P3';
}

/**
 * Calculates the ICE (Impact, Confidence, Ease) score for a growth hypothesis.
 */
export function calculateICEScore(
  impact: number = 5,
  confidence: number = 5,
  ease: number = 5
): ICEScoreResult {
  const normImpact = Math.min(10, Math.max(1, impact));
  const normConfidence = Math.min(10, Math.max(1, confidence));
  const normEase = Math.min(10, Math.max(1, ease));

  const iceScore = Number(((normImpact + normConfidence + normEase) / 3).toFixed(1));

  let priorityTier: 'P1' | 'P2' | 'P3' = 'P3';
  if (iceScore >= 7.5) priorityTier = 'P1';
  else if (iceScore >= 5.0) priorityTier = 'P2';

  return {
    iceScore,
    priorityTier,
  };
}

/**
 * Validates state transition for a growth hypothesis.
 */
export function canTransitionHypothesisStatus(
  currentStatus: HypothesisStatus,
  targetStatus: HypothesisStatus
): boolean {
  if (currentStatus === targetStatus) return true;

  const validTransitions: Record<HypothesisStatus, HypothesisStatus[]> = {
    draft: ['testing', 'invalidated'],
    testing: ['validated', 'invalidated', 'pivoted', 'draft'],
    validated: ['pivoted', 'testing'],
    invalidated: ['pivoted', 'draft'],
    pivoted: ['draft', 'testing'],
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
}
