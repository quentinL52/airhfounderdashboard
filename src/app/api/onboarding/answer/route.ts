import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/security';
import { z } from 'zod';
import { generateOnboardingAck, checkBudget } from '@/lib/ai/onboarding-agent';
import { getFollowUp } from '@/lib/onboarding/follow-ups';
import { logger } from '@/lib/logging/logger';

const answerSchema = z.object({
  step: z.number().int().min(1).max(6),
  answer: z.string()
});

async function handler(req: NextRequest, { userId }: { userId: string }) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { step, answer } = answerSchema.parse(body);

      const session = await prisma.onboardingSession.findUnique({ where: { userId } });
      if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const answers = (session.answers as Record<string, any>) || {};
      const followUpsCount = typeof answers['_followUpsCount'] === 'number' ? answers['_followUpsCount'] : 0;
      
      // Check for deterministic follow-ups
      const followUpQuestion = getFollowUp(step, answer, followUpsCount);
      if (followUpQuestion) {
        answers['_followUpsCount'] = followUpsCount + 1;
        
        await prisma.onboardingSession.update({
          where: { userId },
          data: { answers }
        });
        
        return NextResponse.json({ 
          ack: followUpQuestion, 
          nextStep: session.currentStep, 
          session 
        });
      }

      answers[`q${step}`] = answer;

      let ack = "Got it. Let's move on.";
      const useLlmAck = process.env.ONBOARDING_ACKS === 'llm';

      if (useLlmAck && answer.trim().length > 0) {
        const budgetOk = await checkBudget(userId);
        if (budgetOk) {
          try {
            ack = await generateOnboardingAck(step, answer, userId);
          } catch (e) {
            logger.error('[API Onboarding Answer] LLM ACK failed', e, { userId });
          }
        }
      } else if (!useLlmAck) {
          const templates = [
              "Interesting. Let's dig deeper.",
              "That's clear. Next question.",
              "Got it. Moving on.",
              "Understood.",
              "Great vision.",
              "Thanks for sharing. Let's wrap this up."
          ];
          ack = templates[step - 1] || "Got it.";
      }

      // If re-answering a previous question, don't advance the global step
      const nextStep = step === session.currentStep ? step + 1 : session.currentStep;
      const status = nextStep > 6 ? 'recap' : 'in_progress';

      const updatedSession = await prisma.onboardingSession.update({
        where: { userId },
        data: {
          answers,
          currentStep: nextStep,
          status
        }
      });

      return NextResponse.json({ ack, nextStep: updatedSession.currentStep, session: updatedSession });
    } catch (e: any) {
      logger.error('[API Onboarding Answer] Error', e, { userId });
      return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const POST = withAuth(handler);
