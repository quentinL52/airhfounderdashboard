import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security/with-auth';
import { createPortalSession } from '@/modules/billing';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    const result = await createPortalSession(userId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (error: any) {
    logger.error('Error creating portal session', error, { userId });
    return NextResponse.json({ error: error.message || 'Portal creation failed' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
