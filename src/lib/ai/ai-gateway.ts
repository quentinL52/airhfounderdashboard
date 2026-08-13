/**
 * @module AiGateway
 * @description Centralized AI Gateway infrastructure for Helmdash.
 * Enforces locked decisions from AGENTS.md:
 * - Metering (D1): Track AI actions in table `AiUsage` for Complete plan users; BYOK plan users are NEVER metered/counted against quota.
 * - BYOK (D1): Retrieve user API keys securely from encrypted `AiSettings` (server-side only, decrypted via `api-key-encryption.ts`).
 * - Decision D4 (Agent Write = Proposal): ALL database write operations requested or performed by an agent (Barreur or sub-agents) MUST be intercepted/wrapped into an `AgentProposal` pending user confirmation. NO direct database writes by agents without proposal wrapping.
 */

import { prisma } from '@/lib/prisma';
import { decryptApiKey, decryptAiSettings, DecryptedAiSettings } from '@/lib/ai/api-key-encryption';
import { checkAiLimit, incrementAiUsage } from '@/lib/ai/metering';
import { getProviderRegistry } from '@/lib/ai/provider-registry';
import type { ChatMessage, ChatOptions, ChatResponse, ProviderName } from '@/lib/ai/provider-interface';
import { validateTabData, TAB_SCHEMAS, TabName } from '@/lib/ai/tools/dashboard-tools';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';

export interface ProposalRequest {
  tabName: TabName | string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, any>;
  source?: string;
}

export interface ProposalResult {
  success: boolean;
  proposalId: string;
  message: string;
  proposal: any;
}

export class QuotaExceededError extends Error {
  constructor(message: string = 'AI usage limit exceeded for your current plan.') {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

export class AiGateway {
  /**
   * Retrieves and decrypts the user's AI settings from `AiSettings`.
   * Server-side only. Decrypts `apiKey` using `api-key-encryption.ts`.
   */
  async getDecryptedSettings(userId: string): Promise<DecryptedAiSettings> {
    const encryptedSettings = await prisma.aiSettings.findUnique({
      where: { userId },
    });
    return decryptAiSettings(encryptedSettings, userId);
  }

  /**
   * Resolves the API key for a specified provider for a given user.
   * Checks decrypted DB settings first, then falls back to environment variables.
   */
  async resolveApiKey(userId: string, provider: ProviderName): Promise<string | null> {
    const dbKey = await prisma.aiSettings.findUnique({
      where: { userId },
    });
    if (dbKey?.apiKey && dbKey.provider === provider) {
      return decryptApiKey(dbKey.apiKey, userId);
    }

    const envMap: Record<ProviderName, string[]> = {
      openai: ['AI_API_KEY', 'OPENAI_API_KEY'],
      anthropic: ['ANTHROPIC_API_KEY'],
      gemini: ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY'],
      mistral: ['MISTRAL_API_KEY'],
    };

    const envKeys = envMap[provider] || [];
    for (const envName of envKeys) {
      const val = process.env[envName];
      if (val && val !== 'TA_CLE_ICI') return val;
    }
    return null;
  }

  /**
   * Enforces Decision D1 (Pricing & Metering limits).
   * Checks whether the user is allowed to make AI calls based on their subscription plan.
   * Core plan (BYOK): allowed = true, remaining = Infinity (never blocked).
   * Complete plan: actions counted in `AiUsage` for current month against limit.
   * Throws `QuotaExceededError` if user on Complete plan has reached the limit.
   */
  async checkQuota(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const limitResult = await checkAiLimit(userId);
    if (!limitResult.allowed) {
      throw new QuotaExceededError();
    }
    return limitResult;
  }

  /**
   * Records AI usage in table `AiUsage` (metering).
   * Complete plan: metered/incremented in `AiUsage`.
   * Core plan (BYOK): NEVER metered / counted against quota in `AiUsage`.
   */
  async recordUsage(
    userId: string,
    options?: { scope?: string; model?: string; actions?: number; tokens?: number }
  ): Promise<void> {
    await incrementAiUsage(userId);
  }

  /**
   * Enforces Decision D4 (Agent Write = Proposal).
   * ALL database write operations requested or performed by an agent (Barreur or sub-agents)
   * MUST be intercepted/wrapped into an `AgentProposal` pending user confirmation.
   * NO direct database writes by agents without proposal wrapping.
   */
  async createProposal(userId: string, req: ProposalRequest): Promise<ProposalResult> {
    const { tabName, action, payload, source = 'agent' } = req;

    let validatedPayload = payload;
    try {
      if (tabName in TAB_SCHEMAS) {
        validatedPayload = validateTabData(tabName as TabName, payload);
      }
    } catch {
      // Keep payload as provided if unknown tab or non-standard payload
      validatedPayload = payload;
    }

    const proposal = await prisma.agentProposal.create({
      data: {
        userId,
        source,
        tabName,
        action,
        payload: validatedPayload,
        status: 'pending',
      },
    });

    return {
      success: true,
      proposalId: proposal.id,
      message: `Proposal '${action}' registered for tab '${tabName}'. Pending user confirmation.`,
      proposal,
    };
  }

  /**
   * Alias for createProposal to explicitly wrap agent write operations under Decision D4.
   */
  async wrapAgentWrite(userId: string, req: ProposalRequest): Promise<ProposalResult> {
    return this.createProposal(userId, req);
  }

  /**
   * Executes a multi-provider chat call, centralizing quota check, BYOK decryption, provider delegation, and metering.
   */
  async chat(
    userId: string,
    messages: ChatMessage[],
    options?: {
      provider?: ProviderName;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      scope?: string;
    }
  ): Promise<ChatResponse> {
    // 1. Quota check (D1)
    await this.checkQuota(userId);

    // 2. Resolve provider & model
    const decryptedSettings = await this.getDecryptedSettings(userId);
    const providerName: ProviderName = options?.provider || (decryptedSettings.provider as ProviderName) || 'openai';
    const model: string = options?.model || (decryptedSettings.modelsConfig?.defaultModel as string) || 'gpt-4o';

    // 3. Resolve API key (server-side decrypted)
    const apiKey = await this.resolveApiKey(userId, providerName);
    if (!apiKey) {
      throw new Error(`No API key configured for provider "${providerName}".`);
    }

    // 4. Delegate to provider registry
    const registry = getProviderRegistry();
    const providerInstance = registry.get(providerName);
    const response = await providerInstance.chat(messages, model, {
      apiKey,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens,
    });

    // 5. Record usage (Complete metered, Core/BYOK ignored)
    await this.recordUsage(userId, { scope: options?.scope || 'chat', model: response.model });

    return response;
  }

  /**
   * Returns a configured AI SDK LanguageModel instance using the user's decrypted BYOK key or fallback.
   */
  async getSDKModel(userId: string, providerName?: ProviderName, modelName?: string) {
    const settings = await this.getDecryptedSettings(userId);
    const provider: ProviderName = providerName || (settings.provider as ProviderName) || 'openai';
    const model = modelName || (settings.modelsConfig?.defaultModel as string) || 'gpt-4o';
    const apiKey = (await this.resolveApiKey(userId, provider)) || settings.apiKey || '';

    switch (provider) {
      case 'openai':
        return createOpenAI({ apiKey })(model);
      case 'anthropic':
        return createAnthropic({ apiKey })(model);
      case 'gemini':
        return createGoogleGenerativeAI({ apiKey })(model);
      case 'mistral':
        return createMistral({ apiKey })(model);
      default:
        return createOpenAI({ apiKey })(model);
    }
  }
}

export const aiGateway = new AiGateway();
