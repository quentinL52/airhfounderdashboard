/**
 * Application service for Growth Hypotheses execution and management.
 * Modular Monolith Architecture - GTM Module (Application Layer)
 */

import {
  GrowthHypothesis,
  HypothesisStatus,
  calculateICEScore,
  canTransitionHypothesisStatus,
} from '../domain/growth-hypothesis';

export interface CreateHypothesisInput {
  statement: string;
  category: GrowthHypothesis['category'];
  riskLevel: GrowthHypothesis['riskLevel'];
  testMethod: string;
  successCriteria: string;
  deadline?: string;
  cost?: number;
  impactScore?: number;
  confidenceScore?: number;
  easeScore?: number;
}

export interface HypothesisMetrics {
  total: number;
  testing: number;
  validated: number;
  invalidated: number;
  pivoted: number;
  validationRate: number; // percentage
}

export class GrowthHypothesisService {
  /**
   * Constructs a new GrowthHypothesis with computed ICE metrics and default status.
   */
  createHypothesis(input: CreateHypothesisInput): GrowthHypothesis {
    const now = new Date().toISOString();
    return {
      id: `hyp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      statement: input.statement,
      category: input.category,
      riskLevel: input.riskLevel,
      testMethod: input.testMethod,
      successCriteria: input.successCriteria,
      deadline: input.deadline,
      cost: input.cost || 0,
      impactScore: input.impactScore || 5,
      confidenceScore: input.confidenceScore || 5,
      easeScore: input.easeScore || 5,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Updates status of an existing hypothesis with transition validation.
   */
  transitionStatus(
    hypothesis: GrowthHypothesis,
    newStatus: HypothesisStatus,
    learnings?: string,
    actualResult?: string,
    nextAction?: string
  ): GrowthHypothesis {
    if (!canTransitionHypothesisStatus(hypothesis.status, newStatus)) {
      throw new Error(`Invalid status transition from '${hypothesis.status}' to '${newStatus}'`);
    }

    return {
      ...hypothesis,
      status: newStatus,
      learnings: learnings !== undefined ? learnings : hypothesis.learnings,
      actualResult: actualResult !== undefined ? actualResult : hypothesis.actualResult,
      nextAction: nextAction !== undefined ? nextAction : hypothesis.nextAction,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Creates a pivoted hypothesis derived from an invalidated or completed hypothesis.
   */
  pivotHypothesis(
    originalHypothesis: GrowthHypothesis,
    newStatement: string,
    newTestMethod: string
  ): { original: GrowthHypothesis; pivoted: GrowthHypothesis } {
    const now = new Date().toISOString();
    
    const updatedOriginal: GrowthHypothesis = {
      ...originalHypothesis,
      status: 'pivoted',
      updatedAt: now,
    };

    const pivotedHypothesis: GrowthHypothesis = {
      id: `hyp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      statement: newStatement,
      category: originalHypothesis.category,
      riskLevel: originalHypothesis.riskLevel,
      testMethod: newTestMethod,
      successCriteria: originalHypothesis.successCriteria,
      deadline: originalHypothesis.deadline,
      cost: originalHypothesis.cost,
      impactScore: originalHypothesis.impactScore,
      confidenceScore: originalHypothesis.confidenceScore,
      easeScore: originalHypothesis.easeScore,
      status: 'testing',
      pivotedFromId: originalHypothesis.id,
      createdAt: now,
      updatedAt: now,
    };

    return {
      original: updatedOriginal,
      pivoted: pivotedHypothesis,
    };
  }

  /**
   * Calculates overall metrics from a collection of hypotheses.
   */
  calculateMetrics(hypotheses: GrowthHypothesis[]): HypothesisMetrics {
    if (!hypotheses || hypotheses.length === 0) {
      return {
        total: 0,
        testing: 0,
        validated: 0,
        invalidated: 0,
        pivoted: 0,
        validationRate: 0,
      };
    }

    const testing = hypotheses.filter(h => h.status === 'testing').length;
    const validated = hypotheses.filter(h => h.status === 'validated').length;
    const invalidated = hypotheses.filter(h => h.status === 'invalidated').length;
    const pivoted = hypotheses.filter(h => h.status === 'pivoted').length;

    const finishedCount = validated + invalidated;
    const validationRate = finishedCount > 0 ? Math.round((validated / finishedCount) * 100) : 0;

    return {
      total: hypotheses.length,
      testing,
      validated,
      invalidated,
      pivoted,
      validationRate,
    };
  }

  /**
   * Sorts hypotheses by ICE priority score descending.
   */
  sortByPriority(hypotheses: GrowthHypothesis[]): GrowthHypothesis[] {
    return [...hypotheses].sort((a, b) => {
      const iceA = calculateICEScore(a.impactScore, a.confidenceScore, a.easeScore).iceScore;
      const iceB = calculateICEScore(b.impactScore, b.confidenceScore, b.easeScore).iceScore;
      return iceB - iceA;
    });
  }
}
