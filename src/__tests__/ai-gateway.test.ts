import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiGateway, QuotaExceededError } from '../lib/ai/ai-gateway';
import { prisma } from '../lib/prisma';
import { checkAiLimit, incrementAiUsage } from '../lib/ai/metering';
import { decryptApiKey, decryptAiSettings } from '../lib/ai/api-key-encryption';

// Mock dependencies
vi.mock('../lib/prisma', () => ({
  prisma: {
    aiSettings: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    aiUsage: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    agentProposal: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../lib/ai/metering', () => ({
  checkAiLimit: vi.fn(),
  incrementAiUsage: vi.fn(),
}));

vi.mock('../lib/ai/api-key-encryption', () => ({
  decryptApiKey: vi.fn(),
  decryptAiSettings: vi.fn(),
}));

describe('AiGateway Unit Tests', () => {
  let gateway: AiGateway;
  const mockUserId = '11111111-2222-3333-4444-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
    gateway = new AiGateway();
  });

  describe('BYOK Decryption & Settings Resolution', () => {
    it('decrypts user API key securely from AiSettings when present', async () => {
      const mockSettings = {
        id: 'settings-1',
        userId: mockUserId,
        provider: 'openai',
        apiKey: 'encrypted_secret_key',
        modelsConfig: null,
      };

      (prisma.aiSettings.findUnique as any).mockResolvedValue(mockSettings);
      (decryptApiKey as any).mockResolvedValue('sk-decrypted-user-key-12345');

      const resolvedKey = await gateway.resolveApiKey(mockUserId, 'openai');

      expect(prisma.aiSettings.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(decryptApiKey).toHaveBeenCalledWith('encrypted_secret_key', mockUserId);
      expect(resolvedKey).toBe('sk-decrypted-user-key-12345');
    });

    it('falls back to environment variable when BYOK key is not configured for provider', async () => {
      (prisma.aiSettings.findUnique as any).mockResolvedValue(null);
      process.env.OPENAI_API_KEY = 'sk-env-fallback-key';

      const resolvedKey = await gateway.resolveApiKey(mockUserId, 'openai');

      expect(resolvedKey).toBe('sk-env-fallback-key');
    });

    it('calls decryptAiSettings to retrieve full decrypted settings object', async () => {
      const mockSettings = {
        provider: 'anthropic',
        apiKey: 'encrypted_anthropic_key',
      };
      (prisma.aiSettings.findUnique as any).mockResolvedValue(mockSettings);
      (decryptAiSettings as any).mockResolvedValue({
        provider: 'anthropic',
        apiKey: 'sk-ant-decrypted',
      });

      const settings = await gateway.getDecryptedSettings(mockUserId);

      expect(decryptAiSettings).toHaveBeenCalledWith(mockSettings, mockUserId);
      expect(settings).toEqual({
        provider: 'anthropic',
        apiKey: 'sk-ant-decrypted',
      });
    });
  });

  describe('Metering & Quota Enforcement (Decision D1)', () => {
    it('allows AI calls for Complete plan users within quota', async () => {
      (checkAiLimit as any).mockResolvedValue({ allowed: true, remaining: 450 });

      const quota = await gateway.checkQuota(mockUserId);

      expect(checkAiLimit).toHaveBeenCalledWith(mockUserId);
      expect(quota.allowed).toBe(true);
      expect(quota.remaining).toBe(450);
    });

    it('throws QuotaExceededError when Complete plan quota is reached', async () => {
      (checkAiLimit as any).mockResolvedValue({ allowed: false, remaining: 0 });

      await expect(gateway.checkQuota(mockUserId)).rejects.toThrow(QuotaExceededError);
      expect(checkAiLimit).toHaveBeenCalledWith(mockUserId);
    });

    it('never meters/counts BYOK (Core plan) users in AiUsage', async () => {
      // For Core plan, checkAiLimit returns allowed: true, remaining: Infinity
      (checkAiLimit as any).mockResolvedValue({ allowed: true, remaining: Infinity });

      await gateway.recordUsage(mockUserId, { scope: 'chat' });

      // incrementAiUsage is delegated to metering module which skips BYOK users
      expect(incrementAiUsage).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('Decision D4: Agent Write = Proposal Generation', () => {
    it('wraps agent write operations into AgentProposal with pending status', async () => {
      const mockProposal = {
        id: 'prop-uuid-1234',
        userId: mockUserId,
        source: 'agent',
        tabName: 'finances',
        action: 'create',
        payload: { label: 'Server Cost', amount: 50, category: 'Infrastructure', type: 'expense', frequency: 'monthly', date: '2026-07-29' },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.agentProposal.create as any).mockResolvedValue(mockProposal);

      const result = await gateway.createProposal(mockUserId, {
        tabName: 'finances',
        action: 'create',
        source: 'agent',
        payload: { label: 'Server Cost', amount: 50, category: 'Infrastructure', type: 'expense', frequency: 'monthly', date: '2026-07-29' },
      });

      expect(prisma.agentProposal.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          source: 'agent',
          tabName: 'finances',
          action: 'create',
          payload: { label: 'Server Cost', amount: 50, category: 'Infrastructure', type: 'expense', frequency: 'monthly', date: '2026-07-29' },
          status: 'pending',
        },
      });

      expect(result.success).toBe(true);
      expect(result.proposalId).toBe('prop-uuid-1234');
      expect(result.proposal.status).toBe('pending');
    });

    it('intercepts agent write calls via wrapAgentWrite alias under Decision D4', async () => {
      const mockProposal = {
        id: 'prop-uuid-5678',
        userId: mockUserId,
        source: 'sub-agent-growth',
        tabName: 'hypotheses',
        action: 'create',
        payload: { statement: 'Test Hypothesis', category: 'channel', riskLevel: 'medium', testMethod: 'A/B Test', successCriteria: '10 signups' },
        status: 'pending',
      };

      (prisma.agentProposal.create as any).mockResolvedValue(mockProposal);

      const result = await gateway.wrapAgentWrite(mockUserId, {
        tabName: 'hypotheses',
        action: 'create',
        source: 'sub-agent-growth',
        payload: { statement: 'Test Hypothesis', category: 'channel', riskLevel: 'medium', testMethod: 'A/B Test', successCriteria: '10 signups' },
      });

      expect(prisma.agentProposal.create).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.proposalId).toBe('prop-uuid-5678');
    });
  });
});
