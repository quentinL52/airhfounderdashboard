'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFounderStore } from '@/store/founder-store';
import { HypothesisStatus, HypothesisRisk, HypothesisCategory } from '@/modules/gtm';
import { translations } from '@/lib/translations';
import { BoardSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { COLORS } from '@/lib/constants';
import { Beaker } from 'lucide-react';
import { PageAgent } from '@/components/agent/PageAgent';
import { createClient } from '@/utils/supabase/client';

// Lazy load heavy board and list components
const HypothesesBoard = dynamic(
    () => import('@/components/hypotheses/hypotheses-board').then(m => m.HypothesesBoard),
    { loading: () => <BoardSkeleton /> }
);
const HypothesesList = dynamic(
    () => import('@/components/hypotheses/hypotheses-list').then(m => m.HypothesesList),
    { loading: () => <TableSkeleton /> }
);

export default function HypothesesPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const language = useFounderStore(s => s.language);
    const t = translations[language].hypotheses;
    const addHypothesis = useFounderStore(s => s.addHypothesis);
    const hypotheses = useFounderStore(s => s.hypotheses);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUserId(data.user.id);
        });
    }, []);

    const activeHypotheses = hypotheses?.filter(h => h.status === 'testing' || h.status === 'draft');
    const pageContext = activeHypotheses?.length
        ? `${activeHypotheses.length} hypothèses actives : ${activeHypotheses.map(h => `${h.statement.slice(0, 80)} (${h.status})`).join(' | ')}`
        : 'Aucune hypothèse en cours.';

    return (
        <div className="flex flex-col h-full space-y-4 p-8 pt-6 font-sans text-foreground">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-pixel text-blue-500 flex items-center gap-3">
                        <Beaker className="w-8 h-8" />
                        {t.title}
                    </h1>
                    <p className="text-muted-foreground mt-2">{t.subtitle}</p>
                </div>
            </div>

            <Tabs defaultValue="board" className="h-full flex flex-col">
                <TabsList className="grid w-[400px] grid-cols-2 bg-primary/10 text-muted-foreground mb-4">
                    <TabsTrigger value="board">{t.tabs.board}</TabsTrigger>
                    <TabsTrigger value="list">{t.tabs.list}</TabsTrigger>
                </TabsList>
                <TabsContent value="board" className="flex-1 overflow-hidden mt-0">
                    <HypothesesBoard />
                </TabsContent>
                <TabsContent value="list" className="h-full mt-0">
                    <HypothesesList />
                </TabsContent>
            </Tabs>

            {userId && (
                <PageAgent userId={userId} pageLabel="Hypothèses" pageContext={pageContext} />
            )}
        </div>
    );
}
