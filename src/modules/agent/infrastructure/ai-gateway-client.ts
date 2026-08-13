/**
 * Infrastructure integration with AiGateway.
 * Ensures strict compliance with AGENTS.md locked decisions:
 * - Decision D1: Metering & BYOK handling.
 * - Decision D4: All agent database writes MUST use AgentProposal.
 */
import { aiGateway, QuotaExceededError, ProposalRequest, ProposalResult } from '@/lib/ai/ai-gateway';

export class AgentAiGatewayClient {
  /**
   * Checks if user has available AI quota based on pricing plan (D1).
   */
  async checkQuota(userId: string) {
    return aiGateway.checkQuota(userId);
  }

  /**
   * Records AI usage (metering) for Complete plan users (D1).
   */
  async recordUsage(userId: string, options?: { scope?: string; model?: string; actions?: number; tokens?: number }) {
    return aiGateway.recordUsage(userId, options);
  }

  /**
   * Enforces Decision D4: Agent Write = Proposal.
   * Wraps all write actions requested by agents into an AgentProposal.
   */
  async createProposal(userId: string, req: ProposalRequest): Promise<ProposalResult> {
    return aiGateway.createProposal(userId, req);
  }

  /**
   * Decrypts AI settings for server-side execution (BYOK - D1).
   */
  async getDecryptedSettings(userId: string) {
    return aiGateway.getDecryptedSettings(userId);
  }

  /**
   * Resolves configured API key for a provider.
   */
  async resolveApiKey(userId: string, provider: any) {
    return aiGateway.resolveApiKey(userId, provider);
  }

  /**
   * Retrieves an AI SDK LanguageModel instance using BYOK or default config.
   */
  async getSDKModel(userId: string, providerName?: any, modelName?: string) {
    return aiGateway.getSDKModel(userId, providerName, modelName);
  }
}

export const agentAiGatewayClient = new AgentAiGatewayClient();
export { QuotaExceededError };
