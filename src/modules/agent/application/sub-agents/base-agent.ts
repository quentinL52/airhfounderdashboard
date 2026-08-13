import { memory } from '@/lib/ai/memory/obsidian-memory';
import { SubAgentContext, SubAgentResult } from '../../domain/types';

export interface Deliverable {
  type: 'linear_ticket' | 'notion_doc' | 'github_issue' | 'email_draft' | 'analysis_report' | 'code_snippet' | 'financial_model';
  title: string;
  content: string;
  metadata?: Record<string, any>;
  externalId?: string;
}

export interface SubAgentTask {
  agentRole: string;
  taskObjective: string;
  context?: Record<string, any>;
  priority: 'high' | 'medium' | 'low';
}

export abstract class BaseSubAgent {
  protected userId: string;
  protected taskObjective: string;
  protected context: Record<string, any>;
  protected constraints: SubAgentContext['constraints'];
  protected successCriteria: string[];
  protected deliverables: Deliverable[] = [];
  protected insights: string[] = [];
  protected tokensUsed = 0;
  protected costUsd = 0;

  constructor(context: SubAgentContext) {
    this.userId = context.userId;
    this.taskObjective = context.taskObjective;
    this.context = context.context || {};
    this.constraints = context.constraints || {};
    this.successCriteria = context.successCriteria || [];
  }

  abstract execute(): Promise<SubAgentResult>;

  protected async saveDeliverable(deliverable: Deliverable): Promise<void> {
    this.deliverables.push(deliverable);

    await memory.upsertNote({
      userId: this.userId,
      content: `Livrable ${deliverable.type}: ${deliverable.title}\n${deliverable.content}`,
      type: 'decision',
      tags: ['sub-agent-deliverable', deliverable.type],
      source: 'agent',
    });
  }

  protected async createLinearTicket(title: string, description: string, labels?: string[]): Promise<string> {
    const externalId = `LINEAR-${Date.now()}`;
    await this.saveDeliverable({
      type: 'linear_ticket',
      title,
      content: description,
      metadata: { labels },
      externalId,
    });
    return externalId;
  }

  protected async createNotionDoc(title: string, content: string, parentId?: string): Promise<string> {
    const externalId = `NOTION-${Date.now()}`;
    await this.saveDeliverable({
      type: 'notion_doc',
      title,
      content,
      metadata: { parentId },
      externalId,
    });
    return externalId;
  }

  protected async createGitHubIssue(title: string, body: string, repo: string, labels?: string[]): Promise<string> {
    const externalId = `GH-${Date.now()}`;
    await this.saveDeliverable({
      type: 'github_issue',
      title,
      content: body,
      metadata: { repo, labels },
      externalId,
    });
    return externalId;
  }

  protected async draftEmail(to: string, subject: string, body: string): Promise<void> {
    await this.saveDeliverable({
      type: 'email_draft',
      title: subject,
      content: `To: ${to}\n\n${body}`,
      metadata: { to },
    });
  }

  protected async writeAnalysisReport(title: string, sections: Record<string, string>): Promise<void> {
    const content = Object.entries(sections)
      .map(([heading, content]) => `## ${heading}\n\n${content}`)
      .join('\n\n');

    await this.saveDeliverable({
      type: 'analysis_report',
      title,
      content,
    });
  }

  protected logInsight(insight: string): void {
    this.insights.push(insight);
  }

  protected buildResult(status: SubAgentResult['status']): SubAgentResult {
    return {
      status,
      deliverables: this.deliverables,
      insights: this.insights,
      nextSteps: [],
      tokensUsed: this.tokensUsed,
      costUsd: this.costUsd,
    };
  }
}
