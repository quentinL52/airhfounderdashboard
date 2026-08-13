import { z } from 'zod';

/**
 * AGENTS.md Locked Decision D3:
 * Taxonomy agents: Exactly 5 roles.
 * Central: Barreur
 * Sub-agents: CFO, Growth, Research, Content
 * Legacy sub-agents (legal, recruiting, tech_lead, pm) remain deactivated.
 */
export const ACTIVE_AGENT_ROLES = ['barreur', 'cfo', 'growth', 'research', 'content'] as const;
export type ActiveAgentRole = typeof ACTIVE_AGENT_ROLES[number];
export type AgentId = ActiveAgentRole | string;

export const SUB_AGENT_ROLES = ['cfo', 'growth', 'research', 'content'] as const;
export type SubAgentRole = typeof SUB_AGENT_ROLES[number];

export type LegacySubAgentRole = 'pm' | 'legal' | 'tech_lead' | 'recruiting';
export type AllSubAgentRoles = SubAgentRole | LegacySubAgentRole;

export const AgentFrontmatterSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  name: z.string().min(1, 'Agent Name is required'),
  mission: z.string().min(1, 'Agent Mission is required'),
  domainsRead: z.array(z.string()).default([]),
  domainsWrite: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  defaultModel: z.string().default('gpt-4o'),
  guardrails: z.array(z.string()).default([]),
});

export type AgentFrontmatter = z.infer<typeof AgentFrontmatterSchema>;

export interface LoadedAgentConfig extends AgentFrontmatter {
  systemPrompt: string;
  filePath: string;
}

export type AgentStatus = 'idle' | 'running' | 'success' | 'partial' | 'failed' | 'needs_approval';

export interface AgentContext {
  userId: string;
  storeData?: Record<string, unknown>;
  userInstruction?: string;
  locale?: 'fr' | 'en';
}

export interface AgentResult<T = unknown> {
  agentId: string;
  status: AgentStatus;
  data?: T;
  rawResponse?: string;
  error?: string;
  executedAt: string;
  provider?: string;
  model?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface SubAgentDeliverable {
  title: string;
  type: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SubAgentContext {
  userId: string;
  taskObjective: string;
  context?: Record<string, any>;
  constraints?: {
    budget?: number;
    deadline?: string;
    allowedTools?: string[];
  };
  successCriteria?: string[];
}

export interface SubAgentResult {
  status: 'success' | 'partial' | 'failed' | 'needs_approval';
  deliverables: SubAgentDeliverable[];
  insights: string[];
  nextSteps: string[];
  tokensUsed: number;
  costUsd: number;
}

export interface AgentProposalDTO {
  id: string;
  userId: string;
  source: string;
  tabName: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, any>;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AgentTaskDTO {
  id: string;
  userId: string;
  taskId: string;
  agentRole: string;
  taskObjective: string;
  status: string;
  result?: Record<string, unknown> | null;
  errorMessage?: string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
}
