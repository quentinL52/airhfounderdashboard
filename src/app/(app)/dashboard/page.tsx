'use client';

import { Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CommandCenter } from '@/components/dashboard/command-center';
import { AiUsageGauge } from '@/components/dashboard/ai-usage-gauge';
import { PageAgent } from '@/components/agent/PageAgent';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

// Widgets
import { RunwayWidget } from '@/components/dashboard/runway-widget';
import { MvpCountdown } from '@/components/dashboard/mvp-countdown';
import { OkrWidget } from '@/components/dashboard/okr-widget';
import { HypothesesWidget } from '@/components/dashboard/hypotheses-widget';
import { GtmWidget } from '@/components/dashboard/gtm-widget';
import { StreakWidget } from '@/components/dashboard/widgets/streak-widget';
import { XPProgressWidget } from '@/components/dashboard/widgets/xp-progress-widget';
import { QuestsWidget } from '@/components/dashboard/widgets/quests-widget';
import { PixelMoodDisplay } from '@/components/dashboard/pixel-mood-display';
import { WatchWidget } from '@/components/dashboard/watch-widget';

export default function DashboardPage() {
    const t = useTranslations('nav');
    const [userId, setUserId] = useState<string | null>(null);
    const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('today');

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserId(data.user.id);
        });

        // Verifie le statut de l'onboarding
        fetch('/api/onboarding')
            .then(res => res.json())
            .then(data => setOnboardingStatus(data.session?.status))
            .catch(console.error);

        // Check if just onboarded
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('onboarded') === 'true') {
                urlParams.delete('onboarded');
                window.history.replaceState({}, document.title, window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : ''));
            }
            const tabParam = urlParams.get('tab');
            if (tabParam) {
                setActiveTab(tabParam);
            }
        }
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('tab', value);
            window.history.replaceState({}, document.title, window.location.pathname + '?' + urlParams.toString());
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4 p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between space-y-2 mb-4">
                <h2 className="text-3xl font-bold tracking-tight font-pixel text-primary flex items-center gap-3">
                    <Target className="w-8 h-8" />
                    {t('dashboard')}
                </h2>
            </div>

            <AiUsageGauge />

            {onboardingStatus === 'skipped' && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-primary">Terminez la configuration de votre Cockpit</h3>
                        <p className="text-sm text-muted-foreground">Vous avez ignoré l'onboarding initial. Complétez-le pour configurer votre base de données et votre assistant.</p>
                    </div>
                    <Link href="/onboarding">
                        <Button variant="default">Reprendre l'onboarding</Button>
                    </Link>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
                    <TabsTrigger value="business">Business & OKR</TabsTrigger>
                    <TabsTrigger value="validation">Validation</TabsTrigger>
                    <TabsTrigger value="momentum">Momentum</TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="space-y-6">
                    <CommandCenter />
                </TabsContent>

                <TabsContent value="business" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RunwayWidget />
                        <OkrWidget />
                    </div>
                    <div className="mt-6">
                        <MvpCountdown />
                    </div>
                </TabsContent>

                <TabsContent value="validation" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <HypothesesWidget />
                        <WatchWidget />
                    </div>
                    <div className="mt-6">
                        <GtmWidget />
                    </div>
                </TabsContent>

                <TabsContent value="momentum" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StreakWidget />
                        <XPProgressWidget />
                        <PixelMoodDisplay />
                        <QuestsWidget />
                    </div>
                </TabsContent>
            </Tabs>

            {userId && <PageAgent userId={userId} pageLabel={t('dashboard')} />}
        </div>
    );
}
