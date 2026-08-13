import { BaseSubAgent } from './base-agent';
import { getModelForAgent } from '@/lib/ai/provider-registry';
import { agentAiGatewayClient } from '../../infrastructure/ai-gateway-client';
import { prisma } from '@/lib/prisma';

export class GrowthAgent extends BaseSubAgent {
  async execute(): Promise<any> {
    try {
      const growthData = await this.gatherGrowthData();
      const strategy = await this.generateGrowthStrategy(growthData);
      await this.createDeliverables(strategy);

      return this.buildResult('success');
    } catch (error) {
      this.logInsight(`Erreur Growth: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.buildResult('failed');
    }
  }

  private async gatherGrowthData(): Promise<any> {
    const [contacts, hypotheses, gtm] = await Promise.all([
      prisma.contact.findMany({ where: { userId: this.userId }, take: 100 }),
      prisma.hypothesis.findMany({
        where: { userId: this.userId, category: { in: ['channel', 'revenue'] } },
        take: 20,
      }),
      prisma.gtmStrategy.findUnique({ where: { userId: this.userId } }),
    ]);

    return { contacts, hypotheses, gtm };
  }

  private async generateGrowthStrategy(data: any): Promise<any> {
    const prompt = `Tu es un Growth Lead expert pour startup early-stage. Analyse et propose un plan de croissance.

DONNÉES ACTUELLES:
Contacts CRM: ${data.contacts.length} (${data.contacts.filter((c: any) => c.status === 'client').length} clients)
Hypothèses Channel/Revenue: ${data.hypotheses.map((h: any) => h.statement).join('; ')}
GTM Strategy: ${JSON.stringify(data.gtm)}

OBJECTIF: ${this.taskObjective}

CRITÈRES DE SUCCÈS:
${this.successCriteria.map((c) => `- ${c}`).join('\n')}

PRODUIS UN PLAN JSON:
{
  "funnelAnalysis": { "awareness": number, "consideration": number, "conversion": number, "retention": number },
  "channelStrategy": [
    { "channel": "SEO|Content|Outbound|Paid|Referral|Partnerships", "priority": "high|medium|low", "actions": [], "kpis": [], "budget": number }
  ],
  "experiments": [
    { "name": "", "hypothesis": "", "variant": "", "metric": "", "duration": "2 weeks", "effort": "S|M|L" }
  ],
  "contentCalendar": [
    { "week": "2024-WXX", "topic": "", "format": "LinkedIn|Blog|Newsletter|Video", "channel": "", "status": "planned" }
  ],
  "kpis": { "targetCAC": number, "targetLTV": number, "targetConversion": number }
}`;

    const { generateText } = await import('ai');
    const model = getModelForAgent('growth', null);

    const response = await generateText({
      model,
      prompt,
      temperature: 0.4,
      // @ts-ignore
      maxTokens: 5000,
    });

    try {
      return JSON.parse(response.text);
    } catch {
      return { raw: response.text, error: 'Parse failed' };
    }
  }

  private async createDeliverables(strategy: any): Promise<void> {
    await this.saveDeliverable({
      type: 'analysis_report',
      title: `Growth Strategy: ${this.taskObjective}`,
      content: this.formatGrowthReport(strategy),
      metadata: { strategy, timestamp: new Date().toISOString() },
    });

    if (strategy.experiments && Array.isArray(strategy.experiments)) {
      for (const exp of strategy.experiments) {
        await this.createHypothesisProposal(exp);
      }
    }
  }

  private async createHypothesisProposal(exp: any): Promise<void> {
    try {
      await agentAiGatewayClient.createProposal(this.userId, {
        tabName: 'hypotheses',
        action: 'create',
        source: 'sub-agent-growth',
        payload: {
          statement: exp.hypothesis || exp.name || 'Growth Hypothesis',
          category: 'channel',
          riskLevel: 'medium',
          testMethod: `A/B Test: ${exp.variant || 'Default'}`,
          successCriteria: exp.metric || 'Signups',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'draft',
        },
      });
    } catch (error) {
      console.error('Failed to create hypothesis proposal:', error);
    }
  }

  private formatGrowthReport(strategy: any): string {
    return `# Stratégie Growth - ${new Date().toLocaleDateString('fr-FR')}

## Analyse Funnel
- **Awareness**: ${strategy.funnelAnalysis?.awareness || 'N/A'}%
- **Consideration**: ${strategy.funnelAnalysis?.consideration || 'N/A'}%
- **Conversion**: ${strategy.funnelAnalysis?.conversion || 'N/A'}%
- **Retention**: ${strategy.funnelAnalysis?.retention || 'N/A'}%

## Stratégie Canaux
${strategy.channelStrategy?.map((c: any) => `
### ${c.channel} (${c.priority})
- Actions: ${c.actions?.join(', ') || 'N/A'}
- KPIs: ${c.kpis?.join(', ') || 'N/A'}
- Budget: €${c.budget || 0}
`).join('\n') || 'N/A'}

## Expériences Planifiées
${strategy.experiments?.map((e: any, i: number) => `
${i + 1}. **${e.name}**
   - Hypothèse: ${e.hypothesis}
   - Variante: ${e.variant}
   - Métrique: ${e.metric}
   - Durée: ${e.duration}
   - Effort: ${e.effort}
`).join('\n') || 'Aucune'}

---
*Généré par Growth Agent - ${this.taskObjective}*`;
  }
}
