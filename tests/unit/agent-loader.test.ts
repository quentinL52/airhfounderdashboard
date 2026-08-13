import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { loadActiveAgents, loadAgentConfig } from '@/lib/ai/agents/agent-loader';

describe('Agents Config-as-Data Unit Tests (Gate E)', () => {
  const registryDir = path.resolve(__dirname, '../../src/lib/ai/agents/registry');

  it('loads all 5 active agents (barreur, cfo, growth, research, content) from markdown registry', () => {
    const activeAgents = loadActiveAgents(registryDir);
    const agentIds = Object.keys(activeAgents).sort();

    expect(agentIds).toEqual(['barreur', 'cfo', 'content', 'growth', 'research']);
  });

  it('validates Zod frontmatter schema for every active agent', () => {
    const activeAgents = loadActiveAgents(registryDir);

    Object.values(activeAgents).forEach((agent) => {
      expect(agent.id).toBeDefined();
      expect(agent.name).toBeDefined();
      expect(agent.mission).toBeDefined();
      expect(Array.isArray(agent.domainsRead)).toBe(true);
      expect(Array.isArray(agent.domainsWrite)).toBe(true);
      expect(Array.isArray(agent.tools)).toBe(true);
      expect(typeof agent.defaultModel).toBe('string');
      expect(Array.isArray(agent.guardrails)).toBe(true);
      expect(agent.systemPrompt.length).toBeGreaterThan(0);
    });
  });

  it('does NOT load disabled legacy sub-agents (legal, recruiting, tech-lead, pm)', () => {
    const activeAgents = loadActiveAgents(registryDir);
    expect(activeAgents['legal']).toBeUndefined();
    expect(activeAgents['recruiting']).toBeUndefined();
    expect(activeAgents['tech-lead']).toBeUndefined();
    expect(activeAgents['pm']).toBeUndefined();
  });

  it('throws an explicit Zod error when loading invalid frontmatter', () => {
    const tempInvalidFile = path.join(registryDir, 'temp-invalid-agent.md');
    const invalidContent = `---
id: ""
name: "Invalid Agent"
---
# Missing required fields
`;

    try {
      fs.writeFileSync(tempInvalidFile, invalidContent, 'utf-8');
      expect(() => loadAgentConfig(tempInvalidFile)).toThrow();
    } finally {
      if (fs.existsSync(tempInvalidFile)) {
        fs.unlinkSync(tempInvalidFile);
      }
    }
  });

  it('updates agent prompt and config dynamically when markdown file is modified', () => {
    const tempAgentFile = path.join(registryDir, 'temp-test-agent.md');
    const contentV1 = `---
id: "test_temp"
name: "Temp Agent V1"
mission: "Test Mission V1"
domainsRead: ["finances"]
domainsWrite: []
tools: ["read_dashboard_tab"]
defaultModel: "gpt-4o"
guardrails: []
---
# System Prompt Version 1
`;
    const contentV2 = `---
id: "test_temp"
name: "Temp Agent V2"
mission: "Test Mission V2"
domainsRead: ["finances", "gtm"]
domainsWrite: ["gtm"]
tools: ["read_dashboard_tab", "web_search"]
defaultModel: "gpt-4o"
guardrails: ["Guardrail V2"]
---
# System Prompt Version 2
`;

    try {
      fs.writeFileSync(tempAgentFile, contentV1, 'utf-8');
      const loadedV1 = loadAgentConfig(tempAgentFile);
      expect(loadedV1.name).toBe('Temp Agent V1');
      expect(loadedV1.systemPrompt).toContain('Version 1');

      fs.writeFileSync(tempAgentFile, contentV2, 'utf-8');
      const loadedV2 = loadAgentConfig(tempAgentFile);
      expect(loadedV2.name).toBe('Temp Agent V2');
      expect(loadedV2.domainsRead).toContain('gtm');
      expect(loadedV2.systemPrompt).toContain('Version 2');
    } finally {
      if (fs.existsSync(tempAgentFile)) {
        fs.unlinkSync(tempAgentFile);
      }
    }
  });
});
