import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

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

/**
 * Charge et valide la configuration d'un agent depuis un fichier Markdown avec YAML frontmatter.
 * En cas de frontmatter invalide, lève une erreur Zod explicite au boot.
 */
export function loadAgentConfig(filePath: string): LoadedAgentConfig {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[AgentLoader] Fichier d'agent introuvable : ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(rawContent);

  // Validation Zod stricte du frontmatter YAML
  const validatedFrontmatter = AgentFrontmatterSchema.parse(parsed.data);

  return {
    ...validatedFrontmatter,
    systemPrompt: parsed.content.trim(),
    filePath,
  };
}

/**
 * Charge tous les agents actifs présents dans le registre (exclut `registry/disabled/`).
 */
export function loadActiveAgents(customDir?: string): Record<string, LoadedAgentConfig> {
  const registryDir =
    customDir || path.resolve(process.cwd(), 'src/lib/ai/agents/registry');

  if (!fs.existsSync(registryDir)) {
    console.warn(`[AgentLoader] Repertoire de registre non trouvé : ${registryDir}`);
    return {};
  }

  const entries = fs.readdirSync(registryDir, { withFileTypes: true });
  const activeAgents: Record<string, LoadedAgentConfig> = {};

  for (const entry of entries) {
    // Ignorer les sous-dossiers (ex: disabled/)
    if (entry.isDirectory()) continue;

    if (entry.isFile() && entry.name.endsWith('.md')) {
      const filePath = path.join(registryDir, entry.name);
      try {
        const agent = loadAgentConfig(filePath);
        activeAgents[agent.id] = agent;
      } catch (error: any) {
        console.error(`[AgentLoader] Erreur de chargement pour ${entry.name}:`, error);
        throw error; // Propager l'erreur au boot comme exigé par GATE E
      }
    }
  }

  return activeAgents;
}
