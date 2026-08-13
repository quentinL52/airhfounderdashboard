import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, isStepCount } from 'ai';
import { CoreAgent } from '@/modules/agent';
import { withAuth, withRateLimit } from '@/lib/security';
import { assertQuota, recordAiAction } from '@/lib/billing/metering';

export const maxDuration = 60;

/**
 * POST /api/ai/chat/stream
 *
 * Streams AI responses with full tool access.
 * Authenticated via Supabase session — userId is NEVER read from the client body.
 * Rate-limited to 30 req/min/user.
 *
 * AI SDK v7 uses UIMessage format (parts-based) from the frontend.
 * We convert to ModelMessages via convertToModelMessages before passing to streamText.
 */
async function handler(
  req: NextRequest,
  { userId }: { userId: string },
) {
  try {
        try {
            await assertQuota(userId);
        } catch (e: any) {
            if (e.code === 'quota_reached') {
                return NextResponse.json({ code: 'quota_reached', error: 'AI actions limit reached for this month.' }, { status: 403 });
            }
            throw e;
        }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 },
      );
    }

    const { aiGateway, QuotaExceededError } = await import('@/modules/shared/infrastructure/ai/ai-gateway');
    await aiGateway.checkQuota(userId);

    // Instantiate the core agent with the authenticated userId
    const agent = new CoreAgent(userId);
    const tools = agent.getTools();
    const systemPrompt = await agent.buildSystemPrompt();
    
    // Retrieve dynamic API key configuration (BYOK or fallback)
    const providerConfig = await agent.getProviderConfig();
    const customOpenai = createOpenAI({ apiKey: providerConfig.apiKey });
    const modelName = providerConfig.modelsConfig?.defaultModel || 'gpt-4o';

    // Ensure messages have the parts format that AI SDK v7 expects.
    // The frontend sends { role, parts: [{ type: 'text', text }] }.
    // If for some reason we receive old format { role, content }, normalize to parts.
    const uiMessages = messages.map((m: any) => {
      if (m.parts && Array.isArray(m.parts)) {
        return m; // Already in UIMessage format
      }
      // Legacy format: convert content to parts
      return {
        ...m,
        parts: [{ type: 'text' as const, text: m.content || '' }],
      };
    });

    // Convert UIMessages to ModelMessages for streamText (async in SDK v7)
    const modelMessages = await convertToModelMessages(uiMessages);

    // Stream with AI SDK
    const result = streamText({
      model: customOpenai(modelName as string),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      onFinish: async ({ usage }) => {
        await recordAiAction(userId, 'chat-stream', usage?.totalTokens || 0, 'gpt-4o').catch(console.error);
      },
      onError: (error) => {
        logger.error('[Chat Stream] Error', error, { userId });
      },
      onFinish: async ({ text }) => {
        try {
          await aiGateway.recordUsage(userId);

          const { prisma } = await import('@/lib/prisma');
          const lastUserMessage = uiMessages[uiMessages.length - 1];
          
          // Extract text content from last user message for storage
          const lastUserText = lastUserMessage?.parts
            ?.filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('') || '';

          if (conversationId && lastUserText) {
            // Upsert conversation to ensure it exists
            const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
            if (!conv) {
              await prisma.conversation.create({
                data: {
                  id: conversationId,
                  userId,
                  title: lastUserText.substring(0, 50) + '...',
                }
              });
            }

            await prisma.message.createMany({
              data: [
                { conversationId, role: lastUserMessage.role, content: lastUserText },
                { conversationId, role: 'assistant', content: text }
              ]
            });
          }
        } catch (err) {
          logger.error('[Chat Stream onFinish] Error', err, { userId });
        }
      }
    });

    return result.toUIMessageStreamResponse() as unknown as NextResponse;
  } catch (error) {
    logger.error('Error in chat stream route', error, { userId });
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

// Wrap with auth + rate limit (30 req/min per user, scope "chat-stream")
export const POST = withAuth(withRateLimit(handler, { rpm: 30, scope: 'chat-stream' }));