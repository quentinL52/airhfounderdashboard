import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { withAuth } from '@/lib/security';
import { logger } from '@/lib/logging/logger';

const apiKey = process.env.AI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Mock Tavily Search (replace with actual Tavily API call if needed, or use a library)
// For this implementation, we will simulate or use a simple fetch if key is present.
const tavilyApiKey = process.env.TAVILY_API_KEY;

async function tavilySearch(query: string) {
    if (!tavilyApiKey) return [];
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api_key': tavilyApiKey // Tavily expects api_key in body or header? Check docs. Usually body or header.
            },
            body: JSON.stringify({
                query,
                search_depth: "basic",
                include_answer: false,
                max_results: 5
            })
        });
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        logger.error("Tavily search failed", error);
        return [];
    }
}

// Function definition for OpenAI Tools
const searchToolDefinition = {
    type: "function" as const,
    function: {
        name: "search_web",
        description: "Search the web for real-time market news, competitor updates, and trends.",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query to execute."
                }
            },
            required: ["query"]
        }
    }
};

async function handler(req: NextRequest, { userId }: { userId: string }) {
    if (!openai) {
        return NextResponse.json({ error: 'AI API Key missing' }, { status: 500 });
    }

    try {
        const { mySolution, competitors, leanCanvas, roadmap, hypotheses } = await req.json();

        const systemPrompt = `You are a strategic advisor for a startup founder. 
        Your goal is to analyze the provided company data (Solution, Competitors, Lean Canvas, Roadmap, Hypotheses) and provide actionable, high-level strategic recommendations.
        
        You have access to a web search tool to find the latest market news and competitor updates.
        
        Output MUST be a valid JSON object matching this schema:
        {
            "featureGaps": [{ "feature": string, "status": "critical" | "nice-to-have", "reason": string }],
            "leanCanvasRecommendations": [{ "section": string, "suggestion": string }],
            "roadmapRecommendations": [{ "title": string, "priority": "high" | "medium" | "low", "timeframe": "Q1 2024" | "Q2 2024" etc }],
            "hypothesisSuggestions": [{ "statement": string, "category": "problem" | "solution" | "channel" | "revenue", "testMethod": string }],
            "routineOptimization": [{ "suggestion": string, "benefit": string, "timeframe": "daily" | "weekly" | "morning" | "evening" }],
            "marketNews": [{ "title": string, "url": string, "summary": string, "date": string }],
            "swotAnalysis": {
                "strengths": [string],
                "weaknesses": [string],
                "opportunities": [string],
                "threats": [string]
            }
        }
        
        Prioritize:
        1. Identification of critical feature gaps compared to competitors.
        2. Validation of Lean Canvas assumptions.
        3. Alignment of Roadmap with competitive landscape.
        4. New Hypotheses to test risky assumptions.
        5. Comprehensive SWOT analysis based on the provided data.
        `;

        const userPrompt = `
        Analyze my startup:
        My Solution: ${JSON.stringify(mySolution)}
        Competitors: ${JSON.stringify(competitors.map((c: any) => ({ name: c.name, features: c.radarScores })))}
        Lean Canvas: ${JSON.stringify(leanCanvas)}
        Roadmap: ${JSON.stringify(roadmap)}
        Hypotheses: ${JSON.stringify(hypotheses)}
        
        Use web search to find recent news about competitors or the market if relevant.
        `;

        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        // First call - let model decide to use tools
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: messages as any,
            tools: [searchToolDefinition],
            tool_choice: 'auto',
            response_format: { type: 'json_object' } // Enforce JSON for final output
        });

        const choice = completion.choices[0];
        const message = choice.message;

        // Handle Tool Calls
        if (message.tool_calls) {
            const toolCalls = message.tool_calls;
            const toolMessages = [];

            // Append assistant's "thought" (tool call request) to history
            messages.push(message);

            for (const toolCall of toolCalls) {
                if ((toolCall as any).function.name === 'search_web') {
                    const args = JSON.parse((toolCall as any).function.arguments);
                    logger.info(`Executing search: ${args.query}`, { userId });
                    const searchResults = await tavilySearch(args.query);

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: 'search_web',
                        content: JSON.stringify(searchResults)
                    });
                }
            }

            // Second call - generate final JSON with search context
            const finalCompletion = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: messages as any,
                response_format: { type: 'json_object' }
            });

            const finalContent = finalCompletion.choices[0].message.content;
            return NextResponse.json(JSON.parse(finalContent || '{}'));
        } else {
            // No tool used, just return the content
            return NextResponse.json(JSON.parse(message.content || '{}'));
        }

    } catch (error) {
        logger.error('AI Strategy Error', error, { userId });
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export const POST = withAuth(handler);
