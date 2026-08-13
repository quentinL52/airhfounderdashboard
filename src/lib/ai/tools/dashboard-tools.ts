import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { encryptAiSettings, decryptAiSettings } from '@/lib/ai/api-key-encryption';

const prisma = new PrismaClient();

/**
 * Schémas Zod stricts pour validation des entrées LLM
 * Empêche l'injection et garantit la structure des données
 */

// --- Finance ---
export const FinanceEntrySchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1).max(200),
  amount: z.number().finite(),
  category: z.enum(['Infrastructure', 'API IA', 'Auth & Data', 'Observabilité', 'Email', 'Outils SaaS', 'Marketing', 'Divers']),
  frequency: z.enum(['monthly', 'annual', 'one-time']).default('monthly'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO date
  type: z.enum(['income', 'expense']),
});

export const MonthlyFinanceSchema = z.object({
  id: z.string().uuid().optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  revenue: z.number().default(0),
  expenses: z.array(FinanceEntrySchema).default([]),
  incomes: z.array(FinanceEntrySchema).default([]),
  notes: z.string().optional(),
});

// --- Hypotheses ---
export const HypothesisSchema = z.object({
  id: z.string().uuid().optional(),
  statement: z.string().min(10).max(1000),
  category: z.enum(['problem', 'solution', 'channel', 'revenue', 'segment']),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
  testMethod: z.string().min(5).max(500),
  successCriteria: z.string().min(5).max(500),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cost: z.number().nonnegative().optional(),
  status: z.enum(['draft', 'testing', 'validated', 'invalidated', 'pivoted']).default('draft'),
  measureNotes: z.string().optional(),
  actualResult: z.string().optional(),
  learnings: z.string().optional(),
  nextAction: z.string().optional(),
  pivotedFromId: z.string().uuid().optional(),
});

// --- GTM ---
export const GTMSchema = z.object({
  // Messaging
  sbHero: z.string().optional(),
  sbProblem: z.string().optional(),
  sbGuide: z.string().optional(),
  // Positioning & ICP
  oaAlternatives: z.string().optional(),
  oaUniqueAttributes: z.string().optional(),
  oaValue: z.string().optional(),
  // Target & Channels
  ompTarget: z.string().optional(),
  ompMessage: z.string().optional(),
  ompMedia: z.string().optional(),
  // Atomic Network
  csAtomicNetwork: z.string().optional(),
  // Content Cadence
  owCadence: z.string().optional(),
});

// --- CRM ---
export const ContactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  type: z.enum(['candidat', 'entreprise', 'investisseur', 'école']).optional(),
  role: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  status: z.enum(['À contacter', 'En discussion', 'Qualifié', 'Client', 'Perdu']).default('À contacter'),
  pipelineStage: z.string().optional(),
  lastContactDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nextActionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  nextActionLabel: z.string().optional(),
  nextAction: z.string().optional(),
  waitingOn: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

// --- Decisions ---
export const DecisionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  context: z.string().optional(),
  category: z.enum(['product', 'gtm', 'pricing', 'structural', 'other']),
  options: z.any(), // JSON
  status: z.enum(['open', 'decided', 'revisited']).default('open'),
  decidedOption: z.string().optional(),
  rationale: z.string().optional(),
});

// --- Inbox ---
export const InboxItemSchema = z.object({
  id: z.string().uuid().optional(),
  content: z.string().min(1),
  classifiedAs: z.enum(['task', 'contact', 'note', 'idea']).optional(),
});

// --- Daily Plan ---
export const DailyPlanSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  top3: z.any(), // JSON array
  snoozed: z.any().optional(), // JSON array
});

// --- Roadmap ---
export const RoadmapItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['todo', 'doing', 'done']).default('todo'),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  week: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// --- Canvas ---
export const CanvasSectionSchema = z.object({
  sectionId: z.enum(['problem', 'solution', 'keyMetrics', 'uvp', 'unfairAdvantage', 'channels', 'customerSegments', 'costStructure', 'revenueStreams']),
  content: z.string(),
});

// --- Type exports ---
export type FinanceEntry = z.infer<typeof FinanceEntrySchema>;
export type MonthlyFinance = z.infer<typeof MonthlyFinanceSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type GTM = z.infer<typeof GTMSchema>;
export type Contact = z.infer<typeof ContactSchema>;
export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;
export type CanvasSection = z.infer<typeof CanvasSectionSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type InboxItem = z.infer<typeof InboxItemSchema>;
export type DailyPlan = z.infer<typeof DailyPlanSchema>;

/**
 * Map des onglets vers leurs schémas de validation
 */
export const TAB_SCHEMAS = {
  finances: MonthlyFinanceSchema,
  hypotheses: HypothesisSchema,
  gtm: GTMSchema,
  crm: ContactSchema,
  roadmap: RoadmapItemSchema,
  canvas: CanvasSectionSchema,
  decisions: DecisionSchema,
  inbox: InboxItemSchema,
  dailyplan: DailyPlanSchema,
} as const;

export type TabName = keyof typeof TAB_SCHEMAS;

/**
 * Validation helper pour les outils LLM
 */
export function validateTabData<T extends TabName>(
  tabName: T,
  data: unknown
): z.infer<typeof TAB_SCHEMAS[T]> {
  const schema = TAB_SCHEMAS[tabName];
  if (!schema) {
    throw new Error(`Unknown tab: ${tabName}`);
  }
  return schema.parse(data);
}

/**
 * Utilitaire pour accéder à Prisma de manière typée selon l'onglet
 */
export async function getPrismaModel(tabName: TabName) {
  switch (tabName) {
    case 'finances':
      return prisma.monthlyFinance as any;
    case 'hypotheses':
      return prisma.hypothesis as any;
    case 'gtm':
      return prisma.gtmStrategy as any;
    case 'crm':
      return prisma.contact as any;
    case 'roadmap':
      return prisma.roadmapItem as any;
    case 'canvas':
      return prisma.leanCanvasSection as any;
    case 'decisions':
      return prisma.decision as any;
    case 'inbox':
      return prisma.inboxItem as any;
    case 'dailyplan':
      return prisma.dailyPlan as any;
    default:
      throw new Error(`No Prisma model for tab: ${tabName}`);
  }
}

// Note: Les modèles Prisma ci-dessus doivent être ajoutés au schema.prisma
// Voir migration SQL fournie séparément