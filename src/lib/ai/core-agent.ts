import { z } from 'zod';
import { tool, zodSchema } from 'ai';
import { memory } from './memory/obsidian-memory';
import { decryptAiSettings } from './api-key-encryption';
import { agentTaskService } from './delegation';
import { 
  validateTabData, 
  getPrismaModel, 
  TabName,
  FinanceEntry,
  Hypothesis,
  GTM,
  Contact,
  RoadmapItem,
  CanvasSection
} from './tools/dashboard-tools';

/**
 * Outils natifs du Core Agent - VERSION PRODUCTION
 * Remplace les mocks par de vrais appels Prisma avec validation Zod
 */

export const buildCoreTools = (userId: string) => {
  return {
    /**
     * Lit les données d'un onglet spécifique du dashboard
     */
    read_dashboard_tab: tool({
      description: "Lit les données d'un onglet spécifique du dashboard (finances, hypotheses, gtm, crm, roadmap, canvas).",
      parameters: zodSchema(z.object({
        tabName: z.enum(['finances', 'hypotheses', 'gtm', 'crm', 'roadmap', 'canvas']),
        filters: z.record(z.any()).optional().describe('Filtres optionnels (ex: month pour finances, status pour hypotheses)'),
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

        const data = await PrismaModel.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        return {
          tab: tabName,
          count: data.length,
          data,
          timestamp: new Date().toISOString(),
        };
      },
    }),

    /**
     * Crée, met à jour ou supprime une donnée dans un onglet du dashboard
     */
    write_dashboard_tab: tool({
      description: "PROPOSE la création, mise à jour ou suppression d'une donnée dans un onglet du dashboard. L'action ne sera exécutée qu'après confirmation.",
      parameters: zodSchema(z.object({
        tabName: z.enum(['finances', 'hypotheses', 'gtm', 'crm', 'roadmap', 'canvas']),
        action: z.enum(['create', 'update', 'delete']),
        id: z.string().uuid().optional().describe('Requis pour update/delete'),
        data: z.record(z.any()).describe("Les données à créer ou modifier (validées selon l'onglet)."),
      })),
      // @ts-ignore
      execute: async ({ tabName, action, id, data }: any) => {
        const validatedData = validateTabData(tabName, data);

        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const proposal = await prisma.agentProposal.create({
          data: {
            userId,
            conversationId: 'page-agent',
            domain: tabName,
            action,
            payload: id ? { id, ...validatedData } : validatedData as any,
            status: 'pending'
          }
        });
        await prisma.$disconnect();

        return {
          success: true,
          type: 'proposal',
          action,
          tab: tabName,
          proposalId: proposal.id,
          message: `Proposition enregistrée. TU DOIS IMPÉRATIVEMENT inclure ce texte exact dans ta réponse : [PROPOSAL:${proposal.id}]`,
        };
      },
    }),

    /**
     * Recherche sémantique dans la mémoire vectorielle
     */
    query_memory: tool({
      description: "Recherche sémantique dans la mémoire vectorielle de l'utilisateur (Obsidian-like). Utile pour retrouver des notes, des décisions ou des insights passés.",
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

    /**
     * Ajoute ou met à jour une note dans la mémoire vectorielle
     */
    write_memory: tool({
      description: "Ajoute ou met à jour une note, une idée ou un apprentissage dans la mémoire vectorielle.",
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

    /**
     * Délègue une tâche à un sous-agent spécialisé
     */
    spawn_sub_agent: tool({
      description: "Délègue une tâche complexe à un sous-agent spécialisé (PM, CFO, Growth, Legal, Tech Lead, Research, Content, Recruiting).",
      parameters: zodSchema(z.object({
        agentRole: z.enum(['pm', 'cfo', 'growth', 'legal', 'tech_lead', 'research', 'content', 'recruiting']),
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
        agentRole: 'pm' | 'cfo' | 'growth' | 'legal' | 'tech_lead' | 'research' | 'content' | 'recruiting';
        taskObjective: string;
        context?: Record<string, any>;
        constraints?: { budget?: number; deadline?: string; allowedTools?: string[] };
        successCriteria: string[];
      }) => {
        try {
          // Import dynamique pour éviter les problèmes de bundle
          const { subAgentQueue } = await import('@/lib/queue/sub-agent-queue');
     
          // Générer un ID de tâche unique
          const taskId = `${agentRole}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
     
          // Persister la tâche en base pour traçabilité
          await agentTaskService.create({ userId, agentRole, taskObjective, taskId });

          // Enqueue le job pour traitement asynchrone
          await subAgentQueue.add('execute-sub-agent', {
            taskId,
            userId,
            agentRole,
            taskObjective,
            context,
            constraints,
            successCriteria,
          });
     
          // Enregistrer la délégation dans la mémoire pour traçabilité
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

    /**
     * Planifie une tâche récurrente (cron interne)
     */
    schedule_recurring: tool({
      description: "Planifie une tâche récurrente ou un cron job interne (ex: revue hebdo, sync Stripe).",
      parameters: zodSchema(z.object({
        taskName: z.string(),
        schedule: z.string().describe('Expression Cron (ex: "0 9 * * 1" pour lundi 9h).'),
        payload: z.record(z.any()).optional(),
      })),
      // @ts-ignore
      execute: async ({ taskName, schedule, payload }: { taskName: string; schedule: string; payload?: Record<string, any> }) => {
        // Créer la tâche planifiée en base
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const task = await prisma.scheduledTask.create({
          data: {
            userId,
            taskName,
            schedule,
            payload: payload as any,
            isActive: true,
            nextRunAt: new Date(Date.now() + 60000), // Approximatif, à calculer précisément avec cron-parser
          },
        });
        
        await prisma.$disconnect();

        // Logger dans la mémoire pour traçabilité
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

    /**
     * Recherche web via Composio SerpAPI
     */
    web_search: tool({
      description: "Effectue une recherche web pour obtenir des informations à jour (marché, concurrents, actualités).",
      parameters: zodSchema(z.object({
        query: z.string().describe('La requête de recherche.'),
        maxResults: z.number().optional().default(5),
        source: z.enum(['news', 'web', 'academic']).optional().default('web'),
      })),
      // @ts-ignore
      execute: async ({ query, maxResults, source }: { query: string; maxResults?: number; source?: 'news' | 'web' | 'academic' }) => {
        try {
          // Import dynamique pour éviter les problèmes de bundle
          const { executeComposioTool } = await import('@/lib/integrations/composio-client');
     
          const toolName = source === 'news' ? 'serpapi_search_news' : 'serpapi_search';
          const result = await executeComposioTool(toolName, { 
            query, 
            num: maxResults,
            ...(source === 'news' && { tbs: 'qdr:w' }) // Dernière semaine pour news
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
          // Fallback mock si Composio pas configuré
          return {
            query,
            results: [],
            message: `Recherche web échouée: ${error instanceof Error ? error.message : 'Configuration Composio manquante'}`,
          };
        }
      },
    }),

    /**
     * Sync Stripe - récupère MRR, clients, abonnements
     */
    stripe_sync: tool({
      description: "Synchronise les données Stripe (MRR, clients, abonnements, factures) et met à jour les finances.",
      parameters: zodSchema(z.object({
        forceFullSync: z.boolean().optional().default(false),
      })),
      // @ts-ignore
      execute: async ({ forceFullSync }: { forceFullSync?: boolean }) => {
        try {
          // Appeler la route API serveur pour la sync
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/billing/stripe/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forceFullSync }),
          });
     
          if (!response.ok) {
            throw new Error(`Sync failed: ${response.statusText}`);
          }
     
          const result = await response.json();
     
          // Sauvegarder dans la mémoire
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
  };
};

export class CoreAgent {
  constructor(private userId: string) {}

  getTools() {
    return buildCoreTools(this.userId);
  }

  async buildSystemPrompt(): Promise<string> {
    const recentContext = await memory.buildContextWindow(this.userId, 'startup strategy objectives', 2000);
    const decisions = await memory.buildContextWindow(this.userId, 'decision', 1500);
    const decryptedSettings = await decryptAiSettings(
      await this.getAiSettings(),
      this.userId
    );

    // Récupérer le nom du founder depuis le profil
    let founderName = 'Fondateur';
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { id: this.userId }, select: { name: true } });
      if (user?.name) founderName = user.name.split(' ')[0];
      await prisma.$disconnect();
    } catch {}

    return `Tu es le BARREUR, l'agent central de Helmdash — le poste de pilotage d'un fondateur solo.

TON RÔLE :
Tu es le copilote de ${founderName}. Ta mission n'est pas de faire à sa place, mais de tenir la barre avec lui. Tu lis ses données, tu analyses, tu proposes — et tu agis dans son dashboard quand il te le demande.

TA PERSONNALITÉ — quatre traits indissociables :

1. TU APPRENDS. Tu te souviens de chaque décision, chaque chiffre, chaque hypothèse que ${founderName} partage avec toi. Tu construis progressivement une compréhension fine de son business, de son marché, de ses forces et de ses angles morts. Tu ne repars jamais de zéro.

2. TU CHALLENGES. Tu n'es pas un yes-man. Quand une hypothèse te semble fragile ou qu'un chiffre ne colle pas, tu le dis — avec respect, avec des données. Tu poses les questions qui dérangent, celles que ${founderName} n'a pas envie d'entendre mais dont il a besoin.

3. TU MOTIVES. Être fondateur solo, c'est dur. Tu célèbres les victoires (même petites), tu rappelles le chemin parcouru quand le moral baisse, tu maintiens le cap. Pas de discours creux : des faits, du contexte, de la perspective.

4. TU ORCHESTRES. Tu n'es pas seul. Tu peux déléguer à des sous-agents spécialisés — CFO pour les finances, PM pour le produit, Growth pour la distribution, Research pour la veille, Legal pour les contrats, Tech Lead pour l'architecture. Tu analyses la demande, tu identifies le bon expert, tu délègues via spawn_sub_agent — et tu synthétises le résultat.

TON LANGAGE :
- Concis, direct, business. Pas de blabla.
- Métaphores nautiques bienvenues mais sans excès (barre, cap, gouvernail, équipage, vent, houle).
- En français, tutoiement.
- Quand tu poses une question, c'est pour faire avancer — pas pour meubler.

TES OUTILS (tous réels, pas simulés) :
- read_dashboard_tab : lis VRAIMENT les finances, hypothèses, GTM, CRM, roadmap, canvas
- write_dashboard_tab : PROPOSE la création/modification/suppression de données (l'utilisateur devra confirmer l'écriture via le bouton généré).
- query_memory / write_memory : mémoire vectorielle persistante (chaque décision, chaque insight)
- spawn_sub_agent : délègue à un sous-agent spécialisé (pm, cfo, growth, legal, tech_lead, research, content, recruiting)
- web_search : recherche web temps réel (via Composio SerpAPI)
- stripe_sync : synchronise les données Stripe (MRR, abonnements, factures)
- schedule_recurring : planifie des tâches récurrentes (revue hebdo, sync finances)

RÈGLES D'ENGAGEMENT :
1. Commence TOUJOURS par lire les données avant de répondre — ne devine jamais un chiffre.
2. Pour une question complexe, identifie le sous-agent compétent et délègue.
3. Après chaque interaction, sauvegarde les décisions clés dans write_memory.
4. Si tu détectes une incohérence, signale-la immédiatement.
5. Sois proactif : si la runway passe sous 6 mois, alerte. Si une hypothèse est en "draft" depuis 30 jours, relance.

CONFIGURATION :
- Provider IA : ${decryptedSettings.provider}
- Modèle : ${decryptedSettings.modelsConfig?.defaultModel || 'gpt-4o'}

MÉMOIRE RÉCENTE (décisions clés) :
${decisions}

CONTEXTE RÉCENT :
${recentContext}

Tu es opérationnel. ${founderName} vient de prendre la barre. Commence par un point de situation s'il te le demande, ou réponds à sa question.`;
  }

  private async getAiSettings(): Promise<any> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    return prisma.aiSettings.findUnique({ where: { userId: this.userId } });
  }
}
