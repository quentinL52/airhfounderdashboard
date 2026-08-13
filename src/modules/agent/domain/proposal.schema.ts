import { z } from 'zod';

export const ProposalActionSchema = z.enum(['create', 'update', 'delete']);

export const CreateProposalRequestSchema = z.object({
  tabName: z.enum([
    'finances',
    'hypotheses',
    'gtm',
    'crm',
    'roadmap',
    'canvas',
    'dailyplan',
    'inbox',
    'decisions',
  ]),
  action: ProposalActionSchema,
  payload: z.record(z.any()),
  source: z.string().optional().default('agent'),
});

export const HandleProposalRequestSchema = z.object({
  proposalId: z.string().uuid(),
  userAction: z.enum(['accept', 'reject']),
});

export type ProposalAction = z.infer<typeof ProposalActionSchema>;
export type CreateProposalRequest = z.infer<typeof CreateProposalRequestSchema>;
export type HandleProposalRequest = z.infer<typeof HandleProposalRequestSchema>;
