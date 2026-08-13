import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Vérification de l'admin par email
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'quentin@helmdash.com').split(',');
  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ users });
}

export const GET = withAuth(handler);
