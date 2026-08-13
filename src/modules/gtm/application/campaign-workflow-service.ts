/**
 * Application service for GTM outreach campaign planning, content cadence, and launch workflows.
 * Modular Monolith Architecture - GTM Module (Application Layer)
 */

export interface CampaignStep {
  stepNumber: number;
  dayOffset: number; // Days from launch start
  channel: string;
  topic: string;
  actionType: 'email' | 'post' | 'message' | 'call';
}

export interface GeneratedContentIdea {
  title: string;
  channel: string;
  targetAudience: string;
  angle: string;
  callToAction: string;
}

export class CampaignWorkflowService {
  /**
   * Generates a 4-step outreach campaign sequence based on channel and target.
   */
  generateCampaignSequence(channel: string, targetAudience: string): CampaignStep[] {
    const primaryChannel = channel || 'LinkedIn & Email';

    return [
      {
        stepNumber: 1,
        dayOffset: 0,
        channel: primaryChannel,
        topic: `Initial Introduction & Pain Point Hook for ${targetAudience}`,
        actionType: 'email',
      },
      {
        stepNumber: 2,
        dayOffset: 3,
        channel: primaryChannel,
        topic: 'Sharing relevant case study / value demonstration post',
        actionType: 'message',
      },
      {
        stepNumber: 3,
        dayOffset: 7,
        channel: primaryChannel,
        topic: 'Follow-up with concise ROI summary & invitation to 15-min demo',
        actionType: 'email',
      },
      {
        stepNumber: 4,
        dayOffset: 14,
        channel: primaryChannel,
        topic: 'Breakup message & free resource link',
        actionType: 'message',
      },
    ];
  }

  /**
   * Generates content suggestions tailored to target segment and media channels.
   */
  suggestContentIdeas(channel: string, targetAudience: string): GeneratedContentIdea[] {
    const target = targetAudience || 'B2B Solo Founders';
    const mediaChannel = channel || 'LinkedIn & Blog';

    return [
      {
        title: `Why most ${target} fail to scale their GTM distribution on ${mediaChannel}`,
        channel: mediaChannel,
        targetAudience: target,
        angle: 'Educate on common distribution mistakes & provide actionable playbook',
        callToAction: 'Comment "GTM" to receive our step-by-step checklist',
      },
      {
        title: `How we saved 10+ hours a week managing our GTM pipeline`,
        channel: mediaChannel,
        targetAudience: target,
        angle: 'Behind the scenes case study / Build in Public update',
        callToAction: 'Check out the demo on Helmdash',
      },
      {
        title: `3 key metrics every ${target} must measure before launching`,
        channel: mediaChannel,
        targetAudience: target,
        angle: 'Actionable metrics breakdown (Waitlist, Conversion, MRR)',
        callToAction: 'Try our free GTM audit tool',
      },
    ];
  }
}
