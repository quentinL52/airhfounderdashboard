import { registerAgent } from '../agent-orchestrator';
import type { AgentContext, AgentDefinition } from '../agent-orchestrator';

export interface ContentSuggestion {
  /** Titre du contenu */
  title: string;
  /** Type de contenu */
  type: 'linkedin-post' | 'twitter-thread' | 'blog-article' | 'newsletter' | 'landing-copy';
  /** Hook d'accroche (première ligne) */
  hook: string;
  /** Contenu complet brouillon */
  draft: string;
  /** Hashtags suggérés */
  hashtags: string[];
  /** CTA (call to action) */
  cta: string;
  /** Score d'engagement estimé (1-10) */
  engagementScore: number;
  /** Framework utilisé (AIDA, PAS, Hero-Guide, etc.) */
  framework: string;
}

export interface ContentCreatorResult {
  suggestions: ContentSuggestion[];
  contentCalendar: { day: string; topic: string; type: string }[];
  trendingTopics: string[];
}

const contentCreatorAgent: AgentDefinition = {
  id: 'content-creator',
  name: 'Content Creator',
  nameFr: 'Créateur de Contenu',
  description: 'Generates marketing content and strategies',
  descriptionFr: 'Génère du contenu marketing et stratégique',
  emoji: '✍️',
  primaryModule: 'content',

  buildSystemPrompt: (context: AgentContext) => {
    const data = context.storeData || {};
    const founderProfile = data.founderProfile as { writingStyleContext?: string; displayName?: string; niche?: string } || {};

    const writingStyleBlock = founderProfile.writingStyleContext
      ? `\n\nCRITICAL - WRITING STYLE CLONING:\nThe founder has provided examples of their personal writing style below. You MUST replicate this exact tone, sentence structure, formatting, and voice in ALL generated content. Do not deviate from this style.\n\n--- FOUNDER'S STYLE ---\n${founderProfile.writingStyleContext}\n--- END STYLE ---`
      : '';

    const nicheBlock = founderProfile.niche
      ? `\nThe founder operates in the following niche/sector: ${founderProfile.niche}. Tailor all content to this audience.`
      : '';

    return `You are an elite Digital Marketing Expert and Copywriter specialized in early-stage startups.
Your goal is to generate high-converting, engaging content for the founder based on their startup's context.

Use proven copywriting frameworks such as AIDA (Attention, Interest, Desire, Action), PAS (Problem, Agitate, Solve), or Hero-Guide.
Ensure the content is tailored to the provided target audience and messaging.
${nicheBlock}${writingStyleBlock}

RULES:
1. Provide 3 to 5 content suggestions varying in type (e.g., LinkedIn post, Twitter thread, Newsletter).
2. Create a 7-day content calendar.
3. Identify 3 trending topics relevant to the startup's niche.
4. Always return your response as a valid JSON object matching the requested schema. Do not include markdown formatting or text outside the JSON.

${context.locale === 'fr' ? 'IMPORTANT: You must write all generated content and text in FRENCH.' : 'Write all generated content and text in ENGLISH.'}

Return ONLY valid JSON matching this schema:
{
  "suggestions": [
    {
      "title": string,
      "type": "linkedin-post" | "twitter-thread" | "blog-article" | "newsletter" | "landing-copy",
      "hook": string,
      "draft": string,
      "hashtags": string[],
      "cta": string,
      "engagementScore": number (1-10),
      "framework": string
    }
  ],
  "contentCalendar": [
    { "day": string, "topic": string, "type": string }
  ],
  "trendingTopics": string[]
}`;
  },

  buildUserMessage: (context: AgentContext) => {
    const data = context.storeData || {};
    const leanCanvas = data.leanCanvas as Record<string, string> || {};
    const goToMarket = data.goToMarket as { sbHero?: string; sbProblem?: string; ompTarget?: string; ompMessage?: string } || {};
    const existingContent = data.existingContent as { title: string; type: string }[] || [];
    const founderProfile = data.founderProfile as { displayName?: string; linkedinUrl?: string; niche?: string } || {};

    return `Here is my startup context:

[Founder Profile]
- Name: ${founderProfile.displayName || 'Not specified'}
- LinkedIn: ${founderProfile.linkedinUrl || 'Not provided'}
- Niche: ${founderProfile.niche || 'Not specified'}

[Lean Canvas]
- Problem: ${leanCanvas.problem || 'Not defined'}
- Solution: ${leanCanvas.solution || 'Not defined'}
- Unique Value Proposition: ${leanCanvas.uniqueValueProposition || 'Not defined'}
- Channels: ${leanCanvas.channels || 'Not defined'}

[Go-To-Market]
- Target Audience: ${goToMarket.ompTarget || 'Not defined'}
- Core Message: ${goToMarket.ompMessage || 'Not defined'}
- Customer Hero: ${goToMarket.sbHero || 'Not defined'}
- Customer Problem: ${goToMarket.sbProblem || 'Not defined'}

[Existing Content Themes]
${existingContent.length > 0 ? existingContent.map(c => `- ${c.title} (${c.type})`).join('\n') : 'None yet.'}

${context.userInstruction ? `\nSpecific Instruction from founder: ${context.userInstruction}\n` : ''}

Based on this context, please generate content suggestions, a 7-day calendar, and trending topics in JSON format.`;
  },

  parseResponse: (raw: string): ContentCreatorResult => {
    try {
      const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      return JSON.parse(cleaned) as ContentCreatorResult;
    } catch (error) {
      console.error('[ContentCreator] Failed to parse JSON:', raw);
      throw new Error('Failed to parse content creator response into JSON.');
    }
  }
};

// Auto-register
registerAgent(contentCreatorAgent);
