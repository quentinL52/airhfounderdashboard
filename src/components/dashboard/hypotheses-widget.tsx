'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFounderStore } from '@/store/founder-store';
import { GrowthHypothesisService } from '@/modules/gtm';
import { Beaker, FlaskConical, CheckCircle2 } from 'lucide-react';

const hypothesisService = new GrowthHypothesisService();

export function HypothesesWidget() {
    const hypotheses = useFounderStore(s => s.hypotheses);

    const metrics = useMemo(() => {
        const hypMetrics = hypothesisService.calculateMetrics(hypotheses);

        // Find last validated
        const sortedValidated = [...hypotheses]
            .filter((h) => h.status === 'validated')
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        const lastWin = sortedValidated.length > 0 ? sortedValidated[0].statement : null;

        return { testing: hypMetrics.testing, validated: hypMetrics.validated, lastWin };
    }, [hypotheses]);

    return (
        <Card className="h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    Hypotheses / Experiments
                </CardTitle>
                <FlaskConical className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold flex items-center">
                    {metrics.testing}
                    <span className="text-sm font-normal text-muted-foreground ml-2">in testing</span>
                </div>

                {metrics.lastWin ? (
                    <div className="mt-4 text-xs text-muted-foreground">
                        <div className="flex items-center text-success mb-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Last validated:
                        </div>
                        <p className="line-clamp-2 italic">"{metrics.lastWin}"</p>
                    </div>
                ) : (
                    <p className="mt-4 text-xs text-muted-foreground italic">
                        No hypotheses validated yet. start experimenting!
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
