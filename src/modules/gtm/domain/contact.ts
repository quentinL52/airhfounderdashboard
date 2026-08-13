/**
 * Domain module for Contact and Lead models & scoring rules.
 * Modular Monolith Architecture - GTM Module (Domain Layer)
 */

export type ContactType = 'candidat' | 'entreprise' | 'investisseur' | 'école' | 'prospect' | 'partner';

export type ContactStatus = 
  | 'À contacter' 
  | 'En discussion' 
  | 'Qualifié' 
  | 'Client' 
  | 'Perdu';

export interface Interaction {
  id: string;
  contactId: string;
  type: 'note' | 'call' | 'email' | 'stage_change';
  content: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  type?: ContactType;
  role?: string;
  company?: string;
  email?: string;
  linkedin?: string;
  status: ContactStatus;
  pipelineStage?: string;
  lastContactDate: string; // ISO Date "YYYY-MM-DD"
  nextActionDate?: string; // ISO Date "YYYY-MM-DD"
  nextActionLabel?: string;
  nextAction?: string;
  lastInteractionAt?: string;
  waitingOn?: string;
  dealValue?: number;
  dormant?: boolean;
  notionId?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LeadScoreBreakdown {
  score: number; // 0 - 100
  tier: 'hot' | 'warm' | 'cold';
  reasons: string[];
}

/**
 * Calculates a lead score (0 - 100) and categorizes lead temperature.
 */
export function calculateLeadScore(contact: Contact, interactionCount: number = 0): LeadScoreBreakdown {
  let score = 30; // Base score for any contact
  const reasons: string[] = [];

  // Deal value points
  if (contact.dealValue && contact.dealValue > 0) {
    if (contact.dealValue >= 5000) {
      score += 25;
      reasons.push('High deal value (>= 5 000 €)');
    } else {
      score += 15;
      reasons.push(`Significant deal value (${contact.dealValue} €)`);
    }
  }

  // Status weight
  switch (contact.status) {
    case 'Client':
      score += 35;
      reasons.push('Active Customer');
      break;
    case 'Qualifié':
      score += 25;
      reasons.push('Qualified prospect');
      break;
    case 'En discussion':
      score += 15;
      reasons.push('In discussions');
      break;
    case 'À contacter':
      score += 5;
      break;
    case 'Perdu':
      score = 0;
      reasons.push('Lost lead');
      break;
  }

  // Recency penalty/bonus
  if (contact.lastContactDate) {
    const lastDate = new Date(contact.lastContactDate).getTime();
    const now = new Date().getTime();
    const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      score += 15;
      reasons.push('Contacted within the last 7 days');
    } else if (daysDiff > 30 && contact.status !== 'Client' && contact.status !== 'Perdu') {
      score -= 15;
      reasons.push(`Dormant for ${daysDiff} days`);
    }
  }

  // Contact details completeness
  if (contact.email) score += 5;
  if (contact.linkedin) score += 5;
  if (contact.company) score += 5;

  // Interaction engagement
  if (interactionCount > 3) {
    score += 10;
    reasons.push('High interaction history');
  }

  const finalScore = Math.min(100, Math.max(0, score));

  let tier: 'hot' | 'warm' | 'cold' = 'cold';
  if (finalScore >= 70) tier = 'hot';
  else if (finalScore >= 45) tier = 'warm';

  return {
    score: finalScore,
    tier,
    reasons,
  };
}
