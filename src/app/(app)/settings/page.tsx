'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { useFounderStore } from '@/store/founder-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
    Save,
    MonitorSmartphone,
    Palette,
    Calendar,
    User,
    Linkedin,
    PenLine,
    Bot,
    Bell,
    CreditCard,
    ShieldCheck,
    Volume2,
    Sliders,
    Sparkles,
} from 'lucide-react';
import { AISettingsPanel } from '@/components/dashboard/ai-settings-panel';
import { BillingPanel } from '@/components/dashboard/billing-panel';
import { IntegrationsPanel } from '@/components/dashboard/integrations-panel';
import { DataPrivacyPanel } from '@/components/dashboard/data-privacy-panel';
import { AiUsageGauge } from '@/components/dashboard/ai-usage-gauge';
import { WatchWidget } from '@/components/dashboard/watch-widget';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTabParam = searchParams.get('tab') || 'profile';

    const { theme, setTheme } = useTheme();
    const {
        mvpTargetDate,
        setMvpTargetDate,
        founderProfile,
        setFounderProfile,
        language,
        setLanguage,
        density,
        setDensity,
    } = useFounderStore();

    const t = useTranslations('settings');

    const [activeTab, setActiveTab] = useState(currentTabParam);
    const [localMvpDate, setLocalMvpDate] = useState(mvpTargetDate || '');
    const [localProfile, setLocalProfile] = useState(founderProfile);
    const [mounted, setMounted] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Auto-capture settings state
    const [autoCaptureGlobal, setAutoCaptureGlobal] = useState(true);
    const [autoCaptureKinds, setAutoCaptureKinds] = useState({
        contact: true,
        expense: true,
        task: true,
        hypothesis: true,
        decision: true,
    });

    // Notification settings state
    const [notifications, setNotifications] = useState({
        dailyCheckIn: true,
        watchReminders: true,
        weeklyDigest: true,
        transparentBrief: true,
    });

    // Agent settings state
    const [agentTone, setAgentTone] = useState('direct');
    const [agentLanguage, setAgentLanguage] = useState(language);

    useEffect(() => {
        setMounted(true);
        setLocalMvpDate(mvpTargetDate || '');
        setLocalProfile(founderProfile);
    }, [mvpTargetDate, founderProfile]);

    useEffect(() => {
        if (currentTabParam && currentTabParam !== activeTab) {
            setActiveTab(currentTabParam);
        }
    }, [currentTabParam]);

    const handleTabChange = (tabValue: string) => {
        setActiveTab(tabValue);
        router.push(`/settings?tab=${tabValue}`, { scroll: false });
    };

    const handleSave = () => {
        setMvpTargetDate(localMvpDate);
        setFounderProfile(localProfile);
        toast({
            title: t('savedTitle') || 'Paramètres sauvegardés',
            description: t('savedDescription') || 'Vos préférences ont bien été mises à jour.',
        });
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-pixel text-primary flex items-center gap-3">
                        <MonitorSmartphone className="w-8 h-8" />
                        {t('title') || 'Paramètres & Configuration'}
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {t('subtitle') || 'Gérez votre profil, vos préférences IA, agents, notifications et sécurité.'}
                    </p>
                </div>
                <Button onClick={handleSave} className="flex items-center gap-2 font-pixel tracking-wide">
                    <Save className="w-4 h-4" />
                    {t('saveButton') || 'Sauvegarder'}
                </Button>
            </div>

            {/* Navigation par Onglets */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-6 bg-muted/60 p-1">
                    <TabsTrigger value="profile" className="text-xs flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Profil
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> IA & BYOK
                    </TabsTrigger>
                    <TabsTrigger value="agents" className="text-xs flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5" /> Agents
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="text-xs flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="text-xs flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" /> Facturation
                    </TabsTrigger>
                    <TabsTrigger value="data-privacy" className="text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Données
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="text-xs flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5" /> Apparence
                    </TabsTrigger>
                </TabsList>

                {/* 1. Tab Profil */}
                <TabsContent value="profile" className="space-y-6">
                    <Card className="border-t-4 border-t-cyan-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-pixel text-cyan-500">
                                <User className="w-5 h-5" />
                                Profil & Identité Fondateur
                            </CardTitle>
                            <CardDescription>
                                Informations personnelles pour personnaliser les interactions avec votre cockpit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> Prénom & Nom
                                    </Label>
                                    <Input
                                        placeholder="Ex: Quentin"
                                        value={localProfile.displayName}
                                        onChange={(e) => setLocalProfile({ ...localProfile, displayName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5">
                                        <Linkedin className="w-3.5 h-3.5" /> Profil LinkedIn
                                    </Label>
                                    <Input
                                        type="url"
                                        placeholder="https://linkedin.com/in/..."
                                        value={localProfile.linkedinUrl}
                                        onChange={(e) => setLocalProfile({ ...localProfile, linkedinUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Secteur / Niche de votre Startup</Label>
                                <Input
                                    placeholder="Ex: SaaS B2B, Fintech, IA générative"
                                    value={localProfile.niche}
                                    onChange={(e) => setLocalProfile({ ...localProfile, niche: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">
                                    <PenLine className="w-3.5 h-3.5" /> Style de Rédaction Personnel
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Exemples de vos écrits pour que l'agent de contenu clone fidèlement votre ton.
                                </p>
                                <Textarea
                                    className="min-h-[120px] font-mono text-sm"
                                    value={localProfile.writingStyleContext}
                                    onChange={(e) => setLocalProfile({ ...localProfile, writingStyleContext: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-indigo-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-pixel text-indigo-500">
                                <Calendar className="w-5 h-5" />
                                Date Cible du MVP & Fuseau Horaire
                            </CardTitle>
                            <CardDescription>
                                Définit l'échéance de lancement pour adapter le rythme du Barreur.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Date de lancement MVP prévisionnelle</Label>
                                    <Input
                                        type="date"
                                        value={localMvpDate}
                                        onChange={(e) => setLocalMvpDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fuseau horaire (Timezone)</Label>
                                    <Select defaultValue="Europe/Paris">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                                            <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2. Tab AI & BYOK */}
                <TabsContent value="ai" className="space-y-6">
                    <AiUsageGauge />
                    <AISettingsPanel />

                    {/* Auto-Capture Config */}
                    <Card className="border-t-4 border-t-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-pixel text-purple-500">
                                <Sliders className="w-5 h-5" />
                                Auto-Capture Contextuelle (Suggestions micro-chips)
                            </CardTitle>
                            <CardDescription>
                                Ajustez la détection automatique d'entités capturables lors des échanges avec le Barreur.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-muted/20 border rounded-lg">
                                <div>
                                    <div className="text-sm font-bold">Auto-Capture globale</div>
                                    <div className="text-xs text-muted-foreground">Activer/désactiver la proposition de puces sous les réponses de l'agent.</div>
                                </div>
                                <Switch checked={autoCaptureGlobal} onCheckedChange={setAutoCaptureGlobal} />
                            </div>

                            {autoCaptureGlobal && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                                    {Object.entries(autoCaptureKinds).map(([kind, enabled]) => (
                                        <div key={kind} className="flex items-center justify-between p-2.5 bg-card border rounded-md">
                                            <span className="text-xs font-medium capitalize">{kind}</span>
                                            <Switch
                                                checked={enabled}
                                                onCheckedChange={(val) => setAutoCaptureKinds((prev) => ({ ...prev, [kind]: val }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 3. Tab Agents */}
                <TabsContent value="agents" className="space-y-6">
                    <Card className="border-t-4 border-t-amber-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-pixel text-amber-500">
                                <Bot className="w-5 h-5" />
                                Configuration de l'Agent Barreur & Sub-Agents
                            </CardTitle>
                            <CardDescription>
                                Personnalisez la posture, le ton et les langues utilisées par vos agents.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Ton de l'Agent Barreur</Label>
                                    <Select value={agentTone} onValueChange={setAgentTone}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="direct">Direct & Challengeur (Recommandé)</SelectItem>
                                            <SelectItem value="empathic">Bienveillant & Coach</SelectItem>
                                            <SelectItem value="analytical">Strictement Factuel & Analytique</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Langue de réponse principale</Label>
                                    <Select value={agentLanguage} onValueChange={(val: any) => setAgentLanguage(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fr">Français (FR)</SelectItem>
                                            <SelectItem value="en">English (EN)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inclusion du widget de Veille Concurrentielle Proactive */}
                    <WatchWidget />
                </TabsContent>

                {/* 4. Tab Notifications */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="border-t-4 border-t-blue-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-pixel text-blue-500">
                                <Bell className="w-5 h-5" />
                                Gestion des Rappels & Notifications
                            </CardTitle>
                            <CardDescription>
                                Choisissez la fréquence et le niveau de relance de votre cockpit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                                <div>
                                    <div className="text-sm font-bold">Check-in quotidien de routine</div>
                                    <div className="text-xs text-muted-foreground">Notification matinale pour lancer votre Top 3 du jour.</div>
                                </div>
                                <Switch
                                    checked={notifications.dailyCheckIn}
                                    onCheckedChange={(val) => setNotifications((prev) => ({ ...prev, dailyCheckIn: val }))}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                                <div>
                                    <div className="text-sm font-bold">Rappels de veille J+7</div>
                                    <div className="text-xs text-muted-foreground">Rappel non intrusif si aucun scan de veille n'a été fait depuis 7 jours.</div>
                                </div>
                                <Switch
                                    checked={notifications.watchReminders}
                                    onCheckedChange={(val) => setNotifications((prev) => ({ ...prev, watchReminders: val }))}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                                <div>
                                    <div className="text-sm font-bold">Digest hebdo par email</div>
                                    <div className="text-xs text-muted-foreground">Synthèse le dimanche des jalons atteints et du Mood of the week.</div>
                                </div>
                                <Switch
                                    checked={notifications.weeklyDigest}
                                    onCheckedChange={(val) => setNotifications((prev) => ({ ...prev, weeklyDigest: val }))}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
                                <div>
                                    <div className="text-sm font-bold">Transparence des briefs IA</div>
                                    <div className="text-xs text-muted-foreground">Détail complet des données consultées lors de la génération du brief.</div>
                                </div>
                                <Switch
                                    checked={notifications.transparentBrief}
                                    onCheckedChange={(val) => setNotifications((prev) => ({ ...prev, transparentBrief: val }))}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 5. Tab Billing */}
                <TabsContent value="billing" className="space-y-6">
                    <BillingPanel />
                </TabsContent>

                {/* 6. Tab Data & Privacy */}
                <TabsContent value="data-privacy" className="space-y-6">
                    <DataPrivacyPanel />
                    <IntegrationsPanel />
                </TabsContent>

                {/* 7. Tab Appearance */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card className="border-t-4 border-t-emerald-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-pixel text-emerald-500">
                                <Palette className="w-5 h-5" />
                                Apparence & Thème Visuel
                            </CardTitle>
                            <CardDescription>
                                Personnalisez le style graphique, la langue et la densité de votre interface.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Thème Graphique</Label>
                                    <Select value={theme} onValueChange={setTheme}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dark">Sombre / Dark Mode (Par défaut)</SelectItem>
                                            <SelectItem value="light">Clair / Light Mode</SelectItem>
                                            <SelectItem value="system">Système</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Langue de l'Interface (i18n)</Label>
                                    <Select value={language} onValueChange={(val: any) => setLanguage(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fr">Français (FR)</SelectItem>
                                            <SelectItem value="en">English (EN)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Densité d'Affichage</Label>
                                    <Select value={density} onValueChange={(val: any) => setDensity(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="comfortable">Confortable (Par défaut)</SelectItem>
                                            <SelectItem value="compact">Compacte (Haute densité)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5">
                                        <Volume2 className="w-4 h-4" /> Effets Sonores (8-bit)
                                    </Label>
                                    <div className="flex items-center justify-between p-2 bg-card border rounded-md h-10">
                                        <span className="text-xs text-muted-foreground">Sons de quêtes & niveau</span>
                                        <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-8">
                <Button onClick={handleSave} className="font-pixel">
                    <Save className="w-4 h-4 mr-2" />
                    {t('saveSettings') || 'Enregistrer les modifications'}
                </Button>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Chargement des paramètres...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
