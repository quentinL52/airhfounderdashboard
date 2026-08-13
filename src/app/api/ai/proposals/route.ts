import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { validateTabData, getPrismaModel } from '@/lib/ai/tools/dashboard-tools';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

const executeProposalSchema = z.object({
  proposalId: z.string().uuid(),
  userAction: z.enum(['accept', 'reject', 'edit']),
  payload: z.record(z.any()).optional(), // Provided if userAction is 'edit' or 'accept' (in case of edit then accept)
});

async function handler(
  req: NextRequest,
  { userId }: { userId: string }
) {
  try {
    const body = await req.json();
    const result = executeProposalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Payload invalide', details: result.error }, { status: 400 });
    }

    const { proposalId, userAction, payload } = result.data;

    // Fetch the proposal
    const proposal = await prisma.agentProposal.findUnique({
      where: { id: proposalId, userId },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposition introuvable' }, { status: 404 });
    }

    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: 'Cette proposition a déjà été traitée' }, { status: 400 });
    }

    if (userAction === 'reject') {
      await prisma.agentProposal.update({
        where: { id: proposalId },
        data: { status: 'rejected' },
      });
      return NextResponse.json({ success: true, message: 'Proposition rejetée' });
    }

    // Accept or Edit (both lead to execution)
    const finalPayload = payload || (proposal.payload as Record<string, any>);
    
    // Validate the data against the tab schema
    let validatedData;
    try {
      validatedData = validateTabData(proposal.tabName as any, finalPayload);
    } catch (error: any) {
      return NextResponse.json({ error: 'Données invalides', details: error.message }, { status: 400 });
    }

    const PrismaModel = await getPrismaModel(proposal.tabName as any);
    let recordResult;

    switch (proposal.action) {
      case 'create':
      case 'update':
        if (proposal.tabName === 'canvas') {
          recordResult = await PrismaModel.upsert({
            where: {
              userId_sectionId: {
                userId,
                sectionId: finalPayload.sectionId,
              },
            },
            update: { content: finalPayload.content },
            create: {
              userId,
              sectionId: finalPayload.sectionId,
              content: finalPayload.content,
            },
          });
          break;
        }
        if (proposal.tabName === 'gtm') {
          recordResult = await PrismaModel.upsert({
            where: { userId },
            update: validatedData,
            create: { ...validatedData, userId },
          });
          break;
        }

        if (proposal.action === 'create') {
          recordResult = await PrismaModel.create({
            data: {
              ...validatedData,
              userId,
            },
          });
        } else {
          if (!finalPayload.id) {
            return NextResponse.json({ error: 'ID requis pour update' }, { status: 400 });
          }
          const existing = await PrismaModel.findUnique({ where: { id: finalPayload.id } });
          if (!existing || existing.userId !== userId) {
            return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 403 });
          }
          recordResult = await PrismaModel.update({
            where: { id: finalPayload.id },
            data: validatedData,
          });
        }
        break;

      case 'delete':
        if (proposal.tabName === 'canvas') {
          recordResult = await PrismaModel.delete({
            where: {
              userId_sectionId: {
                userId,
                sectionId: finalPayload.sectionId,
              },
            },
          });
          break;
        }
        if (proposal.tabName === 'gtm') {
          recordResult = await PrismaModel.delete({
            where: { userId },
          });
          break;
        }

        if (!finalPayload.id) {
          return NextResponse.json({ error: 'ID requis pour delete' }, { status: 400 });
        }
        const toDelete = await PrismaModel.findUnique({ where: { id: finalPayload.id } });
        if (!toDelete || toDelete.userId !== userId) {
          return NextResponse.json({ error: 'Non autorisé ou introuvable' }, { status: 403 });
        }
        recordResult = await PrismaModel.delete({
          where: { id: finalPayload.id },
        });
        break;

      default:
        return NextResponse.json({ error: 'Action non supportée' }, { status: 400 });
    }

    // Mark as accepted
    await prisma.agentProposal.update({
      where: { id: proposalId },
      data: { status: 'accepted', payload: validatedData },
    });

    return NextResponse.json({ success: true, record: recordResult });
  } catch (error: any) {
    logger.error('[Proposals API Error]', error, { userId });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
