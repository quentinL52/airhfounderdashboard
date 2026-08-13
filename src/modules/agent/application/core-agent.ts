import { z } from 'zod';
import { tool, zodSchema } from 'ai';
import { memory } from '@/lib/ai/memory/obsidian-memory';
import { decryptAiSettings } from '@/lib/ai/api-key-encryption';
import { agentRepository } from '../infrastructure/agent-repository';
import { agentAiGatewayClient } from '../infrastructure/ai-gateway-client';
import { 
  validateTabData, 
  getPrismaModel, 
} from '@/lib/ai/tools/dashboard-tools';
import { getRecentJournalContext } from '@/services/journal.service';
import { SUB_AGENT_ROLES } from '../domain/types';

export const buildCoreTools = (userId: string) => {
  return {
    read_dashboard_tab: tool({
      description: "Lit les données d'un onglet spécifique du dashboard (finances, hypotheses, gtm, crm, roadmap, canvas, dailyplan, inbox, decisions).",
      parameters: zodSchema(z.object({
        tabName: z.enum(['finances', 'hypotheses', 'gtm', 'crm', 'roadmap', 'canvas', 'dailyplan', 'inbox', 'decisions']),
        filters: z.record(z.any()).optional().describe('Filtres optionnels'),
      })),
      // @ts-ignore
      execute: async ({ tabName, filters }: any) => {
        const PrismaModel = await getPrismaModel(tabName);
        const where: Record<string, any> = { userId };
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            where[key] = value;
          });
        }

        const queryOptions: any = { where, take: 100 };
        if (tabName === 'dailyplan') {
          queryOptions.orderBy = { date: 'desc' };
        } else if (tabName === 'canvas') {
          queryOptions.orderBy = { updatedAt: 'desc' };
        } else {
          queryOptions.orderBy = { createdAt: 'desc' };
        }

        const data = await PrismaModel.findMany(queryOptions);

        return {
          tab: tabName,
          count: data.length,
          data,
          timestamp: new Date().toISOString(),
        };
      },
    }),

    read_okr: tool({
      description: "Lit les Objectifs et Key Results (OKR) de l'utilisateur.",
      parameters: zodSchema(z.object({})),
      // @ts-ignore
      execute: async () => {
        const { prisma } = await import('@/lib/prisma');
        try {
          const objectives = await prisma.objective.findMany({
            where: { userId },
            include: { keyResults: true },
            orderBy: { createdAt: 'desc' }
          });
          return { success: true, objectives };
        } catch (error) {
          console.error('[read_okr] Error:', error);
          return { success: false, error: 'Failed to read OKRs' };
        }
      },
    }),

    /**
     * Decision D4: Write operations MUST use AgentProposal wrapped via AiGateway.
     */
    write_dashboard_tab: tool({
      description: "Crée, met à jour ou supprime une donnée dans un onglet du dashboard.",
      parameters: zodSchema(z.object({
        tabName: z.enum(['finances', 'hypotheses', 'gtm', 'crm', 'roadmap', 'canvas', 'dailyplan', 'inbox', 'decisions']),
        action: z.enum(['create', 'update', 'delete']),
        id: z.string().uuid().optional().describe('Requis pour update/delete'),
        data: z.record(z.any()).describe("Les données à créer ou modifier."),
      })),
      // @ts-ignore
      execute: async ({ tabName, action, id, data }: any) => {
        const validatedData = validateTabData(tabName, data);

        const result = await agentAiGatewayClient.createProposal(userId, {
          tabName,
          action,
          payload: {
            ...validatedData,
            ...(id ? { id } : {}),
          },
          source: 'chat',
        });

        return result;
      },
    }),

    query_memory: tool({
      description: "Recherche sémantique dans la mémoire vectorielle de l'utilisateur.",
      parameters: zodSchema(z.object({
        query: z.string().describe('La recherche textuelle ou la question.'),
        limit: z.number().optional().default(5),
        threshold: z.number().optional().default(0.5),
      })),
      // @ts-ignore
      execute: async ({ query, limit, threshold }: { query: string; limit?: number; threshold?: number }) => {
        const results = await memory.search(userId, query, { limit, threshold });
        return { results };
      },
    }),

    write_memory: tool({
      description: "Ajoute ou met à jour une note dans la mémoire vectorielle.",
      parameters: zodSchema(z.object({
        content: z.string().describe('Le contenu en markdown de la note.'),
        type: z.enum(['journal', 'decision', 'insight', 'meeting', 'research', 'template']),
        tags: z.array(z.string()).optional(),
        links: z.array(z.string()).optional(),
      })),
      // @ts-ignore
      execute: async ({ content, type, tags, links }: { content: string; type: 'journal' | 'decision' | 'insight' | 'meeting' | 'research' | 'template'; tags?: string[]; links?: string[] }) => {
        await memory.upsertNote({
          userId,
          content,
          type,
          tags: tags || [],
          links: links || [],
          source: 'agent',
        });
        return { success: true, message: 'Note sauvegardée dans la mémoire.' };
      },
    }),

    spawn_sub_agent: tool({
      description: "Délègue une tâche complexe à un sous-agent spécialisé (CFO, Growth, Research, Content).",
      parameters: zodSchema(z.object({
        agentRole: z.enum(['cfo', 'growth', 'research', 'content']),
        taskObjective: z.string().describe("L'objectif clair et mesurable de la tâche."),
        context: z.record(z.any()).optional().describe('Contexte additionnel pour le sous-agent.'),
        constraints: z.object({
          budget: z.number().optional(),
          deadline: z.string().optional(),
          allowedTools: z.array(z.string()).optional(),
        }).optional(),
        successCriteria: z.array(z.string()).min(1).describe('Critères de succès mesurables.'),
      })),
      // @ts-ignore
      execute: async ({ agentRole, taskObjective, context, constraints, successCriteria }: { 
        agentRole: 'cfo' | 'growth' | 'research' | 'content';
        taskObjective: string;
        context?: Record<string, any>;
        constraints?: { budget?: number; deadline?: string; allowedTools?: string[] };
        successCriteria: string[];
      }) => {
        try {
          const { subAgentQueue } = await import('@/lib/queue/sub-agent-queue');
          const taskId = `${agentRole}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

          await agentRepository.createTask({ userId, agentRole, taskObjective, taskId });

          await subAgentQueue.add('execute-sub-agent', {
            taskId,
            userId,
            agentRole,
            taskObjective,
            context,
            constraints,
            successCriteria,
          });

          await memory.upsertNote({
            userId,
            content: `Sous-agent ${agentRole} délégué: ${taskObjective}\nContexte: ${JSON.stringify(context)}\nContraintes: ${JSON.stringify(constraints)}\nCritères de succès: ${successCriteria.join(', ')}`,
            type: 'decision',
            tags: ['sub-agent', agentRole, 'delegated'],
            source: 'agent',
          });

          return {
            status: 'delegated',
            taskId,
            agentRole,
            taskObjective,
            message: `Tâche déléguée à l'agent ${agentRole}: ${taskObjective}. Traitement asynchrone en cours (taskId: ${taskId}). Résultats disponibles dans l'historique.`,
          };
        } catch (error) {
          console.error('[spawn_sub_agent] Error:', error);
          return {
            status: 'failed',
            taskId: `${agentRole}-${Date.now()}`,
            agentRole,
            taskObjective,
            message: `Échec de la délégation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          };
        }
      },
    }),

    schedule_recurring: tool({
      description: "Planifie une tâche récurrente ou un cron job interne.",
      parameters: zodSchema(z.object({
        taskName: z.string(),
        schedule: z.string().describe('Expression Cron.'),
        payload: z.record(z.any()).optional(),
      })),
      // @ts-ignore
      execute: async ({ taskName, schedule, payload }: { taskName: string; schedule: string; payload?: Record<string, any> }) => {
        const { prisma } = await import('@/lib/prisma');
        const task = await prisma.scheduledTask.create({
          data: {
            userId,
            taskName,
            schedule,
            payload: payload as any,
            isActive: true,
            nextRunAt: new Date(Date.now() + 60000),
          },
        });

        await memory.upsertNote({
          userId,
          content: `Cron planifié: ${taskName} (${schedule})\nPayload: ${JSON.stringify(payload)}\nTask ID: ${task.id}`,
          type: 'decision',
          tags: ['cron', 'scheduled'],
          source: 'agent',
        });
        return { 
          success: true, 
          taskId: task.id,
          message: `Tâche '${taskName}' planifiée avec schedule: ${schedule}` 
        };
      },
    }),

    web_search: tool({
      description: "Effectue une recherche web pour obtenir des informations à jour.",
      parameters: zodSchema(z.object({
        query: z.string().describe('La requête de recherche.'),
        maxResults: z.number().optional().default(5),
        source: z.enum(['news', 'web', 'academic']).optional().default('web'),
      })),
      // @ts-ignore
      execute: async ({ query, maxResults, source }: { query: string; maxResults?: number; source?: 'news' | 'web' | 'academic' }) => {
        try {
          const { executeComposioTool } = await import('@/lib/integrations/composio-client');
          const toolName = source === 'news' ? 'serpapi_search_news' : 'serpapi_search';
          const result = await executeComposioTool(toolName, { 
            query, 
            num: maxResults,
            ...(source === 'news' && { tbs: 'qdr:w' })
          }, userId);

          const results = result?.data?.organic_results || result?.data?.news_results || [];

          return {
            query,
            results: results.slice(0, maxResults).map((r: any) => ({
              title: r.title,
              url: r.link,
              snippet: r.snippet || r.description,
              source: source,
              date: r.date || r.published_date,
            })),
            message: `Trouvé ${results.length} résultats pour "${query}"`,
          };
        } catch (error) {
          console.error('[web_search] Error:', error);
          return {
            query,
            results: [],
            message: `Recherche web échouée: ${error instanceof Error ? error.message : 'Configuration Composio manquante'}`,
          };
        }
      },
    }),

    stripe_sync: tool({
      description: "Synchronise les données Stripe (MRR, clients, abonnements, factures).",
      parameters: zodSchema(z.object({
        forceFullSync: z.boolean().optional().default(false),
      })),
      // @ts-ignore
      execute: async ({ forceFullSync }: { forceFullSync?: boolean }) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/stripe/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forceFullSync }),
          });

          if (!response.ok) {
            throw new Error(`Sync failed: ${response.statusText}`);
          }

          const result = await response.json();

          await memory.upsertNote({
            userId,
            content: `Sync Stripe effectué: MRR ${result.synced?.mrr || 0}€, ${result.synced?.subscriptions || 0} abonnements, ${result.synced?.invoices || 0} factures`,
            type: 'decision',
            tags: ['stripe', 'sync', 'finances'],
            source: 'agent',
          });

          return {
            success: true,
            message: result.message || 'Sync Stripe terminé avec succès',
            synced: result.synced || { customers: 0, subscriptions: 0, invoices: 0, mrr: 0 },
          };
        } catch (error) {
          console.error('[stripe_sync] Error:', error);
          return {
            success: false,
            message: `Sync Stripe échouée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            synced: { customers: 0, subscriptions: 0, invoices: 0, mrr: 0 },
          };
        }
      },
    }),

    suggest_capture: tool({
      description: "Propose une capture rapide (contact, idée, tâche, décision, dépense) basée sur la conversation.",
      parameters: zodSchema(z.object({
        kind: z.enum(['contact', 'expense', 'task', 'hypothesis', 'decision', 'note']),
        payload: z.record(z.any()).describe("Les données à pré-remplir."),
      })),
      // @ts-ignore
      execute: async ({ kind, payload }) => {
        return {
          suggestedKind: kind,
          payload,
          message: `Suggestion de capture type '${kind}' générée. En attente d'un clic de l'utilisateur.`
        };
      }
    }),

    get_current_context: tool({
      description: "Récupère le contexte du jour : date courante, jours restants avant le MVP, série actuelle (streak) et Top 3 des tâches.",
      parameters: zodSchema(z.object({})),
      // @ts-ignore
      execute: async () => {
        const { prisma } = await import('@/lib/prisma');
        const today = new Date().toISOString();
        let top3 = null;
        let streak = 0;
        let daysToMvp = null;

        try {
          const startOfToday = new Date();
          startOfToday.setHours(0,0,0,0);
          const dailyPlan = await prisma.dailyPlan.findFirst({
            where: { userId, date: { gte: startOfToday } }
          });
          if (dailyPlan) top3 = dailyPlan.top3;

          const userStreak = await prisma.streak.findUnique({ where: { userId } });
          if (userStreak) streak = userStreak.currentStreak;

          const project = await prisma.project.findFirst({ where: { userId }});
          if (project && project.targetLaunchDate) {
             daysToMvp = Math.ceil((new Date(project.targetLaunchDate).getTime() - Date.now()) / (1000 * 3600 * 24));
          }
        } catch (e) {
          console.error('[get_current_context] Error:', e);
        }

        return {
          today,
          daysToMvp,
          streak,
          top3
        };
      }
    }),
  };
};

export class CoreAgent {
  constructor(private userId: string) {}

  getTools() {
    return buildCoreTools(this.userId);
  }

  async getProviderConfig() {
    const { prisma } = await import('@/lib/prisma');
    const settings = await prisma.aiSettings.findUnique({ where: { userId: this.userId } });
    return decryptAiSettings(settings, this.userId);
  }

  async buildSystemPrompt(): Promise<string> {
    const recentContext = await memory.buildContextWindow(this.userId, 'startup strategy objectives', 2000);
    const decisions = await memory.buildContextWindow(this.userId, 'decision', 1500);
    const journalContext = await getRecentJournalContext(this.userId);
    const decryptedSettings = await this.getProviderConfig();

    let founderName = 'Fondateur';
    let top3Context = "Aucun plan pour aujourd'hui.";
    let streakContext = "Pas de streak active.";
    let mvpContext = "Pas de date MVP définie.";

    try {
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({ where: { id: this.userId }, select: { name: true } });
      if (user?.name) founderName = user.name.split(' ')[0];

      const startOfToday = new Date();
      startOfToday.setHours(0,0,0,0);
      const dailyPlan = await prisma.dailyPlan.findFirst({
        where: { userId: this.userId, date: { gte: startOfToday } }
      });
      if (dailyPlan && dailyPlan.top3) {
         top3Context = "Top 3 du jour : " + JSON.stringify(dailyPlan.top3);
      }

      const streak = await prisma.streak.findUnique({ where: { userId: this.userId } });
      if (streak) {
         streakContext = `Streak actuelle : ${streak.currentStreak} jours.`;
      }

      const project = await prisma.project.findFirst({ where: { userId: this.userId }});
      if (project && project.targetLaunchDate) {
         const daysToMvp = Math.ceil((new Date(project.targetLaunchDate).getTime() - Date.now()) / (1000 * 3600 * 24));

         if (daysToMvp > 30) {
           mvpContext = `Jours avant MVP : ${daysToMvp}. Mentionne l'échéance de manière légère uniquement si pertinent.`;
         } else if (daysToMvp > 7) {
           mvpContext = `Jours avant MVP : ${daysToMvp}. Posture "focus". Suggère de re-prioriser et éventuellement créer une décision "Scope freeze ?".`;
         } else if (daysToMvp >= 0) {
           mvpContext = `Jours avant MVP : ${daysToMvp}. ALERTE: Propose explicitement la checklist de lancement.`;
         } else {
           mvpContext = `Jours avant MVP : ${daysToMvp}. Lancement dépassé. Propose une rétrospective et l'établissement d'une nouvelle date.`;
         }
      }
    } catch {}

    return `Tu es le BARREUR, l'agent central de Helmdash — le poste de pilotage d'un fondateur solo.

TON RÔLE :
Tu es le copilote de ${founderName}. Ta mission n'est pas de faire à sa place, mais de tenir la barre avec lui. Tu lis ses données, tu analyses, tu proposes — et tu agis dans son dashboard quand il te le demande.

TA PERSONNALITÉ — quatre traits indissociables :
1. TU APPRENDS. Tu te souviens de chaque décision, chaque chiffre, chaque hypothèse que ${founderName} partage avec toi.
2. TU CHALLENGES. Tu n'es pas un yes-man. Quand une hypothèse te semble fragile ou qu'un chiffre ne colle pas, tu le dis.
3. TU MOTIVES. Pas de discours creux : des faits, du contexte, de la perspective.
4. TU ORCHESTRES. Tu peux déléguer à 4 sous-agents spécialisés (CFO, Growth, Research, Content) via spawn_sub_agent per Decision D3.

TON LANGAGE :
- Concis, direct, business. Pas de blabla.
- Métaphores nautiques bienvenues mais sans excès.
- En français, tutoiement.

CONFIGURATION :
- Provider IA : ${decryptedSettings.provider}
- Modèle : ${decryptedSettings.modelsConfig?.defaultModel || 'gpt-4o'}

MÉMOIRE RÉCENTE (décisions clés) :
${decisions}

CONTEXTE RÉCENT :
${recentContext}
${top3Context}
${streakContext}
${mvpContext}${journalContext ? `\n\n${journalContext}` : ''}

Tu es opérationnel. ${founderName} vient de prendre la barre.`;
  }
}
