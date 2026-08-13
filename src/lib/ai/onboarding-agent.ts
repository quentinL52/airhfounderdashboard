import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

function getOnboardingModel() {
  const configValue = process.env.ONBOARDING_MODEL || 'mistral-small-latest';
  
  if (configValue.startsWith('gpt')) return openai(configValue);
  if (configValue.startsWith('claude')) return anthropic(configValue);
  if (configValue.startsWith('gemini')) return google(configValue);
  return mistral(configValue);
}

export async function logAiCost(userId: string, tokens: number, model: string, scope: string) {
  const costEstimate = (tokens / 1_000_000) * 0.20;
  await prisma.aiCostLog.create({
    data: {
      userId,
      scope,
      tokens,
      model,
      costEstimate
    }
  });
}

export async function checkBudget(userId: string): Promise<boolean> {
  const logs = await prisma.aiCostLog.findMany({
    where: { userId, scope: 'onboarding' }
  });
  const totalTokens = logs.reduce((sum, log) => sum + log.tokens, 0);
  return totalTokens < 15000;
}

export async function generateOnboardingAck(step: number, answer: string, userId: string): Promise<string> {
  const modelName = process.env.ONBOARDING_MODEL || 'mistral-small-latest';
  const { text, usage } = await generateText({
    model: getOnboardingModel(),
    system: `You are Helmdash, a dynamic, pragmatic, and highly capable AI co-founder. 
Your tone must adapt to the user's input: if they seem unsure, be encouraging and reassuring; if they are confident, be sharp and direct. 
Always remain extremely concise (1 line max). You are responding to their answer for step ${step} of the startup onboarding.
Acknowledge their answer briefly to keep the momentum going. Do not ask follow-up questions. DO NOT use emojis.`,
    prompt: `User answer for step ${step}: "${answer}"`,
    temperature: 0.3,
  });

  await logAiCost(userId, usage.totalTokens ?? 0, modelName, 'onboarding');
  return text.trim();
}

export const SynthesisSchema = z.object({
  canvas: z.object({
    problem: z.string(),
    solution: z.string(),
    customerSegments: z.string(),
    revenueStreams: z.string(),
  }),
  hypotheses: z.array(z.object({
    title: z.string(),
    successCriteria: z.string(),
  })).length(2),
  milestone: z.object({
    title: z.string(),
    targetDate: z.string().nullable().describe("ISO date string for 90 days from now"),
  }),
  founderProfile: z.string().describe("A customized, dynamic summary of who the founder is based on their answers."),
  dilemma: z.string().nullable().optional().describe("If the user's answers reveal a tough choice, trade-off, or strategic dilemma, summarize it here (e.g. 'Build generic vs niche?'). Otherwise null."),
});

export type OnboardingSynthesis = z.infer<typeof SynthesisSchema>;

export async function synthesizeOnboarding(answers: Record<string, string>, userId: string): Promise<OnboardingSynthesis> {
  const modelName = process.env.ONBOARDING_MODEL || 'mistral-small-latest';
  const { object, usage } = await generateObject({
    model: getOnboardingModel(),
    schema: SynthesisSchema,
    system: `You are Helmdash, an expert AI co-founder. Synthesize the user's answers into structured startup data.
The founderProfile should be written in a dynamic, tailored tone (encouraging if they lack confidence, sharp if they are determined). Keep it concise.`,
    prompt: `Here are the answers to the 6 onboarding questions:\n${JSON.stringify(answers, null, 2)}`
  });

  await logAiCost(userId, usage.totalTokens ?? 0, modelName, 'onboarding');
  return object;
}
