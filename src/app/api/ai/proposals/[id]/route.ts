import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { getPrismaModel } from '@/lib/ai/tools/dashboard-tools';

async function handler(
  req: NextRequest,
  context: { params?: { id: string }; userId: string },
) {
  const params = context.params;
  const userId = context.userId;
  if (!params?.id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const proposal = await prisma.agentProposal.findUnique({
      where: { id: params.id, userId },
    });

    if (!proposal) {
      await prisma.$disconnect();
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (req.method === 'GET') {
      await prisma.$disconnect();
      return NextResponse.json(proposal);
    }

    if (req.method === 'POST') {
      const { action } = await req.json();
      
      if (proposal.status !== 'pending') {
        await prisma.$disconnect();
        return NextResponse.json({ error: 'Proposal already processed' }, { status: 400 });
      }

      if (action === 'reject') {
        const updated = await prisma.agentProposal.update({
          where: { id: proposal.id },
          data: { status: 'rejected' },
        });
        await prisma.$disconnect();
        return NextResponse.json(updated);
      }

      if (action === 'confirm') {
        const PrismaModel = await getPrismaModel(proposal.domain as any);
        let result;
        const data = proposal.payload as any;

        switch (proposal.action) {
          case 'create':
            result = await PrismaModel.create({
              data: { ...data, userId },
            });
            break;
          case 'update':
            result = await PrismaModel.update({
              where: { id: data.id, userId },
              data,
            });
            break;
          case 'delete':
            result = await PrismaModel.delete({
              where: { id: data.id, userId },
            });
            break;
        }

        const updated = await prisma.agentProposal.update({
          where: { id: proposal.id },
          data: { status: 'confirmed' },
        });
        await prisma.$disconnect();
        return NextResponse.json({ success: true, proposal: updated, result });
      }

      await prisma.$disconnect();
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Proposal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
