import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { executeComposioTool } from '@/lib/integrations/composio-client';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const databaseId = body.databaseId;

    if (!databaseId) {
      return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
    }

    let notionPages: any;
    
    try {
      const result = await executeComposioTool('notion_query_database', { database_id: databaseId }, userId);
      notionPages = result.data?.results || [];
    } catch (e: any) {
      logger.warn('[Notion Sync] Composio error', { userId, message: e.message });
      // Fallback for MVP if not connected
      notionPages = [];
    }

    let importedCount = 0;

    for (const page of notionPages) {
      // Basic extraction assuming standard 'Name' or 'title' property
      let title = 'Untitled Notion Page';
      let status = 'todo';
      
      if (page.properties) {
        // Try to find a title property
        const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
        if (titleProp && titleProp.title && titleProp.title.length > 0) {
          title = titleProp.title[0].plain_text;
        }

        // Try to find a status property
        const statusProp = Object.values(page.properties).find((p: any) => p.type === 'status' || p.type === 'select') as any;
        if (statusProp) {
          if (statusProp.type === 'status' && statusProp.status) {
            status = statusProp.status.name.toLowerCase();
          } else if (statusProp.type === 'select' && statusProp.select) {
            status = statusProp.select.name.toLowerCase();
          }
        }
      }

      // Map to a task in the roadmap
      const mappedStatus = ['todo', 'in_progress', 'done'].includes(status) ? status : 'todo';
      
      // Avoid duplicates: Check if task with this title already exists for this user
      const existingTask = await prisma.task.findFirst({
        where: {
          userId,
          title
        }
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            userId,
            title,
            status: mappedStatus,
            dueDate: new Date()
          }
        });
        importedCount++;
      }
    }

    return NextResponse.json({ success: true, count: importedCount });
  } catch (e: any) {
    logger.error('[Notion Import Error]', e, { userId });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const POST = withAuth(handler);
