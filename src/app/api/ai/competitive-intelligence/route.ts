import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/lib/security';
import { assertQuota, recordAiAction } from '@/lib/billing/metering';

const apiKey = process.env.AI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const tavilyApiKey = process.env.TAVILY_API_KEY;

async function tavilySearch(query: string) {
    if (!tavilyApiKey) return [];
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: tavilyApiKey,
                query,
                search_depth: 'basic',
                include_answer: false,
                max_results: 3,
            }),
        });
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        logger.error('Tavily search failed', error);
        return [];
    }
}

async function handler(req: NextRequest, { userId }: { userId: string }) {
    if (!openai) {
        return NextResponse.json({ error: 'AI API Key missing' }, { status: 500 });
    }

    try {
        try {
            await assertQuota(userId);
        } catch (e: any) {
            if (e.code === 'quota_reached') {
                return NextResponse.json({ code: 'quota_reached', error: 'AI actions limit reached for this month.' }, { status: 403 });
            }
            throw e;
        }

        const {
            mySolution,
            competitors,
            marketSignals,
            leanCanvas,
            roadmap,
            hypotheses,
            financeSummary,
            previousIntelligence,
            language = 'fr',
        } = await req.json();

        // Step 1: Search for recent news about each competitor
        const competitorNews: Record<string, any[]> = {};
        for (const competitor of (competitors || []).slice(0, 5)) {
            const results = await tavilySearch(
                `"${competitor.name}" startup news ${new Date().getFullYear()}`
            );
            competitorNews[competitor.name] = results;
        }

        const lang = language === 'fr' ? 'French' : 'English';

        const systemPrompt = `You are an elite Chief Strategy Officer specializing in competitive intelligence for startups.

Your task: Perform a comprehensive competitive intelligence analysis and generate actionable strategic insights.

Write the entire analysis in ${lang}. Keep standard startup/business terms in English even when writing in French.

Output MUST be a valid JSON object matching this EXACT schema:
{
    "healthScore": number (0-100, overall competitive health),
    "healthBreakdown": {
        "featureParity": number (0-100),
        "pricingPosition": number (0-100),
        "marketMomentum": number (0-100),
        "differentiationStrength": number (0-100),
        "threatExposure": number (0-100)
    },
    "alerts": [
        {
            "type": "threat" | "opportunity" | "action_required" | "info",
            "severity": "low" | "medium" | "high" | "critical",
            "title": string,
            "description": string,
            "relatedCompetitorId": string | null,
            "suggestedAction": string,
            "source": "ai_analysis"
        }
    ],
    "trendSummary": string (2-4 sentences about market trends),
    "featureGapPrioritization": [
        {
            "feature": string,
            "competitorsCoverage": number (how many competitors have it),
            "businessImpact": "critical" | "high" | "medium" | "low",
            "recommendation": string,
            "suggestedRoadmapItem": { "title": string, "priority": "high" | "medium" | "low" } | null
        }
    ],
    "pricingIntelligence": {
        "yourPosition": "below_market" | "at_market" | "premium",
        "recommendation": string,
        "potentialRevenueImpact": string
    },
    "competitorUpdates": [
        {
            "competitorName": string,
            "recentNews": [{ "title": string, "url": string, "summary": string }],
            "suggestedThreatLevel": number (0-100),
            "suggestedMomentum": "rising" | "stable" | "declining"
        }
    ],
    "scenarioSuggestions": [
        {
            "scenario": string,
            "probability": "low" | "medium" | "high",
            "impact": "low" | "medium" | "high",
            "yourResponse": string,
            "timeline": string
        }
    ],
    "crossModuleRecommendations": {
        "leanCanvas": [{ "section": string, "suggestion": string }],
        "roadmap": [{ "title": string, "priority": "high" | "medium" | "low", "reasoning": string }],
        "hypotheses": [{ "statement": string, "category": "problem" | "solution" | "channel" | "revenue", "reasoning": string }],
        "routine": [{ "suggestion": string, "reasoning": string }]
    }
}

ANALYSIS METHODOLOGY:
1. Compare all data points systematically across competitors
2. Cross-reference competitive gaps with the roadmap alignment
3. Cross-reference competitor strengths with hypothesis validation needs
4. Consider financial runway when making timing recommendations
5. Generate 3-6 alerts based on competitive threats, opportunities, and required actions
6. Provide 2-3 scenario analyses for likely market moves
7. Generate cross-module recommendations that reference specific competitive data

Be specific, data-driven, and actionable. Reference actual competitor names and data points.`;

        const userPrompt = `ANALYZE MY STARTUP:

MY SOLUTION:
${JSON.stringify(mySolution, null, 2)}

COMPETITORS:
${JSON.stringify(competitors, null, 2)}

RECENT MARKET SIGNALS:
${JSON.stringify((marketSignals || []).slice(-20), null, 2)}

COMPETITOR NEWS FROM WEB:
${JSON.stringify(competitorNews, null, 2)}

LEAN CANVAS:
${JSON.stringify(leanCanvas, null, 2)}

ROADMAP:
${JSON.stringify(roadmap, null, 2)}

HYPOTHESES:
${JSON.stringify(hypotheses, null, 2)}

FINANCIAL CONTEXT:
${JSON.stringify(financeSummary || { note: 'No financial data provided' }, null, 2)}

${previousIntelligence ? `PREVIOUS ANALYSIS (detect changes):
Health Score was: ${previousIntelligence.healthScore}
Previous alerts count: ${previousIntelligence.alerts?.length || 0}
` : 'This is the FIRST analysis.'}

Generate a comprehensive competitive intelligence analysis.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.4,
            max_tokens: 4000,
        });
        await recordAiAction(userId, 'api', response.usage?.total_tokens || 0, 'gpt-4o').catch(console.error);

        const content = response.choices[0].message.content;
        const intelligence = JSON.parse(content || '{}');

        // Add IDs and timestamps to alerts
        if (intelligence.alerts) {
            intelligence.alerts = intelligence.alerts.map((alert: any, i: number) => ({
                ...alert,
                id: `alert-${Date.now()}-${i}`,
                createdAt: new Date().toISOString(),
                source: alert.source || 'ai_analysis',
            }));
        }

        // Add IDs to scenarios
        if (intelligence.scenarioSuggestions) {
            intelligence.scenarioSuggestions = intelligence.scenarioSuggestions.map(
                (s: any, i: number) => ({
                    ...s,
                    id: `scenario-${Date.now()}-${i}`,
                    createdAt: new Date().toISOString(),
                })
            );
        }

        intelligence.lastAnalyzedAt = new Date().toISOString();

        return NextResponse.json(intelligence);
    } catch (error) {
        logger.error('Competitive Intelligence Error', error, { userId });
        return NextResponse.json(
            { error: 'Failed to generate competitive intelligence' },
            { status: 500 }
        );
    }
}

export const POST = withAuth(handler);
