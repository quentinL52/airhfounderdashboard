import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { validateTabData, getPrismaModel } from '@/lib/ai/tools/dashboard-tools';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

const captureSchema = z.object({
  tabName: z.enum(['finances', 'hypotheses', 'gtm', 'crm', 'roadmap', 'canvas', 'decisions', 'inbox', 'dailyplan']),
  payload: z.record(z.any()),
});

async function handler(
  req: NextRequest,
  { userId }: { userId: string }
) {
  try {
    const body = await req.json();
    const result = captureSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Payload invalide', details: result.error }, { status: 400 });
    }

    const { tabName, payload } = result.data;

    let validatedData;
    try {
      validatedData = validateTabData(tabName, payload);
    } catch (error: any) {
      return NextResponse.json({ error: 'Données invalides', details: error.message }, { status: 400 });
    }

    const PrismaModel = await getPrismaModel(tabName);
    
    // Create the record
    await PrismaModel.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    // Mark as accepted immediately since it's a 1-click capture
    await prisma.agentProposal.create({
      data: {
        userId,
        source: 'auto_capture',
        tabName,
        action: 'create',
        payload: validatedData,
        status: 'accepted',
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in POST /api/ai/proposals/capture', error, { userId });
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
