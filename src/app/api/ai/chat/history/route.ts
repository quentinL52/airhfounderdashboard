import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';
import { agentRepository } from '@/modules/agent/infrastructure';

async function handler(
  req: NextRequest,
  { userId }: { userId: string },
) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const conversation = await agentRepository.getConversation(conversationId, userId);

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      return NextResponse.json({ conversation });
    } else {
      const conversations = await agentRepository.listConversations(userId, 20);

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    logger.error('Error fetching chat history', error, { userId });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
