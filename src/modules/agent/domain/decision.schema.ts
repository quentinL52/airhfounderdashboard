import { z } from 'zod';

export const DecisionCategorySchema = z.enum([
  'product',
  'gtm',
  'pricing',
  'structural',
  'other',
]);

export const DecisionStatusSchema = z.enum(['open', 'decided', 'revisited']);

export const DecisionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
});

export const CreateDecisionSchema = z.object({
  title: z.string().min(1),
  context: z.string().optional(),
  category: DecisionCategorySchema,
  options: z.array(DecisionOptionSchema),
  aiChallenge: z.record(z.any()).optional(),
});

export type DecisionCategory = z.infer<typeof DecisionCategorySchema>;
export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;
export type DecisionOption = z.infer<typeof DecisionOptionSchema>;
export type CreateDecisionInput = z.infer<typeof CreateDecisionSchema>;
