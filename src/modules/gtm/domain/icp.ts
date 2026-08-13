/**
 * Domain module for Ideal Customer Profile (ICP) definitions & validation.
 * Modular Monolith Architecture - GTM Module (Domain Layer)
 */

export interface ICPProfile {
  id: string;
  name: string;
  targetAudience: string;
  companySize?: string;
  industry?: string;
  budgetRange?: string;
  painPoints: string[];
  keyBenefits: string[];
  alternativeSolutions: string[];
  decisionCriteria: string[];
  buyerRole?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICPValidationResult {
  isValid: boolean;
  score: number; // 0 - 100 completeness score
  missingFields: string[];
  suggestions: string[];
}

/**
 * Creates a default ICP profile template for B2B / Solo Founders.
 */
export function createDefaultICPProfile(partial?: Partial<ICPProfile>): ICPProfile {
  const now = new Date().toISOString();
  return {
    id: partial?.id || `icp-${Date.now()}`,
    name: partial?.name !== undefined ? partial.name : 'Solo Founders & Indie Hackers',
    targetAudience: partial?.targetAudience !== undefined ? partial.targetAudience : 'Solo founders launching B2B SaaS applications',
    companySize: partial?.companySize !== undefined ? partial.companySize : '1-5 employees',
    industry: partial?.industry !== undefined ? partial.industry : 'Software / SaaS',
    budgetRange: partial?.budgetRange !== undefined ? partial.budgetRange : '$50 - $300 / month',
    painPoints: partial?.painPoints !== undefined ? partial.painPoints : [
      'Context switching between multiple siloed tools',
      'Lack of clear execution roadmap and priority focus',
      'Overwhelmed by GTM distribution & customer acquisition'
    ],
    keyBenefits: partial?.keyBenefits || [
      'Unified AI-assisted founder dashboard',
      'Actionable step-by-step GTM roadmap execution',
      'Automated follow-ups & lead scoring'
    ],
    alternativeSolutions: partial?.alternativeSolutions || [
      'Manual spreadsheets (Excel/Google Sheets)',
      'Generic project tools (Notion/Trello/Jira)',
      'Multiple disconnected single-purpose SaaS subscriptions'
    ],
    decisionCriteria: partial?.decisionCriteria || [
      'Ease of use and immediate time-to-value',
      'Affordable transparent pricing with BYOK option',
      'All-in-one execution features'
    ],
    buyerRole: partial?.buyerRole || 'Founder / CEO / Solo Developer',
    createdAt: partial?.createdAt || now,
    updatedAt: partial?.updatedAt || now,
  };
}

/**
 * Validates an ICP profile for completeness and quality.
 */
export function validateICPProfile(profile: ICPProfile): ICPValidationResult {
  const missingFields: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!profile.name || profile.name.trim().length === 0) {
    missingFields.push('name');
    score -= 20;
  }
  if (!profile.targetAudience || profile.targetAudience.trim().length < 10) {
    missingFields.push('targetAudience');
    suggestions.push('Provide a more descriptive target audience (at least 10 characters).');
    score -= 20;
  }
  if (!profile.painPoints || profile.painPoints.length === 0) {
    missingFields.push('painPoints');
    suggestions.push('Add at least 2 distinct pain points your ICP experiences.');
    score -= 20;
  }
  if (!profile.keyBenefits || profile.keyBenefits.length === 0) {
    missingFields.push('keyBenefits');
    suggestions.push('Specify key benefits your solution provides to this target profile.');
    score -= 20;
  }
  if (!profile.alternativeSolutions || profile.alternativeSolutions.length === 0) {
    missingFields.push('alternativeSolutions');
    suggestions.push('Identify competitive alternatives current prospects use.');
    score -= 20;
  }

  score = Math.max(0, score);
  return {
    isValid: missingFields.length === 0,
    score,
    missingFields,
    suggestions,
  };
}

/**
 * Calculates how well a prospect match aligns with an ICP Profile.
 */
export function calculateICPFitScore(
  profile: ICPProfile,
  prospect: { role?: string; company?: string; notes?: string; tags?: string[] }
): number {
  let fitScore = 50; // Base score

  if (!prospect) return fitScore;

  // Role alignment check
  if (prospect.role && profile.buyerRole) {
    const roleLower = prospect.role.toLowerCase();
    const buyerRoleLower = profile.buyerRole.toLowerCase();
    if (buyerRoleLower.includes(roleLower) || roleLower.includes('founder') || roleLower.includes('ceo')) {
      fitScore += 20;
    }
  }

  // Tags alignment
  if (prospect.tags && prospect.tags.length > 0) {
    const matchedTags = prospect.tags.filter(t => 
      profile.targetAudience.toLowerCase().includes(t.toLowerCase()) ||
      profile.industry?.toLowerCase().includes(t.toLowerCase())
    );
    fitScore += Math.min(20, matchedTags.length * 10);
  }

  // Notes relevance check
  if (prospect.notes) {
    const notesLower = prospect.notes.toLowerCase();
    const matchesPainPoint = profile.painPoints.some(p => notesLower.includes(p.toLowerCase().slice(0, 10)));
    if (matchesPainPoint) fitScore += 10;
  }

  return Math.min(100, Math.max(0, fitScore));
}
