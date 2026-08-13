import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { LoadedAgentConfig, AgentFrontmatterSchema } from '../domain/types';

/**
 * Loads agent configuration from a Markdown file with YAML frontmatter.
 */
export function loadAgentPromptConfig(filePath: string): LoadedAgentConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[PromptTemplates] Agent file not found: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(rawContent);
  const validated = AgentFrontmatterSchema.parse(parsed.data);

  return {
    ...validated,
    systemPrompt: parsed.content.trim(),
    filePath,
  };
}

/**
 * Loads all active agent prompt templates from registry directory.
 */
export function loadActiveAgentPrompts(customDir?: string): Record<string, LoadedAgentConfig> {
  const registryDir = customDir || path.resolve(process.cwd(), 'src/lib/ai/agents/registry');
  if (!fs.existsSync(registryDir)) {
    return {};
  }

  const entries = fs.readdirSync(registryDir, { withFileTypes: true });
  const activeAgents: Record<string, LoadedAgentConfig> = {};

  for (const entry of entries) {
    if (entry.isDirectory()) continue;
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const filePath = path.join(registryDir, entry.name);
      try {
        const agent = loadAgentPromptConfig(filePath);
        activeAgents[agent.id] = agent;
      } catch (error) {
        console.error(`[PromptTemplates] Failed to load prompt for ${entry.name}:`, error);
        throw error;
      }
    }
  }

  return activeAgents;
}
