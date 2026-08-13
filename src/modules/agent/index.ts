/**
 * @module modules/agent
 * @description Modular Monolith architecture for Helmdash Agent System.
 * 
 * Layers:
 * - domain: Core models, types, decision & proposal schemas.
 * - application: CoreAgent runner, sub-agents (CFO, Growth, Research, Content), orchestrator, skills loader.
 * - infrastructure: AiGateway integration, Prisma persistence repositories, prompt templates.
 * - ui: ChatUI, ProposalCard, PageAgent, AgentSidebar, AgentTaskHistory.
 */

export * from './domain';
export * from './application';
export * from './ui';
