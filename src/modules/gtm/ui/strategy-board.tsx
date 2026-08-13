'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Compass, MessageSquare, Share2, Rocket, BarChart3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { GoToMarketStrategy, calculateStrategyCompleteness } from '../domain/strategy';

interface StrategyBoardProps {
  strategy: GoToMarketStrategy;
  onChange: (field: keyof GoToMarketStrategy, value: string) => void;
  metrics?: {
    waitlistCount: number;
    pipelineWon: number;
    mrr: number;
  };
}

export function StrategyBoard({ strategy, onChange, metrics }: StrategyBoardProps) {
  const tGtm = useTranslations('gtm');
  const completeness = calculateStrategyCompleteness(strategy);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-pixel text-foreground">{tGtm('board.title')}</h2>
          <p className="text-xs text-muted-foreground">{tGtm('board.subtitle')}</p>
        </div>
        <Badge variant="outline" className="font-pixel text-xs py-1 px-3">
          {tGtm('board.pillarsCount', { completed: completeness.completedPillars, total: completeness.totalPillars })} ({completeness.score}%)
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. Positioning & ICP */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-pixel text-sm">
              <Compass className="w-4 h-4 text-primary" />
              1. {tGtm('steps.positioning')}
            </CardTitle>
            <CardDescription className="text-xs">Define target client profile & competitive alternatives.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.targetSegment')}</Label>
              <Input
                value={strategy.ompTarget}
                onChange={(e) => onChange('ompTarget', e.target.value)}
                placeholder="Ex: Solo B2B SaaS Founders launching MVPs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.compAlternatives')}</Label>
              <Textarea
                rows={2}
                value={strategy.oaAlternatives}
                onChange={(e) => onChange('oaAlternatives', e.target.value)}
                placeholder="What prospects use today without your product"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.uniqueAttributes')}</Label>
              <Textarea
                rows={2}
                value={strategy.oaUniqueAttributes}
                onChange={(e) => onChange('oaUniqueAttributes', e.target.value)}
                placeholder="What makes your product uniquely valuable"
              />
            </div>
          </CardContent>
        </Card>

        {/* 2. Messaging */}
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-pixel text-sm text-blue-500">
              <MessageSquare className="w-4 h-4" />
              2. {tGtm('steps.messaging')}
            </CardTitle>
            <CardDescription className="text-xs">Hero hook, problem statement, & authority guide.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.valueProp')}</Label>
              <Input
                value={strategy.sbHero}
                onChange={(e) => onChange('sbHero', e.target.value)}
                placeholder="Main pitch hook for landing & outreach"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.problemStatement')}</Label>
              <Textarea
                rows={2}
                value={strategy.sbProblem}
                onChange={(e) => onChange('sbProblem', e.target.value)}
                placeholder="Frustration or pain point being solved"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.guideCredibility')}</Label>
              <Input
                value={strategy.sbGuide}
                onChange={(e) => onChange('sbGuide', e.target.value)}
                placeholder="Authority / empathy positioning"
              />
            </div>
          </CardContent>
        </Card>

        {/* 3. Distribution Channels */}
        <Card className="border-t-4 border-t-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-pixel text-sm text-purple-500">
              <Share2 className="w-4 h-4" />
              3. {tGtm('steps.channels')}
            </CardTitle>
            <CardDescription className="text-xs">Distribution channels & content publication cadence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.primaryChannels')}</Label>
              <Input
                value={strategy.ompMedia}
                onChange={(e) => onChange('ompMedia', e.target.value)}
                placeholder="Ex: LinkedIn, Cold Email, X, SEO"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.contentCadence')}</Label>
              <Input
                value={strategy.owCadence}
                onChange={(e) => onChange('owCadence', e.target.value)}
                placeholder="Ex: 3 LinkedIn posts / week, biweekly newsletter"
              />
            </div>
          </CardContent>
        </Card>

        {/* 4. Atomic Network / Launch */}
        <Card className="border-t-4 border-t-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-pixel text-sm text-orange-500">
              <Rocket className="w-4 h-4" />
              4. {tGtm('steps.launch')}
            </CardTitle>
            <CardDescription className="text-xs">Initial dense user cluster & key launch milestones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">{tGtm('board.atomicNetwork')}</Label>
              <Textarea
                rows={3}
                value={strategy.csAtomicNetwork}
                onChange={(e) => onChange('csAtomicNetwork', e.target.value)}
                placeholder="Ex: Onboard 20 active indie hacker communities to build initial density"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Measure & Iterate Metrics */}
      <Card className="border-t-4 border-t-emerald-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-pixel text-sm text-emerald-500">
            <BarChart3 className="w-4 h-4" />
            5. {tGtm('steps.measure')} - {tGtm('board.realMetrics')}
          </CardTitle>
          <CardDescription className="text-xs">Live conversion & revenue metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-card border border-border rounded-md">
              <div className="text-[10px] font-pixel text-muted-foreground uppercase">{tGtm('board.waitlistLeads')}</div>
              <div className="text-2xl font-pixel text-primary">{metrics?.waitlistCount || 0}</div>
            </div>
            <div className="p-3 bg-card border border-border rounded-md">
              <div className="text-[10px] font-pixel text-muted-foreground uppercase">{tGtm('board.wonLeads')}</div>
              <div className="text-2xl font-pixel text-emerald-400">{metrics?.pipelineWon || 0}</div>
            </div>
            <div className="p-3 bg-card border border-border rounded-md">
              <div className="text-[10px] font-pixel text-muted-foreground uppercase">{tGtm('board.currentMrr')}</div>
              <div className="text-2xl font-pixel text-blue-400">{metrics?.mrr || 0} €</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
