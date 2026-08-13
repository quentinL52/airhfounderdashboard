import type { ChatMessage, ChatOptions, ProviderName } from '@/lib/ai/provider-interface';
import { getProviderRegistry } from '@/lib/ai/provider-registry';
import { AgentId, AgentStatus, AgentContext, AgentResult } from '../domain/types';

export interface AgentDefinition {
  id: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  emoji: string;
  primaryModule: string;
  buildSystemPrompt: (context: AgentContext) => string;
  buildUserMessage: (context: AgentContext) => string;
  parseResponse: (raw: string) => unknown;
}

const agentRegistry = new Map<string, AgentDefinition>();

export function registerAgent(definition: AgentDefinition): void {
  if (agentRegistry.has(definition.id)) {
    console.warn(`[AgentOrchestrator] Agent ${definition.id} is already registered.`);
    return;
  }
  agentRegistry.set(definition.id, definition);
}

export function getAgent(id: string): AgentDefinition {
  const agent = agentRegistry.get(id);
  if (!agent) {
    throw new Error(`[AgentOrchestrator] Agent ${id} not found.`);
  }
  return agent;
}

export function getAllAgents(): AgentDefinition[] {
  return Array.from(agentRegistry.values());
}

export function getAgentSummaries() {
  return getAllAgents().map(agent => ({
    id: agent.id,
    name: agent.name,
    nameFr: agent.nameFr,
    description: agent.description,
    descriptionFr: agent.descriptionFr,
    emoji: agent.emoji,
    primaryModule: agent.primaryModule,
  }));
}

export async function executeAgent<T = unknown>(
  agentId: string,
  context: AgentContext,
  settings: { provider: ProviderName; model: string },
  options?: ChatOptions
): Promise<AgentResult<T>> {
  try {
    const agent = getAgent(agentId);
    const registry = getProviderRegistry();
    const provider = registry.get(settings.provider);

    const systemPrompt = agent.buildSystemPrompt(context);
    const userMessage = agent.buildUserMessage(context);

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    const response = await provider.chat(messages, settings.model, {
      ...options,
      systemPrompt: undefined,
    });

    let parsedData: unknown;
    try {
      parsedData = agent.parseResponse(response.content);
    } catch (parseError) {
      console.error(`[AgentOrchestrator] Failed to parse response from ${agentId}:`, parseError);
      return {
        agentId,
        status: 'failed',
        error: 'Failed to parse AI response.',
        rawResponse: response.content,
        executedAt: new Date().toISOString(),
        provider: settings.provider,
        model: settings.model,
        usage: response.usage,
      };
    }

    return {
      agentId,
      status: 'success',
      data: parsedData as T,
      rawResponse: response.content,
      executedAt: new Date().toISOString(),
      provider: settings.provider,
      model: settings.model,
      usage: response.usage,
    };
  } catch (error) {
    console.error(`[AgentOrchestrator] Execution failed for ${agentId}:`, error);
    return {
      agentId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      executedAt: new Date().toISOString(),
      provider: settings.provider,
      model: settings.model,
    };
  }
}
