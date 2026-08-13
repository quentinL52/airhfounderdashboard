import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';

const apiKey = process.env.AI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const tavilyApiKey = process.env.TAVILY_API_KEY;

async function tavilyExtract(url: string) {
    if (!tavilyApiKey) return null;
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyApiKey,
                query: `site:${url} company product features pricing`,
                search_depth: 'advanced',
                include_answer: true,
                max_results: 5,
            }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        logger.error('Tavily extract failed', error);
        return null;
    }
}

async function handler(req: NextRequest, { userId }: { userId: string }) {
    if (!openai) {
        return NextResponse.json({ error: 'AI API Key missing' }, { status: 500 });
    }

    try {
        const { url, language = 'fr' } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Extract website content via Tavily
        const tavilyResult = await tavilyExtract(url);
        const websiteContent = tavilyResult
            ? JSON.stringify(tavilyResult.results?.slice(0, 3) || [])
            : 'No web content available';

        const systemPrompt = `You are an expert competitive intelligence analyst.
Extract structured information about a company from the provided website content.
Return ONLY a valid JSON object with the following fields (use null for unknown fields):

{
    "name": "Company name",
    "description": "Brief description of the company and its product (2-3 sentences)",
    "positioning": "Market positioning statement",
    "targetSegment": "Target customer segment",
    "businessModel": "Business model type (e.g. SaaS B2B, Marketplace, etc.)",
    "keyFeatures": ["feature1", "feature2", "feature3"],
    "differentiators": ["differentiator1", "differentiator2"],
    "pricingModel": "free" | "freemium" | "subscription" | "usage" | "enterprise" | "other",
    "pricingRange": "Price range string (e.g. $29-99/mo)",
    "pricing": "Summary of pricing approach",
    "strengths": "Perceived strengths (1-2 sentences)",
    "weaknesses": "Perceived weaknesses or gaps (1-2 sentences)",
    "teamSize": "Estimated team size range",
    "fundingStage": "Funding stage if known",
    "fundingAmount": "Funding amount if known",
    "yearFounded": "Year founded if known",
    "geography": "Geographic focus",
    "radarScores": {
        "price": 5,
        "features": 5,
        "ux": 5,
        "market": 5,
        "innovation": 5,
        "support": 5
    }
}

Radar scores should be 1-10 based on your assessment of the content.
Write descriptions in ${language === 'fr' ? 'French' : 'English'}.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `Analyze this company website: ${url}\n\nWebsite content:\n${websiteContent}`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
        });

        const content = response.choices[0].message.content;
        const profile = JSON.parse(content || '{}');

        return NextResponse.json(profile);
    } catch (error) {
        logger.error('Competitor Profile Error', error, { userId });
        return NextResponse.json(
            { error: 'Failed to extract competitor profile' },
            { status: 500 }
        );
    }
}

export const POST = withAuth(handler);
