'use client';

import { useState } from 'react';
import { useFounderStore, Competitor, CompetitorRadarScores, PricingModelType } from '@/store/founder-store';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ChevronUp, Sparkles, Loader2, Save, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const DEFAULT_RADAR_SCORES: CompetitorRadarScores = {
    price: 5,
    features: 5,
    ux: 5,
    market: 5,
    innovation: 5,
    support: 5,
};

const DEFAULT_SWOT = {
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
};

interface CompetitorInlineFormProps {
    onCancel: () => void;
    onSuccess: () => void;
    initialData?: Partial<Competitor>; // For editing MySolution or re-editing a competitor (future)
    isMySolution?: boolean; // Flag to change text/logic
}

export function CompetitorInlineForm({ onCancel, onSuccess, initialData, isMySolution = false }: CompetitorInlineFormProps) {
    const addCompetitor = useFounderStore((s) => s.addCompetitor);
    const updateMySolution = useFounderStore((s) => s.updateMySolution);
    const language = useFounderStore((s) => s.language);
    // eslint-disable-next-line
    const t = (translations[language as keyof typeof translations] as any).competitiveWatch;

    // Form State - initialized with initialData or defaults
    const [name, setName] = useState(initialData?.name || '');
    const [website, setWebsite] = useState(initialData?.website || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [strengths, setStrengths] = useState(initialData?.strengths || '');
    const [weaknesses, setWeaknesses] = useState(initialData?.weaknesses || '');
    const [pricing, setPricing] = useState(initialData?.pricing || '');
    const [positioning, setPositioning] = useState(initialData?.positioning || '');
    const [radarScores, setRadarScores] = useState<CompetitorRadarScores>(initialData?.radarScores || DEFAULT_RADAR_SCORES);

    // Advanced Fields
    const [targetSegment, setTargetSegment] = useState(initialData?.targetSegment || '');
    const [businessModel, setBusinessModel] = useState(initialData?.businessModel || '');
    const [teamSize, setTeamSize] = useState(initialData?.teamSize || '');
    const [fundingStage, setFundingStage] = useState(initialData?.fundingStage || '');
    const [fundingAmount, setFundingAmount] = useState(initialData?.fundingAmount || '');
    const [keyFeatures, setKeyFeatures] = useState(initialData?.keyFeatures?.join(', ') || '');
    const [differentiators, setDifferentiators] = useState(initialData?.differentiators?.join(', ') || '');
    const [pricingModel, setPricingModel] = useState<PricingModelType | ''>(initialData?.pricingModel || '');
    const [pricingRange, setPricingRange] = useState(initialData?.pricingRange || '');
    const [yearFounded, setYearFounded] = useState(initialData?.yearFounded || '');
    const [geography, setGeography] = useState(initialData?.geography || '');

    // UI State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    const handleAutoFill = async () => {
        if (!website.trim()) return;
        setIsAutoFilling(true);
        try {
            const response = await fetch('/api/ai/competitor-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: website.trim(), language }),
            });
            if (!response.ok) throw new Error('Failed');
            const profile = await response.json();

            if (profile.name && !name.trim()) setName(profile.name);
            if (profile.description) setDescription(profile.description);
            if (profile.strengths) setStrengths(profile.strengths);
            if (profile.weaknesses) setWeaknesses(profile.weaknesses);
            if (profile.pricing) setPricing(profile.pricing);
            if (profile.positioning) setPositioning(profile.positioning);
            if (profile.targetSegment) setTargetSegment(profile.targetSegment);
            if (profile.businessModel) setBusinessModel(profile.businessModel);
            if (profile.teamSize) setTeamSize(profile.teamSize);
            if (profile.fundingStage) setFundingStage(profile.fundingStage);
            if (profile.fundingAmount) setFundingAmount(profile.fundingAmount);
            if (profile.keyFeatures?.length) setKeyFeatures(profile.keyFeatures.join(', '));
            if (profile.differentiators?.length) setDifferentiators(profile.differentiators.join(', '));
            if (profile.pricingModel) setPricingModel(profile.pricingModel);
            if (profile.pricingRange) setPricingRange(profile.pricingRange);
            if (profile.yearFounded) setYearFounded(profile.yearFounded);
            if (profile.geography) setGeography(profile.geography);
            if (profile.radarScores) setRadarScores(profile.radarScores);

            setShowAdvanced(true);
            toast({
                title: t.autoFillSuccess || 'Data extracted successfully',
                duration: 3000,
            });
        } catch {
            toast({
                title: t.autoFillError || 'Could not extract data',
                variant: 'destructive',
                duration: 3000,
            });
        } finally {
            setIsAutoFilling(false);
        }
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        const data = {
            name: name.trim(),
            website: website.trim() || undefined,
            description: description.trim() || undefined,
            strengths: strengths.trim() || undefined,
            weaknesses: weaknesses.trim() || undefined,
            pricing: pricing.trim() || undefined,
            positioning: positioning.trim() || undefined,
            targetSegment: targetSegment.trim() || undefined,
            businessModel: businessModel.trim() || undefined,
            teamSize: teamSize.trim() || undefined,
            fundingStage: fundingStage.trim() || undefined,
            fundingAmount: fundingAmount.trim() || undefined,
            keyFeatures: keyFeatures.trim() ? keyFeatures.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            differentiators: differentiators.trim() ? differentiators.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            pricingModel: (pricingModel as PricingModelType) || undefined,
            pricingRange: pricingRange.trim() || undefined,
            yearFounded: yearFounded.trim() || undefined,
            geography: geography.trim() || undefined,
            radarScores,
            swot: DEFAULT_SWOT,
        };

        if (isMySolution) {
            updateMySolution(data);
            toast({
                title: language === 'fr' ? 'Ma Solution mise à jour' : 'My Solution updated',
                duration: 2000,
            });
        } else {
            addCompetitor(data as any); // Types match, but omitting id/dates logic handled in store
        }
        onSuccess();
    };

    const radarAxesKeys = ['price', 'features', 'ux', 'market', 'innovation', 'support'] as const;

    // Animation styles matching OKR page
    const animationStyle: React.CSSProperties = {
        animation: "scaleIn 0.25s ease both",
    };

    return (
        <Card className="mb-6 border-primary/30 bg-card/50" style={animationStyle}>
            <CardContent className="pt-6">
                <style>{`
                    @keyframes scaleIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                `}</style>

                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-foreground">
                        {isMySolution
                            ? (language === 'fr' ? 'Éditer Ma Solution' : 'Edit My Solution')
                            : (language === 'fr' ? 'Nouveau concurrent' : 'New Competitor')
                        }
                    </h3>
                    <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0 text-muted-foreground">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-foreground">{t.competitor.name} *</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="E.g. Stripe"
                                className="bg-card border-border text-foreground"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">{t.competitor.website}</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://stripe.com"
                                    className="bg-card border-border text-foreground flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAutoFill}
                                    disabled={!website.trim() || isAutoFilling}
                                    className="border-primary/50 text-accent-foreground hover:bg-primary/10 shrink-0"
                                >
                                    {isAutoFilling ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">{t.competitor.description}</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t.competitor.description}
                                className="bg-card border-border text-foreground min-h-[80px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">{t.competitor.pricing}</Label>
                                <Input
                                    value={pricing}
                                    onChange={(e) => setPricing(e.target.value)}
                                    className="bg-card border-border text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">{t.competitor.positioning}</Label>
                                <Input
                                    value={positioning}
                                    onChange={(e) => setPositioning(e.target.value)}
                                    className="bg-card border-border text-foreground"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Radar & Analysis */}
                    <div className="space-y-4">
                        <Label className="text-foreground font-semibold block mb-2">
                            {language === 'fr' ? 'Analyse Radar' : 'Radar Analysis'}
                        </Label>
                        <div className="bg-card rounded-lg p-4 border border-border space-y-3">
                            {radarAxesKeys.map((axis) => (
                                <div key={axis} className="flex items-center gap-3">
                                    <span className="text-muted-foreground text-xs w-20 shrink-0 capitalize">
                                        {t.radarAxes[axis]}
                                    </span>
                                    <Slider
                                        min={1}
                                        max={10}
                                        step={1}
                                        value={[radarScores[axis]]}
                                        onValueChange={(val) =>
                                            setRadarScores((prev) => ({ ...prev, [axis]: val[0] }))
                                        }
                                        className="flex-1"
                                    />
                                    <span className="text-foreground text-xs w-5 text-right font-mono">
                                        {radarScores[axis]}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs uppercase tracking-wider">{t.competitor.strengths}</Label>
                                <Textarea
                                    value={strengths}
                                    onChange={(e) => setStrengths(e.target.value)}
                                    className="bg-card border-border text-foreground min-h-[60px] text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs uppercase tracking-wider">{t.competitor.weaknesses}</Label>
                                <Textarea
                                    value={weaknesses}
                                    onChange={(e) => setWeaknesses(e.target.value)}
                                    className="bg-card border-border text-foreground min-h-[60px] text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Data Toggle */}
                <div className="mt-4 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-primary hover:text-accent-foreground transition-colors"
                    >
                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {language === 'fr' ? 'Données stratégiques avancées' : 'Advanced strategic data'}
                    </button>

                    {showAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.targetSegment}</Label>
                                <Input value={targetSegment} onChange={(e) => setTargetSegment(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.businessModel}</Label>
                                <Input value={businessModel} onChange={(e) => setBusinessModel(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.teamSize}</Label>
                                <Input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.yearFounded}</Label>
                                <Input value={yearFounded} onChange={(e) => setYearFounded(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.fundingStage}</Label>
                                <Input value={fundingStage} onChange={(e) => setFundingStage(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.fundingAmount}</Label>
                                <Input value={fundingAmount} onChange={(e) => setFundingAmount(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.pricingModel}</Label>
                                <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as PricingModelType)}>
                                    <SelectTrigger className="bg-card border-border text-foreground h-8 text-xs">
                                        <SelectValue placeholder="-" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        {(['free', 'freemium', 'subscription', 'usage', 'enterprise', 'other'] as PricingModelType[]).map(pm => (
                                            <SelectItem key={pm} value={pm} className="hover:bg-muted text-xs">{t.pricingModels[pm]}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground text-xs">{t.competitor.pricingRange}</Label>
                                <Input value={pricingRange} onChange={(e) => setPricingRange(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-foreground text-xs">{t.competitor.keyFeatures}</Label>
                                <Input value={keyFeatures} onChange={(e) => setKeyFeatures(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-foreground text-xs">{t.competitor.differentiators}</Label>
                                <Input value={differentiators} onChange={(e) => setDifferentiators(e.target.value)} className="bg-card border-border text-foreground h-8 text-xs" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
                        {language === 'fr' ? 'Annuler' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="bg-primary hover:bg-primary/90 text-foreground"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {isMySolution
                            ? (language === 'fr' ? 'Mettre à jour' : 'Update')
                            : (language === 'fr' ? 'Ajouter ce compétiteur' : 'Add Competitor')
                        }
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
