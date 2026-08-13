import { BaseSubAgent } from './sub-agents/base-agent';
import { ResearchAgent } from './sub-agents/research-agent';
import { CFOAgent } from './sub-agents/cfo-agent';
import { GrowthAgent } from './sub-agents/growth-agent';
import { ContentAgent } from './sub-agents/content-agent';
import { SubAgentContext, SubAgentResult, SubAgentRole, SUB_AGENT_ROLES } from '../domain/types';
import { prisma } from '@/lib/prisma';

export const ACTIVE_SUB_AGENT_ROLES: SubAgentRole[] = ['research', 'cfo', 'growth', 'content'];

export const SUB_AGENT_CONFIG: Record<SubAgentRole, {
  name: string;
  description: string;
  tools: string[];
  defaultModel: string;
  maxTokens: number;
  temperature: number;
}> = {
  research: {
    name: 'Research Scientist',
    description: 'Analyse de marché profonde, validation hypothèses, veille concurrentielle, recherche académique',
    tools: ['web_search', 'deep_research', 'query_memory', 'write_memory', 'academic_search', 'extract_entities'],
    defaultModel: 'gpt-4o',
    maxTokens: 8000,
    temperature: 0.3,
  },
  cfo: {
    name: 'CFO Agent',
    description: 'Forecasting Monte Carlo, scénarios financiers, export comptable, optimisation fiscale, runway',
    tools: ['read_dashboard_tab', 'write_dashboard_tab', 'stripe_sync', 'runway_calculator', 'scenario_modeling', 'tax_optimizer'],
    defaultModel: 'gpt-4o',
    maxTokens: 8000,
    temperature: 0.1,
  },
  growth: {
    name: 'Growth Operator',
    description: 'Outbound sequences, content calendar, funnel analysis, A/B test design, referral programs',
    tools: ['read_dashboard_tab', 'write_dashboard_tab', 'apollo_sequence', 'linkedin_post', 'email_campaign', 'funnel_analysis', 'ab_test_design'],
    defaultModel: 'gpt-4o',
    maxTokens: 8000,
    temperature: 0.4,
  },
  content: {
    name: 'Content Creator',
    description: 'Posts LinkedIn, articles, newsletter, repurposing, calendrier éditorial, SEO',
    tools: ['read_dashboard_tab', 'write_dashboard_tab', 'generate_post', 'write_article', 'newsletter_draft', 'repurpose_content', 'seo_optimize'],
    defaultModel: 'gpt-4o',
    maxTokens: 8000,
    temperature: 0.5,
  },
};

export class SubAgentRegistry {
  async spawn(role: string, context: SubAgentContext): Promise<SubAgentResult> {
    if (!ACTIVE_SUB_AGENT_ROLES.includes(role as SubAgentRole)) {
      throw new Error(`Sub-agent role "${role}" is deactivated per AGENTS.md Decision D3.`);
    }

    await this.checkPermissions(context.userId, role as SubAgentRole);

    const agent = await this.instantiateAgent(role as SubAgentRole, context);
    const startTime = Date.now();

    try {
      const result = await agent.execute();
      console.log(`[SubAgent:${role}] Completed in ${Date.now() - startTime}ms`, {
        status: result.status,
        deliverables: result.deliverables.length,
        tokens: result.tokensUsed,
        cost: result.costUsd,
      });

      return result;
    } catch (error) {
      console.error(`[SubAgent:${role}] Failed:`, error);
      return {
        status: 'failed',
        deliverables: [],
        insights: [`Erreur: ${error instanceof Error ? error.message : 'Unknown'}`],
        nextSteps: [],
        tokensUsed: 0,
        costUsd: 0,
      };
    }
  }

  private async checkPermissions(userId: string, _role: SubAgentRole): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planStatus: true },
    });

    if (!user || user.planStatus === 'readonly') {
      throw new Error('Active subscription required to use agents');
    }
  }

  private async instantiateAgent(role: SubAgentRole, context: SubAgentContext): Promise<BaseSubAgent> {
    const userConfig = await this.getUserConfig(context.userId);

    switch (role) {
      case 'research':
        return new ResearchAgent(context, userConfig);
      case 'cfo':
        return new CFOAgent(context);
      case 'growth':
        return new GrowthAgent(context);
      case 'content':
        return new ContentAgent(context);
      default:
        throw new Error(`Sub-agent role "${role}" is deactivated per Decision D3.`);
    }
  }

  private async getUserConfig(userId: string): Promise<any> {
    try {
      const settings = await prisma.aiSettings.findUnique({ where: { userId } });
      return settings?.modelsConfig || null;
    } catch {
      return null;
    }
  }

  getConfig(role: SubAgentRole) {
    return SUB_AGENT_CONFIG[role];
  }

  getAllRoles(): SubAgentRole[] {
    return [...ACTIVE_SUB_AGENT_ROLES];
  }
}

export const subAgentRegistry = new SubAgentRegistry();
