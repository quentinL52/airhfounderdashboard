import { BaseSubAgent } from './base-agent';
import { getModelForAgent } from '@/lib/ai/provider-registry';
import { executeComposioTool } from '@/lib/integrations/composio-client';

export class ContentAgent extends BaseSubAgent {
  async execute(): Promise<any> {
    try {
      const prompt = `Tu es un Content Creator / Growth Marketer. Génère du contenu (LinkedIn, articles, newsletter, SEO).

OBJECTIF: ${this.taskObjective}

CONTEXTE: ${JSON.stringify(this.context, null, 2)}

CRITÈRES DE SUCCÈS:
${this.successCriteria.map((c) => `- ${c}`).join('\n')}

PRODUIS: Posts LinkedIn, articles blog, newsletter, calendrier éditorial, mots-clés SEO.`;

      const { generateText } = await import('ai');
      const model = getModelForAgent('content', null);

      const response = await generateText({
        model,
        prompt,
        temperature: 0.5,
        // @ts-ignore
        maxTokens: 5000,
      });

      await this.saveDeliverable({
        type: 'analysis_report',
        title: `Contenu: ${this.taskObjective}`,
        content: response.text,
        metadata: { docType: 'content', timestamp: new Date().toISOString() },
      });

      if (this.context?.publishToLinkedIn) {
        try {
          await executeComposioTool(
            'linkedin_send_message',
            {
              text: response.text,
            },
            this.userId
          );
        } catch (e) {
          console.warn('LinkedIn publish failed:', e);
        }
      }

      return this.buildResult('success');
    } catch (error) {
      this.logInsight(`Erreur Content: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.buildResult('failed');
    }
  }
}
