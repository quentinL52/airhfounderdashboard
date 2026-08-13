import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';
import { withAuth } from '@/lib/security/with-auth';
import { assertQuota, recordAiAction } from '@/lib/billing/metering';

const openai = new OpenAI({
    apiKey: process.env.AI_API_KEY || '',
});

export const maxDuration = 60;

async function handler(req: Request, { userId }: { userId: string }) {
    try {
        try {
            await assertQuota(userId);
        } catch (e: any) {
            if (e.code === 'quota_reached') {
                return NextResponse.json({ code: 'quota_reached', error: 'AI actions limit reached for this month.' }, { status: 403 });
            }
            throw e;
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Parse optional request parameters
        const body = await req.json().catch(() => ({}));
        const { period = 'week', focus = 'general' } = body;

        // Fetch founder data
        const { data: hypData } = await supabase
            .from('hypotheses')
            .select('statement, status, actual_result')
            .eq('user_id', user.id);

        const { data: financeData } = await supabase
            .from('finances')
            .select('amount, type, created_at')
            .eq('user_id', user.id);

        const { data: journalData } = await supabase
            .from('mood_entries')
            .select('mood, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(7);

        const { data: streakData } = await supabase
            .from('streaks')
            .select('current_streak')
            .eq('user_id', user.id)
            .single();

        const hypotheses = hypData || [];
        const finances = financeData || [];
        const moods = journalData || [];
        const streak = streakData?.current_streak || 0;

        // Calculate metrics
        const totalBurn = finances
            .filter((f: any) => f.type === 'expense')
            .reduce((sum: number, f: any) => sum + Number(f.amount), 0);
        const totalRevenue = finances
            .filter((f: any) => f.type === 'revenue')
            .reduce((sum: number, f: any) => sum + Number(f.amount), 0);

        const hypothesesTested = hypotheses.filter((h: any) => h.status !== 'draft').length;
        const hypothesesValidated = hypotheses.filter((h: any) => h.status === 'validated').length;

        const moodSummary = await getWeeklyMoodSummary(user.id);

        const prompt = `
Tu es un coach startup spécialisé dans l'analyse hebdomadaire des fondateurs.

**Période analysée**: ${period}
**Focus demandé**: ${focus}

**Données du fondateur (ID: ${user.id}):**
- Hypothèses: ${hypotheses.length} total, ${hypothesesTested} testées, ${hypothesesValidated} validées
- Finances: ${totalRevenue}€ revenus, ${totalBurn}€ burn
- ${moodSummary.summaryLine}
- Streak actuel: ${streak} jours

Analyse et retourne:
1. **Focus Score** (1-10): Évalue la capacité du fondateur à se concentrer sur ce qui compte.
2. **Validation Score** (1-10): Évalue la progression dans la validation des hypothèses.
3. **Health Score** (1-10): Évalue la santé globale (finance + bien-être).
4. **One Key Insight**: Un insight transversal.
5. **Top Priority**: Une recommandation unique et prioritaire.
6. **Mood Trend**: Courte analyse de la tendance émotionnelle.
7. **Next Week Focus**: Suggère où concentrer l'énergie la semaine prochaine.

Réponds en JSON avec les clés: focusScore, validationScore, healthScore, insight, priority, moodTrend, nextFocus.
`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Tu es un assistant analyste startup. Réponds TOUJOURS en JSON valide uniquement.' },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
        });
        await recordAiAction(userId, 'api', completion.usage?.total_tokens || 0, 'gpt-4o').catch(console.error);

        const analysis = completion.choices[0]?.message?.content;

        if (!analysis) {
            return NextResponse.json({ error: 'Failed to generate analysis.' }, { status: 500 });
        }

        return NextResponse.json({
            analysis: JSON.parse(analysis),
            generatedAt: new Date().toISOString(),
            period,
        });

    } catch (error) {
        logger.error('[Weekly Report] Error', error, { userId });
        return NextResponse.json(
            { error: 'Erreur lors de la génération du rapport hebdomadaire.' },
            { status: 500 }
        );
    }
}

export const POST = withAuth(handler);