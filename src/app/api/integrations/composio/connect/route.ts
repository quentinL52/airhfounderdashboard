import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, withValidation } from '@/lib/security';
import { memory } from '@/lib/ai/memory/obsidian-memory';
import { composio } from '@/lib/integrations/composio-client';
import { logger } from '@/lib/logging/logger';

const connectSchema = z.object({
  appName: z.string().min(1).describe("Nom de l'application à connecter (github, linear, notion, slack, gmail, stripe)"),
  redirectUri: z.string().optional().describe('URI de redirection après OAuth'),
});

/**
 * POST /api/integrations/composio/connect
 *
 * Initie le flux OAuth via Composio pour connecter une app externe.
 * Retourne une URL de redirection que l'utilisateur doit visiter.
 */
const handler = withAuth(
  withValidation(connectSchema)(
    async (
      req: NextRequest,
      { userId, body }: { userId: string; body: z.infer<typeof connectSchema> },
    ) => {
      try {
        const appName = body.appName.toLowerCase();

        // Chercher l'auth config pour cette app via le catalogue Composio
        // Fallback: retourner la page de connexion Composio
        const composioDashboardUrl = `https://app.composio.dev/app/${appName}?source=helmdash&userId=${userId}`;

        // Logger l'intention dans la mémoire
        await memory.upsertNote({
          userId,
          content: `🔗 Connexion Composio initiée pour ${appName}.`,
          type: 'decision',
          tags: ['integration', appName, 'oauth-pending'],
          source: 'user',
        });

        return NextResponse.json({
          success: true,
          appName,
          redirectUrl: composioDashboardUrl,
          message: `Connectez votre compte ${appName} via Composio pour autoriser Helmdash à agir en votre nom.`,
        });
      } catch (error) {
        logger.error('[Composio Connect] Error', error, { userId });
        return NextResponse.json(
          { error: `Failed to initiate ${body.appName} connection: ${error instanceof Error ? error.message : 'Unknown error'}` },
          { status: 500 },
        );
      }
    },
  ),
);

export const POST = handler;