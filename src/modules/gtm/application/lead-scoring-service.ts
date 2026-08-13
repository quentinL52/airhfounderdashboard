/**
 * Application service for lead scoring, pipeline health analysis, and follow-up generation.
 * Modular Monolith Architecture - GTM Module (Application Layer)
 */

import { Contact, calculateLeadScore, LeadScoreBreakdown } from '../domain/contact';

export interface ScoredContact extends Contact {
  leadScore: LeadScoreBreakdown;
  needsFollowUp: boolean;
}

export interface PipelineSummary {
  totalContacts: number;
  byStatus: Record<string, number>;
  hotLeadsCount: number;
  warmLeadsCount: number;
  coldLeadsCount: number;
  totalDealValue: number;
  dormantContactsCount: number;
}

export class LeadScoringService {
  /**
   * Scores an individual contact using domain lead scoring logic.
   */
  scoreContact(contact: Contact, interactionCount: number = 0): ScoredContact {
    const leadScore = calculateLeadScore(contact, interactionCount);

    // Determine if follow-up is needed
    let needsFollowUp = false;
    if (contact.status === 'À contacter' || contact.status === 'En discussion' || contact.status === 'Qualifié') {
      if (contact.nextActionDate) {
        const nextDate = new Date(contact.nextActionDate).getTime();
        const now = new Date().getTime();
        if (nextDate <= now) {
          needsFollowUp = true;
        }
      } else if (contact.lastContactDate) {
        const lastDate = new Date(contact.lastContactDate).getTime();
        const now = new Date().getTime();
        const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 7) {
          needsFollowUp = true;
        }
      }
    }

    return {
      ...contact,
      leadScore,
      needsFollowUp,
    };
  }

  /**
   * Evaluates pipeline health and calculates aggregate statistics across contacts.
   */
  analyzePipeline(contacts: Contact[]): PipelineSummary {
    const byStatus: Record<string, number> = {
      'À contacter': 0,
      'En discussion': 0,
      'Qualifié': 0,
      'Client': 0,
      'Perdu': 0,
    };

    let hotLeadsCount = 0;
    let warmLeadsCount = 0;
    let coldLeadsCount = 0;
    let totalDealValue = 0;
    let dormantContactsCount = 0;

    for (const c of contacts) {
      // Status counting
      if (byStatus[c.status] !== undefined) {
        byStatus[c.status] += 1;
      } else {
        byStatus[c.status] = 1;
      }

      // Deal value sum
      if (c.dealValue && c.status !== 'Perdu') {
        totalDealValue += c.dealValue;
      }

      // Dormant counting
      if (c.dormant) {
        dormantContactsCount += 1;
      }

      // Lead scoring
      const scoreResult = calculateLeadScore(c);
      if (scoreResult.tier === 'hot') hotLeadsCount += 1;
      else if (scoreResult.tier === 'warm') warmLeadsCount += 1;
      else coldLeadsCount += 1;
    }

    return {
      totalContacts: contacts.length,
      byStatus,
      hotLeadsCount,
      warmLeadsCount,
      coldLeadsCount,
      totalDealValue,
      dormantContactsCount,
    };
  }

  /**
   * Generates a structured follow-up prompt/template for a contact.
   */
  buildFollowUpPrompt(contact: Contact): string {
    const roleStr = contact.role ? ` (${contact.role})` : '';
    const companyStr = contact.company ? ` at ${contact.company}` : '';
    const notesStr = contact.notes ? `\nNotes: ${contact.notes}` : '';

    return `Generate a polite, personalized outreach follow-up email for ${contact.name}${roleStr}${companyStr}.
Current status: ${contact.status}.
Last contacted date: ${contact.lastContactDate}.${notesStr}
Goal: Reactivate conversation and schedule a 15-minute quick feedback call.`;
  }
}
