import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security/with-auth';
import { sendDeletionScheduledEmail } from '@/lib/email/email-service';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { logger } from '@/lib/logging/logger';

const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Soft delete côté Prisma
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: new Date(),
        planStatus: 'readonly'
      }
    });

    // 2. Envoi de l'email
    try {
      await sendDeletionScheduledEmail(user.email, user.name);
    } catch (err) {
      logger.error('[DELETE_ACCOUNT] Failed to send deletion scheduled email', err, { userId });
    }

    // 3. Invalidation des sessions
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await supabaseAdmin.auth.admin.signOut(token, 'global').catch(e => {
        logger.error('[DELETE_ACCOUNT] Failed to invalidate sessions', e, { userId });
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error('[DELETE_ACCOUNT_ERROR]', error, { userId });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const DELETE = withAuth(handler);
