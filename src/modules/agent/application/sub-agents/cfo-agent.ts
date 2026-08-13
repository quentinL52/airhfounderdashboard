import { BaseSubAgent } from './base-agent';
import { getModelForAgent } from '@/lib/ai/provider-registry';
import { prisma } from '@/lib/prisma';

export class CFOAgent extends BaseSubAgent {
  async execute(): Promise<any> {
    try {
      const financialData = await this.gatherFinancialData();
      const analysis = await this.performFinancialAnalysis(financialData);
      await this.generateDeliverables(analysis, financialData);

      return this.buildResult('success');
    } catch (error) {
      this.logInsight(`Erreur CFO: ${error instanceof Error ? error.message : 'Unknown'}`);
      return this.buildResult('failed');
    }
  }

  private async gatherFinancialData(): Promise<any> {
    const [finances, settings, stripeData] = await Promise.all([
      prisma.monthlyFinance.findMany({
        where: { userId: this.userId },
        orderBy: { month: 'desc' },
        take: 24,
        include: { entries: true },
      }),
      prisma.financeSettings.findUnique({ where: { userId: this.userId } }),
      this.fetchStripeData(),
    ]);

    return { finances, settings, stripeData };
  }

  private async fetchStripeData(): Promise<any> {
    try {
      const { stripe } = await import('@/lib/billing/stripe-client');
      const user = await prisma.user.findUnique({ where: { id: this.userId }, select: { stripeCustomerId: true } });
      if (!user?.stripeCustomerId) return null;

      const [subscriptions, invoices] = await Promise.all([
        stripe.subscriptions.list({ customer: user.stripeCustomerId, status: 'active' }),
        stripe.invoices.list({ customer: user.stripeCustomerId, status: 'paid', limit: 50 }),
      ]);

      return { subscriptions: subscriptions.data, invoices: invoices.data };
    } catch {
      return null;
    }
  }

  private async performFinancialAnalysis(data: any): Promise<any> {
    const prompt = `Tu es un CFO expérimenté pour startup early-stage. Analyse ces données financières.

DONNÉES FINANCIÈRES (24 derniers mois):
${JSON.stringify(data.finances, null, 2)}

SETTINGS:
${JSON.stringify(data.settings, null, 2)}

STRIPE (si dispo):
${JSON.stringify(data.stripeData, null, 2)}

OBJECTIF: ${this.taskObjective}

CRITÈRES DE SUCCÈS:
${this.successCriteria.map((c) => `- ${c}`).join('\n')}

PRODUIS UNE ANALYSE JSON STRUCTURÉE:
{
  "runwayMonths": number,
  "burnRate": number,
  "mrr": number,
  "arr": number,
  "cashFlowTrend": "improving|stable|degrading",
  "scenarios": {
    "conservative": { "runwayMonths": number, "assumptions": [] },
    "base": { "runwayMonths": number, "assumptions": [] },
    "optimistic": { "runwayMonths": number, "assumptions": [] }
  },
  "alerts": ["alerte 1", "alerte 2"],
  "recommendations": ["action 1", "action 2"],
  "keyMetrics": { "ltv": number, "cac": number, "ltv_cac_ratio": number }
}`;

    const { generateText } = await import('ai');
    const model = getModelForAgent('cfo', null);

    const response = await generateText({
      model,
      prompt,
      temperature: 0.1,
      // @ts-ignore
      maxTokens: 5000,
    });

    try {
      return JSON.parse(response.text);
    } catch {
      return { error: 'Parse failed', raw: response.text };
    }
  }

  private async generateDeliverables(analysis: any, data: any): Promise<void> {
    await this.saveDeliverable({
      type: 'financial_model',
      title: `Financial Analysis: ${this.taskObjective}`,
      content: this.formatFinancialReport(analysis, data),
      metadata: { analysis, timestamp: new Date().toISOString() },
    });

    if (analysis.runwayMonths && analysis.runwayMonths < 3) {
      await this.saveDeliverable({
        type: 'analysis_report',
        title: '⚠️ ALERTE RUNWAY CRITIQUE',
        content: `Runway: ${analysis.runwayMonths} mois. Actions urgentes requises:\n${analysis.recommendations?.map((r: string) => `- ${r}`).join('\n')}`,
        metadata: { priority: 'critical', runwayMonths: analysis.runwayMonths },
      });
    }
  }

  private formatFinancialReport(analysis: any, _data: any): string {
    return `# Analyse Financière - ${new Date().toLocaleDateString('fr-FR')}

## Vue d'Ensemble
- **Runway**: ${analysis.runwayMonths || 'N/A'} mois
- **Burn Rate**: €${analysis.burnRate?.toLocaleString() || 'N/A'}/mois
- **MRR**: €${analysis.mrr?.toLocaleString() || 'N/A'}
- **ARR**: €${analysis.arr?.toLocaleString() || 'N/A'}
- **Trend Trésorerie**: ${analysis.cashFlowTrend || 'N/A'}

## Scénarios
| Scénario | Runway | Hypothèses |
|----------|--------|------------|
| Conservateur | ${analysis.scenarios?.conservative?.runwayMonths || 'N/A'} mois | ${analysis.scenarios?.conservative?.assumptions?.join(', ') || 'N/A'} |
| Base | ${analysis.scenarios?.base?.runwayMonths || 'N/A'} mois | ${analysis.scenarios?.base?.assumptions?.join(', ') || 'N/A'} |
| Optimiste | ${analysis.scenarios?.optimistic?.runwayMonths || 'N/A'} mois | ${analysis.scenarios?.optimistic?.assumptions?.join(', ') || 'N/A'} |

## Alertes
${analysis.alerts?.map((a: string) => `- ⚠️ ${a}`).join('\n') || 'Aucune'}

## Recommandations
${analysis.recommendations?.map((r: string) => `- ✅ ${r}`).join('\n') || 'Aucune'}

---
*Généré par CFO Agent - ${this.taskObjective}*`;
  }
}
