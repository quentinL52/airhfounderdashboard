import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withValidation } from '@/lib/security';
import { memory } from '@/lib/ai/memory/obsidian-memory';
import { logger } from '@/lib/logging/logger';

const createSchema = z.object({
  content: z.string().min(1).describe('Contenu en markdown de la note'),
  type: z
    .enum(['journal', 'decision', 'insight', 'meeting', 'research', 'template'])
    .default('insight'),
  tags: z.array(z.string()).optional().default([]),
  links: z.array(z.string()).optional().default([]),
});

/**
 * POST /api/memory/create
 *
 * Crée une nouvelle note dans la mémoire vectorielle.
 * L'embedding et l'extraction d'entités sont traités de manière asynchrone.
 */
const handler = withAuth(
  withValidation(createSchema)(
    async (
      req: NextRequest,
      { userId, body }: { userId: string; body: z.infer<typeof createSchema> },
    ) => {
      try {
        await memory.upsertNote({
          userId,
          content: body.content,
          type: body.type,
          tags: body.tags,
          links: body.links,
          source: 'user',
        });

        return NextResponse.json({
          success: true,
          message: 'Note sauvegardée dans la mémoire.',
        });
      } catch (error) {
        logger.error('[Memory Create API] Error', error, { userId });
        return NextResponse.json(
          { error: 'Failed to create memory note' },
          { status: 500 },
        );
      }
    },
  ),
);

export const POST = handler;