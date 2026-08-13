import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { synthesizeOnboarding, checkBudget } from '@/lib/ai/onboarding-agent';
import { logger } from '@/lib/logging/logger';

function generateDegradedSynthesis(answers: Record<string, string>) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  
  return {
    canvas: {
      problem: answers['q3'] || 'Your target problem (connect AI to refine)',
      solution: answers['q1'] || 'Your solution (connect AI to refine)',
      customerSegments: answers['q3'] || 'Target users (connect AI to refine)',
      revenueStreams: answers['q6'] || 'Revenue streams (connect AI to refine)',
    },
    hypotheses: [
      {
        title: 'Validate the core uncertainty',
        successCriteria: answers['q4'] || 'To be defined based on your biggest risk.'
      },
      {
        title: 'Acquire first users',
        successCriteria: 'Get 10 active users.'
      }
    ],
    milestone: {
      title: answers['q5'] || 'Reach 90-day goal',
      targetDate: futureDate.toISOString()
    },
    founderProfile: `Current state: ${answers['q2'] || 'Starting up'}. (Connect AI to generate full profile).`
  };
}

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method === 'POST') {
    try {
      const session = await prisma.onboardingSession.findUnique({ where: { userId } });
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const answers = (session.answers as Record<string, string>) || {};
      
      let synthesis;
      let isDegraded = false;
      const budgetOk = await checkBudget(userId);

      if (budgetOk) {
        try {
          synthesis = await synthesizeOnboarding(answers, userId);
        } catch (e) {
          logger.error('[API Onboarding Synthesize] LLM failed, using degraded mode', e, { userId });
          synthesis = generateDegradedSynthesis(answers);
          isDegraded = true;
        }
      } else {
        synthesis = generateDegradedSynthesis(answers);
        isDegraded = true;
      }

      const updatedSession = await prisma.onboardingSession.update({
        where: { userId },
        data: {
          draftOutput: synthesis,
          status: 'recap'
        }
      });

      return NextResponse.json({ synthesis, isDegraded, session: updatedSession });
    } catch (e: any) {
      logger.error('[API Onboarding Synthesize] Error', e, { userId });
      return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const POST = withAuth(handler);
