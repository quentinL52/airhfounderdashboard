import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { composio, AVAILABLE_TOOLS } from '@/lib/integrations/composio-client';
import { logger } from '@/lib/logging/logger';

/**
 * GET /api/integrations/composio/list
 *
 * Liste toutes les intégrations Composio disponibles et leur statut
 * de connexion pour l'utilisateur authentifié.
 */
async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    // Récupérer toutes les connexions actives de l'utilisateur
    const userConnections = await composio.connectedAccounts.list({
      userIds: [userId],
    });

    const connectedApps = new Set(
      (userConnections.items || []).map((c: any) => c.appName?.toLowerCase()),
    );

    const integrations = Object.entries(AVAILABLE_TOOLS).map(([app, tools]) => ({
      app,
      tools,
      status: connectedApps.has(app) ? 'connected' : 'disconnected',
    }));

    return NextResponse.json({
      integrations,
      total: integrations.length,
      connected: integrations.filter((i) => i.status === 'connected').length,
    });
  } catch (error) {
    logger.error('[Composio List] Error', error, { userId });
    return NextResponse.json(
      { error: 'Failed to list integrations' },
      { status: 500 },
    );
  }
}

export const GET = withAuth(handler);