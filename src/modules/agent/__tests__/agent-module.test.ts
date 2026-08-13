import { describe, it, expect, vi } from 'vitest';
import {
  ACTIVE_AGENT_ROLES,
  SUB_AGENT_ROLES,
  AgentFrontmatterSchema,
  CreateDecisionSchema,
  CreateProposalRequestSchema,
  HandleProposalRequestSchema,
  subAgentRegistry,
  CoreAgent,
  registerAgent,
  getAgent,
  getAllAgents,
  executeAgent,
  agentTaskService,
} from '../index';
import {
  agentRepository,
  agentAiGatewayClient,
  loadAgentPromptConfig,
} from '../infrastructure';

describe('Agent Module - Domain, Application, Infrastructure & UI Tests', () => {
  describe('Domain Layer & Taxonomy (AGENTS.md D3, D4)', () => {
    it('enforces 5 active agent taxonomy per Decision D3', () => {
      expect(ACTIVE_AGENT_ROLES).toEqual(['barreur', 'cfo', 'growth', 'research', 'content']);
      expect(ACTIVE_AGENT_ROLES.length).toBe(5);
    });

    it('enforces 4 active sub-agent taxonomy per Decision D3', () => {
      expect(SUB_AGENT_ROLES).toEqual(['cfo', 'growth', 'research', 'content']);
      expect(SUB_AGENT_ROLES.length).toBe(4);
    });

    it('validates AgentFrontmatterSchema correctly', () => {
      const validConfig = {
        id: 'barreur',
        name: 'Le Barreur',
        mission: 'Orchestrer le cockpit du fondateur',
        domainsRead: ['finances', 'gtm'],
        domainsWrite: ['roadmap'],
        tools: ['read_dashboard_tab', 'write_dashboard_tab'],
        defaultModel: 'gpt-4o',
        guardrails: ['Always use AgentProposal for writes'],
      };

      const parsed = AgentFrontmatterSchema.parse(validConfig);
      expect(parsed.id).toBe('barreur');
      expect(parsed.tools).toContain('write_dashboard_tab');
    });

    it('validates CreateDecisionSchema correctly', () => {
      const decisionInput = {
        title: 'Free tier vs Paid plan',
        category: 'pricing',
        options: [
          { id: 'opt1', label: 'BYOK Plan Core', description: 'Core feature set' },
          { id: 'opt2', label: 'Complete Plan', description: 'AI included' },
        ],
      };

      const parsed = CreateDecisionSchema.parse(decisionInput);
      expect(parsed.category).toBe('pricing');
      expect(parsed.options.length).toBe(2);
    });

    it('validates CreateProposalRequestSchema for Decision D4', () => {
      const proposalReq = {
        tabName: 'finances',
        action: 'create',
        payload: { mrr: 1500, label: 'New Subscription' },
        source: 'agent',
      };

      const parsed = CreateProposalRequestSchema.parse(proposalReq);
      expect(parsed.tabName).toBe('finances');
      expect(parsed.action).toBe('create');
    });

    it('validates HandleProposalRequestSchema for proposal confirmation', () => {
      const handleReq = {
        proposalId: '123e4567-e89b-12d3-a456-426614174000',
        userAction: 'accept',
      };

      const parsed = HandleProposalRequestSchema.parse(handleReq);
      expect(parsed.userAction).toBe('accept');
    });
  });

  describe('Application Layer - SubAgentRegistry (Decision D3 Enforcement)', () => {
    it('provides configs for active sub-agents', () => {
      const roles = subAgentRegistry.getAllRoles();
      expect(roles).toEqual(['research', 'cfo', 'growth', 'content']);

      const cfoConfig = subAgentRegistry.getConfig('cfo');
      expect(cfoConfig.name).toBe('CFO Agent');
      expect(cfoConfig.tools).toContain('runway_calculator');
    });

    it('rejects deactivated legacy sub-agents (pm, legal, tech_lead, recruiting) on spawn', async () => {
      const context = {
        userId: 'user-123',
        taskObjective: 'Draft legal terms',
      };

      await expect(subAgentRegistry.spawn('legal', context)).rejects.toThrow(
        /deactivated per AGENTS.md Decision D3/
      );
      await expect(subAgentRegistry.spawn('pm', context)).rejects.toThrow(
        /deactivated per AGENTS.md Decision D3/
      );
      await expect(subAgentRegistry.spawn('tech_lead', context)).rejects.toThrow(
        /deactivated per AGENTS.md Decision D3/
      );
      await expect(subAgentRegistry.spawn('recruiting', context)).rejects.toThrow(
        /deactivated per AGENTS.md Decision D3/
      );
    });
  });

  describe('Application Layer - CoreAgent (Decision D4 Proposal Pipeline)', () => {
    it('instantiates CoreAgent and builds system prompt with personality', async () => {
      const coreAgent = new CoreAgent('test-user-id');
      const prompt = await coreAgent.buildSystemPrompt();

      expect(prompt).toContain('BARREUR');
      expect(prompt).toContain('Helmdash');
      expect(prompt).toContain('TU CHALLENGES');
      expect(prompt).toContain('CFO, Growth, Research, Content');
    });

    it('configures write_dashboard_tab tool to route writes to AgentProposal (D4)', async () => {
      const coreAgent = new CoreAgent('test-user-id');
      const tools = coreAgent.getTools();

      expect(tools.write_dashboard_tab).toBeDefined();

      const proposalSpy = vi.spyOn(agentAiGatewayClient, 'createProposal').mockResolvedValue({
        success: true,
        proposalId: 'prop-abc-123',
        message: 'Proposal registered',
        proposal: { id: 'prop-abc-123', status: 'pending' },
      });

      const writeTool = tools.write_dashboard_tab as any;
      const result = await writeTool.execute({
        tabName: 'finances',
        action: 'create',
        data: { mrr: 2000, month: '2026-08' },
      });

      expect(proposalSpy).toHaveBeenCalledWith('test-user-id', expect.objectContaining({
        tabName: 'finances',
        action: 'create',
      }));
      expect(result.proposalId).toBe('prop-abc-123');

      proposalSpy.mockRestore();
    });
  });

  describe('Application Layer - AgentOrchestrator', () => {
    it('registers and retrieves custom agent definitions', () => {
      const testAgent = {
        id: 'test-analyst',
        name: 'Test Analyst',
        nameFr: 'Analyste Test',
        description: 'Analyzes test data',
        descriptionFr: 'Analyse les données de test',
        emoji: '🧪',
        primaryModule: 'testing',
        buildSystemPrompt: () => 'System prompt test',
        buildUserMessage: () => 'User prompt test',
        parseResponse: (raw: string) => ({ parsed: raw }),
      };

      registerAgent(testAgent);
      const retrieved = getAgent('test-analyst');
      expect(retrieved.name).toBe('Test Analyst');

      const allAgents = getAllAgents();
      expect(allAgents.some(a => a.id === 'test-analyst')).toBe(true);
    });

    it('executes agent using provider interface', async () => {
      const testAgent = {
        id: 'mock-agent',
        name: 'Mock Agent',
        nameFr: 'Mock Agent',
        description: 'Mock',
        descriptionFr: 'Mock',
        emoji: '🤖',
        primaryModule: 'mock',
        buildSystemPrompt: () => 'System',
        buildUserMessage: () => 'User',
        parseResponse: (raw: string) => ({ message: raw }),
      };
      registerAgent(testAgent);

      const mockProvider = {
        name: 'openai' as const,
        chat: vi.fn().mockResolvedValue({
          content: 'Hello Founder',
          usage: { inputTokens: 10, outputTokens: 20 },
        }),
        streamChat: vi.fn(),
      };

      const registryModule = await import('@/lib/ai/provider-registry');
      vi.spyOn(registryModule, 'getProviderRegistry').mockReturnValue({
        get: () => mockProvider as any,
        has: () => true,
        register: () => {},
        getAll: () => [],
      } as any);

      const result = await executeAgent('mock-agent', { userId: 'u1' }, { provider: 'openai', model: 'gpt-4o' });

      expect(result.status).toBe('success');
      expect((result.data as any)?.message).toBe('Hello Founder');
    });
  });

  describe('Infrastructure Layer - AgentRepository & AiGatewayClient', () => {
    it('instantiates repository and client singletons', () => {
      expect(agentRepository).toBeDefined();
      expect(agentAiGatewayClient).toBeDefined();
    });

    it('delegates quota check to AiGateway via agentAiGatewayClient', async () => {
      const { aiGateway } = await import('@/lib/ai/ai-gateway');
      const quotaSpy = vi.spyOn(aiGateway, 'checkQuota').mockResolvedValue({
        allowed: true,
        remainingActions: 100,
        planStatus: 'active',
      } as any);

      const result = await agentAiGatewayClient.checkQuota('user-1');
      expect(result.allowed).toBe(true);
      expect(quotaSpy).toHaveBeenCalledWith('user-1');

      quotaSpy.mockRestore();
    });
  });

  describe('UI Layer Exports', () => {
    it('exports all UI components from src/modules/agent/ui', async () => {
      const uiModule = await import('../ui');
      expect(uiModule.AgentSidebar).toBeDefined();
      expect(uiModule.AgentTaskHistory).toBeDefined();
      expect(uiModule.ChatUI).toBeDefined();
      expect(uiModule.PageAgent).toBeDefined();
      expect(uiModule.ProposalCard).toBeDefined();
    });
  });
});
