'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useFounderStore } from '@/store/founder-store';
import { translations } from '@/lib/translations';

interface RecommendationBannerProps {
    title?: string;
    description?: string;
    recommendations: any[]; // Flexible data
    type: 'lean-canvas' | 'roadmap' | 'hypotheses' | 'routine';
    onApply?: (item: any) => void;
    onDismiss?: () => void;
    className?: string;
}

export function RecommendationBanner({
    title,
    description,
    recommendations,
    type,
    onApply,
    onDismiss,
    className
}: RecommendationBannerProps) {
    const language = useFounderStore(s => s.language) || 'fr';
    const [isVisible, setIsVisible] = useState(true);
    const [appliedItems, setAppliedItems] = useState<Set<number>>(new Set());

    const t = translations[language] || translations['fr'];

    if (!t || !t.strategicRecommendations) return null;

    const typeKeyMap: Record<string, keyof typeof t.strategicRecommendations.bannerTitle> = {
        'lean-canvas': 'leanCanvas',
        'roadmap': 'roadmap',
        'hypotheses': 'hypotheses',
        'routine': 'routine'
    };
    const transKey = typeKeyMap[type];

    const displayTitle = title || (t.strategicRecommendations.bannerTitle ? t.strategicRecommendations.bannerTitle[transKey] : title);
    const displayDescription = description || (t.strategicRecommendations.bannerDesc ? t.strategicRecommendations.bannerDesc[transKey] : description);

    if (!isVisible || !recommendations || recommendations.length === 0) return null;

    const handleApply = (item: any, index: number) => {
        if (onApply) {
            onApply(item);
            const newSet = new Set(appliedItems);
            newSet.add(index);
            setAppliedItems(newSet);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    return (
        <div className={cn("mb-6 animate-in fade-in slide-in-from-top-4 duration-500", className)}>
            <Card className="border-indigo-500/30 bg-indigo-500/5 overflow-hidden">
                <div className="p-4">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-indigo-500/20 text-indigo-400">
                                <Sparkles className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-indigo-100">{displayTitle}</h3>
                                {displayDescription && <p className="text-sm text-indigo-300/80">{displayDescription}</p>}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDismiss}
                            className="h-8 w-8 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid gap-3">
                        {recommendations.map((item, index) => {
                            const isApplied = appliedItems.has(index);

                            // Renderer based on type
                            let content = null;
                            if (type === 'lean-canvas') {
                                content = (
                                    <div className="flex-1">
                                        <div className="text-xs font-mono text-indigo-400 mb-1 uppercase tracking-wider">{item.section}</div>
                                        <p className="text-sm text-indigo-100">{item.suggestion}</p>
                                    </div>
                                );
                            } else if (type === 'roadmap') {
                                content = (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-indigo-100">{item.title}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                                item.priority === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                                    'bg-teal-500/20 text-teal-400'
                                                }`}>{item.priority}</span>
                                        </div>
                                        <p className="text-xs text-indigo-300/80">{item.timeframe}</p>
                                    </div>
                                );
                            } else if (type === 'hypotheses') {
                                content = (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">{item.category}</span>
                                        </div>
                                        <p className="text-sm text-indigo-100 font-medium mb-1">{item.statement}</p>
                                        <p className="text-xs text-indigo-300/80">Test: {item.testMethod}</p>
                                    </div>
                                );
                            } else if (type === 'routine') {
                                content = (
                                    <div className="flex-1">
                                        <p className="text-sm text-indigo-100 mb-1">{item.suggestion}</p>
                                        <p className="text-xs text-green-400/80 flex items-center gap-1">
                                            <ArrowRight className="h-3 w-3" /> {t.strategicRecommendations.benefit} {item.benefit}
                                        </p>
                                    </div>
                                );
                            } else {
                                // Default fallback
                                content = <p className="text-sm text-indigo-100">{JSON.stringify(item)}</p>;
                            }

                            return (
                                <div key={index} className="flex items-center gap-3 bg-indigo-950/30 p-3 rounded-lg border border-indigo-500/10">
                                    {content}
                                    {onApply && (
                                        <Button
                                            size="sm"
                                            variant={isApplied ? "ghost" : "secondary"}
                                            className={cn(
                                                "shrink-0 h-8",
                                                isApplied
                                                    ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                    : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-foreground"
                                            )}
                                            onClick={() => !isApplied && handleApply(item, index)}
                                            disabled={isApplied}
                                        >
                                            {isApplied ? (
                                                <>
                                                    <Check className="h-3.5 w-3.5 mr-1.5" /> {t.strategicRecommendations.applied}
                                                </>
                                            ) : (
                                                <>{t.strategicRecommendations.apply}</>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
}
