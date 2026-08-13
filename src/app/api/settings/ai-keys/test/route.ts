import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withAuth, withValidation } from '@/lib/security';
import { logger } from '@/lib/logging/logger';

const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'] as const;

const testSchema = z.object({
  provider: z.enum(PROVIDERS),
});

/**
 * POST /api/settings/ai-keys/test
 *
 * Teste une clé API en effectuant un appel minimal au provider.
 * Ne retourne JAMAIS la clé — seulement {ok: true} ou une erreur.
 */
async function handler(
  req: NextRequest,
  { userId, body }: { userId: string; body: z.infer<typeof testSchema> },
) {
  try {
    const settings = await prisma.aiSettings.findUnique({
      where: { userId },
      select: { apiKey: true, provider: true },
    });

    if (!settings?.apiKey) {
      return NextResponse.json(
        { error: `No API key configured for ${body.provider}` },
        { status: 404 },
      );
    }

    // Decrypt the stored key
    const { decryptApiKey } = await import('@/lib/ai/api-key-encryption');
    const apiKey = await decryptApiKey(settings.apiKey, userId);

    // Test the provider with a minimal call
    let ok = false;
    try {
      switch (body.provider) {
        case 'openai': {
          const resp = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          ok = resp.ok;
          break;
        }
        case 'anthropic': {
          const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'hi' }],
            }),
          });
          ok = resp.ok;
          break;
        }
        case 'google': {
          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
          );
          ok = resp.ok;
          break;
        }
        case 'mistral': {
          const resp = await fetch('https://api.mistral.ai/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          ok = resp.ok;
          break;
        }
      }
    } catch (testErr) {
      return NextResponse.json(
        {
          ok: false,
          error: `Provider test failed: ${testErr instanceof Error ? testErr.message : 'Unknown error'}`,
        },
        { status: 502 },
      );
    }

    if (!ok) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Provider rejected the API key. Check that it is valid and has the correct permissions.',
        },
        { status: 401 },
      );
    }

    return NextResponse.json({ ok: true, provider: body.provider });
  } catch (error) {
    logger.error('[Settings AI Keys Test] Error', error, { userId });
    return NextResponse.json(
      { error: 'Failed to test API key' },
      { status: 500 },
    );
  }
}

export const POST = withAuth(withValidation(testSchema)(handler));
