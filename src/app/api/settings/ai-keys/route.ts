import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createApiEndpoint } from '@/lib/api/create-api-endpoint';

const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'] as const;

const upsertSchema = z.object({
  provider: z.enum(PROVIDERS),
  apiKey: z.string().min(1, 'API key is required'),
  activeAgents: z.array(z.string()).optional(),
  modelsConfig: z.record(z.unknown()).optional(),
});

/**
 * GET /api/settings/ai-keys
 *
 * Recupère la liste des fournisseurs IA configurés pour l'utilisateur.
 */
export const GET = createApiEndpoint({
  async handler(req, { userId }) {
    const keys = await prisma.aiSettings.findMany({
      where: { userId },
      select: { provider: true },
    });
    return NextResponse.json({
      ok: true,
      configuredProviders: keys.map((k) => k.provider),
    });
  },
});

/**
 * PUT /api/settings/ai-keys
 *
 * Enregistre ou met à jour une clé API pour un fournisseur IA.
 * La clé est chiffrée via AES-256-GCM avant stockage (api-key-encryption.ts).
 * Ne retourne JAMAIS la clé en clair dans la réponse.
 */
export const PUT = createApiEndpoint({
  bodySchema: upsertSchema,
  async handler(req, { userId, body }) {
    const { encryptApiKey } = await import('@/lib/ai/api-key-encryption');
    const encryptedApiKey = await encryptApiKey(body.apiKey, userId);

    // Store as JSON string (encrypt returns {iv, content, tag})
    const apiKeyStr = JSON.stringify(encryptedApiKey);

    await prisma.aiSettings.upsert({
      where: { userId },
      create: {
        userId,
        provider: body.provider,
        apiKey: apiKeyStr,
        activeAgents: body.activeAgents ? (body.activeAgents as any) : undefined,
        modelsConfig: body.modelsConfig ? (body.modelsConfig as any) : undefined,
      },
      update: {
        provider: body.provider,
        apiKey: apiKeyStr,
        activeAgents: body.activeAgents ? (body.activeAgents as any) : undefined,
        modelsConfig: body.modelsConfig ? (body.modelsConfig as any) : undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: body.provider,
      message: `API key for ${body.provider} configured and encrypted.`,
    });
  },
});