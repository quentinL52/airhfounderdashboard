import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiEndpoint, ForbiddenError } from '@/lib/api/create-api-endpoint';
import { memory } from '@/lib/ai/memory/obsidian-memory';
import { prisma } from '@/lib/prisma';

const searchSchema = z.object({
  query: z.string().min(1).describe('Recherche textuelle ou question'),
  limit: z.number().min(1).max(50).optional().default(5),
  threshold: z.number().min(0).max(1).optional().default(0.5),
});

/**
 * POST /api/ai/memory/search
 *
 * Recherche sémantique dans la mémoire vectorielle de l'utilisateur.
 * Retourne les notes les plus pertinentes avec leur score de similarité.
 */
export const POST = createApiEndpoint({
  bodySchema: searchSchema,
  async handler(req, { userId, body }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      throw new ForbiddenError('Forbidden');
    }

    const results = await memory.search(userId, body.query, {
      limit: body.limit,
      threshold: body.threshold,
    });

    return NextResponse.json({ results });
  },
});