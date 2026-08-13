import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { CanvasSection } from '@prisma/client';
import { logger } from '@/lib/logging/logger';

const actionSchema = z.object({
  action: z.enum(['updateSection']),
  payload: z.object({
    sectionId: z.string(),
    content: z.string()
  }),
});

const mapFrontendToBackend = (frontendId: string): CanvasSection | null => {
  switch (frontendId) {
    case 'Problem': return 'problem';
    case 'Solution': return 'solution';
    case 'Key Metrics': return 'keyMetrics';
    case 'Unique Value Proposition': return 'uvp';
    case 'Unfair Advantage': return 'unfairAdvantage';
    case 'Channels': return 'channels';
    case 'Customer Segments': return 'customerSegments';
    case 'Cost Structure': return 'costStructure';
    case 'Revenue Streams': return 'revenueStreams';
    default: return null;
  }
};

const mapBackendToFrontend = (backendId: CanvasSection): string => {
  switch (backendId) {
    case 'problem': return 'Problem';
    case 'solution': return 'Solution';
    case 'keyMetrics': return 'Key Metrics';
    case 'uvp': return 'Unique Value Proposition';
    case 'unfairAdvantage': return 'Unfair Advantage';
    case 'channels': return 'Channels';
    case 'customerSegments': return 'Customer Segments';
    case 'costStructure': return 'Cost Structure';
    case 'revenueStreams': return 'Revenue Streams';
    default: return backendId;
  }
};

async function handler(req: NextRequest, { userId }: { userId: string }) {
  try {
    if (req.method === 'GET') {
      const sections = await prisma.leanCanvasSection.findMany({ where: { userId } });
      const canvasData: Record<string, string> = {};
      sections.forEach(sec => {
        canvasData[mapBackendToFrontend(sec.sectionId)] = sec.content;
      });
      return NextResponse.json({ canvasData });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, payload } = actionSchema.parse(body);

      switch (action) {
        case 'updateSection':
          const sectionKey = mapFrontendToBackend(payload.sectionId);
          if (!sectionKey) {
            return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
          }

          await prisma.leanCanvasSection.upsert({
            where: {
              userId_sectionId: {
                userId,
                sectionId: sectionKey
              }
            },
            update: {
              content: payload.content,
              updatedAt: new Date()
            },
            create: {
              userId,
              sectionId: sectionKey,
              content: payload.content
            }
          });
          break;

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error: any) {
    logger.error('[API Data Canvas] Error', error, { userId });
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(handler);
