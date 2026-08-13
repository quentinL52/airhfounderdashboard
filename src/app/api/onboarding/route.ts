import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method === 'GET') {
    try {
      // Robust fallback: ensure user exists in public.users
      let userRecord = await prisma.user.findUnique({ where: { id: userId } });
      if (!userRecord) {
        const { createClient } = await import('@/utils/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await prisma.user.create({
          data: {
            id: userId,
            email: user?.email || 'unknown@example.com',
          }
        });
      }

      let session = await prisma.onboardingSession.findUnique({
        where: { userId }
      });

      if (!session) {
        session = await prisma.onboardingSession.create({
          data: { userId }
        });
      }

      return NextResponse.json({ session });
    } catch (error: any) {
      logger.error('[Onboarding API] Error', error, { userId });
      return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const GET = withAuth(handler);
