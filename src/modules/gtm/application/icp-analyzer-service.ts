/**
 * Application service for ICP analysis, prospect fit scoring, and ICP refinement suggestions.
 * Modular Monolith Architecture - GTM Module (Application Layer)
 */

import {
  ICPProfile,
  ICPValidationResult,
  validateICPProfile,
  calculateICPFitScore,
  createDefaultICPProfile,
} from '../domain/icp';

export interface ProspectFitResult {
  fitScore: number; // 0 - 100
  tier: 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface ICPAuditReport {
  profile: ICPProfile;
  validation: ICPValidationResult;
  recommendations: string[];
}

export class ICPAnalyzerService {
  /**
   * Analyzes an ICP profile for completeness and quality, generating recommendations.
   */
  analyzeICPProfile(profile: Partial<ICPProfile>): ICPAuditReport {
    const completeProfile = createDefaultICPProfile(profile);
    const validation = validateICPProfile(completeProfile);
    const recommendations: string[] = [...validation.suggestions];

    if (!completeProfile.buyerRole) {
      recommendations.push('Specify a concrete buyer role (e.g. Founder, VP Sales, Lead Engineer).');
    }
    if (!completeProfile.budgetRange) {
      recommendations.push('Estimate target customer budget range to guide pricing alignment.');
    }
    if (completeProfile.painPoints.length < 3) {
      recommendations.push('Expand pain points list to cover at least 3 distinct user frustrations.');
    }

    return {
      profile: completeProfile,
      validation,
      recommendations,
    };
  }

  /**
   * Evaluates prospect fit against a target ICP profile with tier and detailed reasons.
   */
  evaluateProspectFit(
    profile: ICPProfile,
    prospect: { role?: string; company?: string; notes?: string; tags?: string[] }
  ): ProspectFitResult {
    const fitScore = calculateICPFitScore(profile, prospect);
    const reasons: string[] = [];

    if (prospect.role && profile.buyerRole && profile.buyerRole.toLowerCase().includes(prospect.role.toLowerCase())) {
      reasons.push(`Role '${prospect.role}' matches target buyer role '${profile.buyerRole}'`);
    }

    if (prospect.tags && prospect.tags.length > 0) {
      reasons.push(`Prospect tags matched target audience criteria (${prospect.tags.join(', ')})`);
    }

    let tier: 'high' | 'medium' | 'low' = 'low';
    if (fitScore >= 75) tier = 'high';
    else if (fitScore >= 50) tier = 'medium';

    return {
      fitScore,
      tier,
      reasons,
    };
  }
}
