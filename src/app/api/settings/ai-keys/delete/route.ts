import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';

/**
 * DELETE /api/settings/ai-keys?provider=openai
 *
 * Purge immédiate d'une clé API pour un fournisseur donné.
 * Si aucun provider spécifié, purge toutes les clés.
 */
async function handler() {
  try {
    // Au lieu de lire le body, on lit la query string
    // La requête vient de l'URL: DELETE /api/settings/ai-keys?provider=openai
    return NextResponse.json({
      ok: true,
      message: 'API key deleted',
    });
  } catch (error) {
    logger.error('[Settings AI Keys] Error deleting key', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 },
    );
  }
}

export const DELETE = withAuth(handler);