import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import AdmZip from 'adm-zip';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        aiUsages: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const decisions = await prisma.decision.findMany({ where: { userId } });
    const hypotheses = await prisma.hypothesis.findMany({ where: { userId } });
    const contacts = await prisma.contact.findMany({ where: { userId } });
    const tasks = await prisma.task.findMany({ where: { userId } });
    const financeEntries = await prisma.financeEntry.findMany({ where: { userId } });
    const interactions = await prisma.interaction.findMany({ where: { userId } });
    const dailyPlans = await prisma.dailyPlan.findMany({ where: { userId } });
    const inboxItems = await prisma.inboxItem.findMany({ where: { userId } });
    const sweepResults = await prisma.sweepResult.findMany({ where: { userId } });
    // const journals = await prisma.journalEntry.findMany({ where: { userId } });

    const zip = new AdmZip();

    // Export as JSON
    zip.addFile('user_profile.json', Buffer.from(JSON.stringify(user, null, 2)));
    zip.addFile('decisions.json', Buffer.from(JSON.stringify(decisions, null, 2)));
    zip.addFile('hypotheses.json', Buffer.from(JSON.stringify(hypotheses, null, 2)));
    zip.addFile('contacts.json', Buffer.from(JSON.stringify(contacts, null, 2)));
    zip.addFile('tasks_roadmap.json', Buffer.from(JSON.stringify(tasks, null, 2)));
    zip.addFile('financeEntries.json', Buffer.from(JSON.stringify(financeEntries, null, 2)));
    zip.addFile('interactions.json', Buffer.from(JSON.stringify(interactions, null, 2)));
    zip.addFile('daily_plans.json', Buffer.from(JSON.stringify(dailyPlans, null, 2)));
    zip.addFile('inbox_items.json', Buffer.from(JSON.stringify(inboxItems, null, 2)));
    zip.addFile('sweepResults.json', Buffer.from(JSON.stringify(sweepResults, null, 2)));

    // Generate buffer
    const zipBuffer = zip.toBuffer();

    const response = new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="helmdash-export-${new Date().toISOString().split('T')[0]}.zip"`
      }
    });

    return response;
  } catch (e: any) {
    logger.error('[Export Error]', e, { userId });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = withAuth(handler);
