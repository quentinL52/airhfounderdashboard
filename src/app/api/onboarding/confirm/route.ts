import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { SynthesisSchema } from '@/lib/ai/onboarding-agent';
import { GamificationService, QUESTS } from '@/services/gamification.service';
import { z } from 'zod';
import { logger } from '@/lib/logging/logger';

const confirmSchema = z.object({
  synthesis: SynthesisSchema,
  optInWeekly: z.boolean().default(false),
  optInJournal: z.boolean().default(true),
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { synthesis, optInWeekly, optInJournal } = confirmSchema.parse(body);

      await prisma.$transaction(async (tx) => {
        // 1. Canvas Sections
        const canvasMap = {
          problem: synthesis.canvas.problem,
          solution: synthesis.canvas.solution,
          customerSegments: synthesis.canvas.customerSegments,
          revenueStreams: synthesis.canvas.revenueStreams,
        };

        for (const [sectionId, content] of Object.entries(canvasMap)) {
          await tx.leanCanvasSection.upsert({
            where: { userId_sectionId: { userId, sectionId: sectionId as any } },
            update: { content },
            create: { userId, sectionId: sectionId as any, content }
          });
        }

        // 2. Hypotheses
        for (const hyp of synthesis.hypotheses) {
          await tx.hypothesis.create({
            data: {
              userId,
              statement: hyp.title,
              successCriteria: hyp.successCriteria,
              category: 'problem',
              riskLevel: 'high',
              testMethod: 'TBD via Onboarding',
              status: 'draft'
            }
          });
        }

        // 3. Milestone
        await tx.roadmapItem.create({
          data: {
            userId,
            title: synthesis.milestone.title,
            status: 'todo',
            priority: 'high',
            dueDate: synthesis.milestone.targetDate ? new Date(synthesis.milestone.targetDate) : null
          }
        });

        // 4. Memory Note
        await tx.memoryNote.create({
          data: {
            userId,
            content: synthesis.founderProfile,
            type: 'founder_profile',
            source: 'onboarding',
            tags: ['onboarding', 'profile']
          }
        });

        // 4b. Dilemma Decision (if any)
        if (synthesis.dilemma) {
          await tx.decision.create({
            data: {
              userId,
              title: "Dilemme Stratégique Initial",
              context: synthesis.dilemma,
              category: "structural",
              options: ["À définir"],
              status: "open"
            }
          });
        }

        // 5. Update Session
        await tx.onboardingSession.update({
          where: { userId },
          data: {
            briefOptIn: optInWeekly,
            journalOptIn: optInJournal,
            status: 'completed',
            completedAt: new Date()
          }
        });

        // 6. Update User
        await tx.user.update({
          where: { id: userId },
          data: { 
            onboardedAt: new Date(),
            mvpTargetDate: synthesis.milestone.targetDate ? new Date(synthesis.milestone.targetDate) : null
          }
        });
      });

      // 7. Gamification
      await GamificationService.completeQuest(userId, QUESTS.ONBOARDING_PROFILE);

      return NextResponse.json({ ok: true });
    } catch (e: any) {
      logger.error('[API Onboarding Confirm] Error', e, { userId });
      return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const POST = withAuth(handler);
