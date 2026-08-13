/**
 * @module provider-registry
 * @description Singleton registry for AI providers.
 * Manages registration, resolution, and model listing across all adapters.
 * Use `getProviderRegistry()` to access the shared instance.
 */

import type { AIModel, AIProvider, ProviderName } from './provider-interface';

/**
 * Central registry that holds all registered AI provider adapters.
 * Implements the Registry pattern as a singleton to ensure a single source of truth.
 */
class ProviderRegistry {
  private readonly providers = new Map<ProviderName, AIProvider>();

  /**
   * Register a new AI provider adapter.
   * @param provider - The provider instance to register.
   * @throws If a provider with the same name is already registered.
   */
  register(provider: AIProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(
        `[ProviderRegistry] Provider "${provider.name}" is already registered.`
      );
    }
    this.providers.set(provider.name, provider);
  }

  /**
   * Retrieve a provider by name.
   * @param name - The provider identifier.
   * @returns The provider instance.
   * @throws If the provider is not registered.
   */
  get(name: ProviderName): AIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      const available = Array.from(this.providers.keys()).join(', ');
      throw new Error(
        `[ProviderRegistry] Provider "${name}" not found. Available: [${available}]`
      );
    }
    return provider;
  }

  /**
   * Get all registered providers.
   * @returns A read-only array of all provider instances.
   */
  getAll(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * List available models for a specific provider.
   * @param name - The provider identifier.
   * @param apiKey - The API key for authentication.
   * @returns An array of available models.
   */
  async listModels(name: ProviderName, apiKey: string): Promise<AIModel[]> {
    const provider = this.get(name);
    return provider.listModels(apiKey);
  }

  /**
   * Check if a provider is registered.
   * @param name - The provider identifier.
   */
  has(name: ProviderName): boolean {
    return this.providers.has(name);
  }
}

/** Singleton instance — lazily initialised on first access. */
let registryInstance: ProviderRegistry | null = null;

/**
 * Returns the singleton `ProviderRegistry` instance.
 * On first call, creates the registry and auto-registers all built-in adapters.
 */
export function getProviderRegistry(): ProviderRegistry {
  if (!registryInstance) {
    registryInstance = new ProviderRegistry();
    registerBuiltInProviders(registryInstance);
  }
  return registryInstance;
}

/**
 * Auto-registers all built-in provider adapters.
 * Called once during singleton initialisation.
 */
import { OpenAIAdapter } from './adapters/openai-adapter';
import { AnthropicAdapter } from './adapters/anthropic-adapter';
import { GeminiAdapter } from './adapters/gemini-adapter';
import { MistralAdapter } from './adapters/mistral-adapter';

function registerBuiltInProviders(registry: ProviderRegistry): void {
  registry.register(new OpenAIAdapter());
  registry.register(new AnthropicAdapter());
  registry.register(new GeminiAdapter());
  registry.register(new MistralAdapter());
}

export { ProviderRegistry };

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';

export type AgentRole = 'core' | 'pm' | 'cfo' | 'growth' | 'legal' | 'tech_lead' | 'research' | 'content' | 'recruiting';

export interface UserModelsConfig {
  core?: string;
  pm?: string;
  cfo?: string;
  growth?: string;
  legal?: string;
  tech_lead?: string;
  research?: string;
  content?: string;
  recruiting?: string;
}

export const DEFAULT_MODELS_CONFIG: UserModelsConfig = {
  core: 'gpt-4o',
  pm: 'claude-3-5-sonnet-20241022',
  cfo: 'gpt-4o',
  growth: 'claude-3-5-sonnet-20241022',
  legal: 'gpt-4o',
  tech_lead: 'claude-3-5-sonnet-20241022',
  research: 'gpt-4o-mini',
  content: 'claude-3-5-sonnet-20241022',
  recruiting: 'gpt-4o-mini',
};

export function getModelForAgent(role: AgentRole, userConfig?: UserModelsConfig | null) {
  const configValue = userConfig?.[role] || DEFAULT_MODELS_CONFIG[role] || 'openai:gpt-4o-mini';
  
  let provider = '';
  let modelId = '';

  if (configValue.includes(':')) {
    [provider, modelId] = configValue.split(':');
  } else {
    modelId = configValue;
    // Fallback detection
    if (modelId.startsWith('gpt') || modelId.startsWith('o1')) provider = 'openai';
    else if (modelId.startsWith('claude')) provider = 'anthropic';
    else if (modelId.startsWith('mistral') || modelId.includes('mistral')) provider = 'mistral';
    else if (modelId.startsWith('gemini')) provider = 'gemini';
    else provider = 'openai';
  }

  switch (provider) {
    case 'openai': return openai(modelId);
    case 'anthropic': return anthropic(modelId);
    case 'google':
    case 'gemini': return google(modelId);
    case 'mistral': return mistral(modelId);
    default: return openai('gpt-4o-mini');
  }
}

