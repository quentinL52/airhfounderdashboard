import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export async function GET(req: NextRequest) {
  let token: string | null = null;
  try {
    const { searchParams } = new URL(req.url);
    token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/?error=invalid_token', req.url));
    }

    // Recherche de l'entrée Waitlist avec l'id = token
    const entry = await prisma.waitlist.findUnique({
      where: { id: token },
    });

    if (!entry) {
      return NextResponse.redirect(new URL('/?error=invalid_token', req.url));
    }

    if (entry.status === 'confirmed') {
      // Déjà confirmé, on redirige vers la page de remerciement
      return NextResponse.redirect(new URL('/thank-you', req.url));
    }

    // Mise à jour du statut
    await prisma.waitlist.update({
      where: { id: token },
      data: { status: 'confirmed' },
    });

    // Redirection vers la page de remerciement
    return NextResponse.redirect(new URL('/thank-you', req.url));
  } catch (error) {
    logger.error('Waitlist confirm error', error, { token: token ?? undefined });
    return NextResponse.redirect(new URL('/?error=internal_error', req.url));
  }
}
