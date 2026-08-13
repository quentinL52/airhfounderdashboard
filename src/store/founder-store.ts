import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from '@/hooks/use-toast';
import type { PlanStatus, PlanType } from '@/lib/billing/pricing-config';



// --- Types ---

// Module 6: Hypotheses
export type HypothesisStatus = 'draft' | 'testing' | 'validated' | 'invalidated' | 'pivoted';
export type HypothesisRisk = 'critical' | 'high' | 'medium' | 'low';
export type HypothesisCategory = 'problem' | 'solution' | 'channel' | 'revenue' | 'segment';

export interface Hypothesis {
    id: string;
    createdAt: string;
    updatedAt: string;

    // Formulation
    statement: string;
    category: HypothesisCategory;
    riskLevel: HypothesisRisk;

    // Build phase
    testMethod: string;
    successCriteria: string;
    deadline?: string;
    cost?: number;

    // Measure phase
    measureNotes?: string;

    // Learn phase
    status: HypothesisStatus;
    actualResult?: string;
    learnings?: string;
    nextAction?: string;

    // Pivot tracking
    pivotedFromId?: string; // ID of the hypothesis this was pivoted from
}

// Module 7: Finances
export type ExpenseCategory = 'Infrastructure' | 'API IA' | 'Auth & Data' | 'Observabilité' | 'Email' | 'Outils SaaS' | 'Marketing' | 'Divers';
export type ExpenseFrequency = 'monthly' | 'annual' | 'one-time';

export interface ExpenseItem {
    id: string;
    label: string;
    amount: number;
    category: string;
    frequency?: ExpenseFrequency;
    type: 'income' | 'expense';
    date: string; // ISO Date "YYYY-MM-DD"
    notes?: string;
}

export interface OneTimeEntry {
    id: string;
    date: string;
    label: string;
    amount: number; // Positive = income, Negative = expense
    category: string;
    notes?: string;
}

export interface FinanceData {
    cashAvailable: number;
    lastUpdated: string;
    entries: ExpenseItem[];
    oneTimeEntries: OneTimeEntry[];
    targetMRR?: number;
    firstRevenueDate?: string;
    firstRevenueAmount?: number;
}

// Module 12: Dashboard (Aggregated Data is derived, but we need types for OKRs and Routine if we strictly follow spec)
// For now, we'll implement types as we build those modules, but provide placeholders in the store.

// Module 8: Journal
export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface JournalEntry {
    id: string;
    date: string; // ISO String
    content: string; // HTML or Markdown
    mood: Mood;
    tags: string[];
    blockers?: string;
}

// Module 9: OKRs
export interface KeyResult {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string; // e.g., '%', 'users', 'EUR'
}

export interface Objective {
    id: string;
    title: string;
    description?: string;
    progress: number; // 0-100 (auto-calculated)
    keyResults: KeyResult[];
    status: 'on-track' | 'risk' | 'behind' | 'completed';
    quarter: string; // e.g. "Q1 2024"
    endDate?: string; // ISO date string — deadline shown on calendar
}

// Module 10: Content Pipeline
export type ContentChannel = 'LinkedIn' | 'Article' | 'Newsletter' | 'Thread';
export type ContentStatus = 'idea' | 'draft' | 'scheduled' | 'published';

export interface ContentIdea {
    id: string;
    title: string;
    description?: string;
    channel: ContentChannel;
    status: ContentStatus;
    date?: string; // Scheduled or Published date
    tags: string[];
    draftUrl?: string;
    imageUrl?: string;
    contentBody?: string;
    createdAt: string;
    updatedAt: string;
}

// Module 11: CRM Lite
export type ContactType = 'candidat' | 'entreprise' | 'investisseur' | 'école' | 'prospect' | 'partner';
export type ContactStatus = 'À contacter' | 'En discussion' | 'Qualifié' | 'Client' | 'Perdu';

export interface Contact {
    id: string;
    name: string;
    type?: ContactType;
    role?: string;
    company?: string;
    email?: string;
    linkedin?: string;
    status: ContactStatus;
    lastContactDate: string; // ISO Date
    nextActionDate?: string; // ISO Date
    nextActionLabel?: string;
    notes?: string;
    tags?: string[];
}

// Module 12: Routine & Dashboard
export interface RoutineTask {
    id: string; // crypto.randomUUID()
    text: string;
    done: boolean;
}

export interface RoutineDay {
    id: string; // e.g. "monday"
    day: string; // "Lundi"
    tasks: RoutineTask[];
}

export interface RoutineHistory {
    date: string; // ISO Date YYYY-MM-DD
    completedItemIds: string[];
    completionRate: number; // 0-1
}

// Module 14: Competitive Watch
export interface CompetitorRadarScores {
    price: number; // 1-10
    features: number; // 1-10
    ux: number; // 1-10
    market: number; // 1-10
    innovation: number; // 1-10
    support: number; // 1-10
}

export interface CompetitorSWOT {
    strengths: string;
    weaknesses: string;
    opportunities: string;
    threats: string;
}

export type PricingModelType = 'free' | 'freemium' | 'subscription' | 'usage' | 'enterprise' | 'other';
export type FeatureStatus = 'yes' | 'no' | 'partial' | 'planned';

export type CompetitorMomentum = 'rising' | 'stable' | 'declining';

export interface Competitor {
    id: string;
    name: string;
    website?: string;
    description?: string;
    strengths?: string;
    weaknesses?: string;
    pricing?: string;
    positioning?: string;
    // Structured fields for strategic analysis
    targetSegment?: string;
    businessModel?: string;
    teamSize?: string;
    fundingStage?: string;
    fundingAmount?: string;
    keyFeatures?: string[];
    differentiators?: string[];
    pricingModel?: PricingModelType;
    pricingRange?: string;
    yearFounded?: string;
    geography?: string;
    radarScores: CompetitorRadarScores;
    swot: CompetitorSWOT;
    featureAnalysis?: Record<string, FeatureStatus>;
    // Intelligence fields
    threatLevel?: number; // 0-100
    momentum?: CompetitorMomentum;
    tags?: string[];
    lastCheckedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MySolution {
    name: string;
    website: string;
    description: string;
    positioning?: string;
    targetSegment?: string;
    businessModel?: string;
    keyFeatures?: string[];
    differentiators?: string[];
    pricingModel?: PricingModelType;
    pricingRange?: string;
    radarScores: CompetitorRadarScores;
    swot: {
        strengths: string;
        weaknesses: string;
        opportunities: string;
        threats: string;
    };
    featureAnalysis: Record<string, FeatureStatus>;
    comparisonCriteria: string[];
    // Intelligence fields
    competitiveAdvantages?: string[];
    targetMarketSize?: string;
    // Parity with Competitor for 1:1 comparison
    teamSize?: string;
    fundingStage?: string;
    fundingAmount?: string;
    yearFounded?: string;
    geography?: string;
    pricing?: string; // Text summary
}

import type { GoToMarketStrategy as ModuleGtmStrategy } from '@/modules/gtm';
export type GoToMarketStrategy = ModuleGtmStrategy;


export interface RoadmapItem {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'doing' | 'done';
    priority: 'high' | 'medium' | 'low';
    week?: string;
    startDate?: string; // ISO date string
    dueDate?: string;   // ISO date string
    gtmStepId?: string;
    createdAt: string;
    updatedAt: string;
}

export type MarketSignalImpact = 'positive' | 'negative' | 'neutral';
export type MarketSignalCategory = 'funding' | 'product_launch' | 'pricing_change' | 'partnership' | 'hiring' | 'acquisition' | 'market_entry' | 'regulation' | 'technology' | 'leadership' | 'other';
export type MarketSignalUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface MarketSignal {
    id: string;
    date: string;
    title: string;
    description?: string;
    source?: string;
    impact: MarketSignalImpact;
    competitorId?: string;
    category?: MarketSignalCategory;
    urgency?: MarketSignalUrgency;
    sourceUrl?: string;
    isAutoGenerated?: boolean;
    aiSummary?: string;
    createdAt: string;
}

// Module 13: Weekly AI Coach
export interface WeeklyReport {
    id: string;
    date: string; // ISO Date of generation (Monday)
    content: string; // Markdown
    status: 'pending' | 'generated' | 'failed';
    createdAt: string; // ISO String
}

// Module 13: Strategic Recommendations (AI)
export interface StrategicRecommendation {
    generatedAt: string;
    featureGaps: { feature: string; status: 'critical' | 'nice-to-have'; reason: string }[];
    leanCanvasRecommendations: { section: string; suggestion: string }[];
    roadmapRecommendations: { title: string; priority: 'high' | 'medium' | 'low'; timeframe: string }[];
    hypothesisSuggestions: { statement: string; category: string; testMethod: string }[];
    routineOptimization: { suggestion: string; benefit: string; timeframe: string }[];
    marketNews: { title: string; url: string; summary: string; date?: string }[];
    swotAnalysis?: {
        strengths: string[];
        weaknesses: string[];
        opportunities: string[];
        threats: string[];
    };
}

// Module 14+: Competitive Intelligence System
export type AlertType = 'threat' | 'opportunity' | 'action_required' | 'info';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ScenarioProbability = 'low' | 'medium' | 'high';
export type ScenarioImpact = 'low' | 'medium' | 'high';

export interface CompetitiveSnapshot {
    id: string;
    date: string;
    competitorId: string;
    radarScores: CompetitorRadarScores;
    overallThreatLevel: number; // 0-100
}

export interface CompetitiveAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    relatedCompetitorId?: string;
    suggestedAction?: string;
    createdAt: string;
    acknowledgedAt?: string;
    source: 'ai_analysis' | 'signal_detection' | 'score_change' | 'manual';
}

export interface CompetitiveHealthBreakdown {
    featureParity: number;      // 0-100
    pricingPosition: number;    // 0-100
    marketMomentum: number;     // 0-100
    differentiationStrength: number; // 0-100
    threatExposure: number;     // 0-100
}

export interface CompetitiveIntelligence {
    lastAnalyzedAt: string;
    healthScore: number; // 0-100
    healthBreakdown: CompetitiveHealthBreakdown;
    alerts: CompetitiveAlert[];
    trendSummary?: string;
}

export interface ScenarioAnalysis {
    id: string;
    scenario: string;
    probability: ScenarioProbability;
    impact: ScenarioImpact;
    yourResponse: string;
    timeline: string;
    createdAt: string;
}

export interface LeanCanvasSnapshot {
    id: string;
    date: string;
    data: Record<string, string>;
}

export type AIProviderName = 'openai' | 'anthropic' | 'gemini' | 'mistral';

export interface AiSettings {
    /** Currently active provider */
    provider: AIProviderName | '';
    /** Currently selected model ID (e.g. 'gpt-4o', 'claude-sonnet-4-20250514') */
    model: string;
    /** Configuration of models per sub-agent role */
    modelsConfig: Record<string, string>;
    /** List of providers that have an API key configured on the server */
    configuredProviders: string[];
}

/** Profil du fondateur : identité et style d'écriture pour les agents IA */
export interface FounderProfile {
    /** URL du profil LinkedIn */
    linkedinUrl: string;
    /** Exemples de posts ou description du ton d'écriture de l'utilisateur */
    writingStyleContext: string;
    /** Nom ou pseudo affiché */
    displayName: string;
    /** Secteur / niche (ex: "SaaS B2B", "HealthTech") */
    niche: string;
}

export interface FounderStore {
    // --- State ---
    userId: string | null;
    planStatus: PlanStatus;
    plan: PlanType | null;
    founderDeal: boolean;
    cohort: number | null;
    cohortRank: number | null;
    hypotheses: Hypothesis[];
    finance: FinanceData;
    journalEntries: JournalEntry[];
    objectives: Objective[];
    contentIdeas: ContentIdea[]; // NEW
    contacts: Contact[]; // Module 11
    routine: RoutineDay[]; // Module 12
    routineHistory: RoutineHistory[]; // Module 12 - Routine Optimization
    leanCanvas: Record<string, string>;
    leanCanvasSnapshots: LeanCanvasSnapshot[];
    roadmap: RoadmapItem[];
    weeklyReport: WeeklyReport | null; // Module 13
    competitors: Competitor[]; // Module 14
    marketSignals: MarketSignal[]; // Module 14
    mySolution: MySolution; // Module 14 - User's own solution for benchmarking
    strategicRecommendations: StrategicRecommendation | null;
    // Competitive Intelligence System
    competitiveIntelligence: CompetitiveIntelligence | null;
    competitiveSnapshots: CompetitiveSnapshot[];
    scenarioAnalyses: ScenarioAnalysis[];
    aiSettings: AiSettings;
    founderProfile: FounderProfile;
    goToMarket: GoToMarketStrategy;
    mvpTargetDate: string | null;
    dashboardLayout: { id: string; type: string; size: 'small' | 'medium' | 'large' | 'full' }[];

    // --- Actions ---

    // Hypotheses
    addHypothesis: (hypothesis: Omit<Hypothesis, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateHypothesis: (id: string, updates: Partial<Hypothesis>) => Promise<void>;
    deleteHypothesis: (id: string) => Promise<void>;

    // Finances
    updateCashAvailable: (amount: number) => void;
    updateFinanceData: (updates: Partial<FinanceData>) => void;
    hydrateFinances: (data: { settings: any, entries: any[], oneTimeEntries: any[] }) => void;
    addEntry: (entry: Omit<ExpenseItem, 'id'>) => Promise<void>;
    updateEntry: (id: string, updates: Partial<ExpenseItem>) => Promise<void>;
    deleteEntry: (id: string) => Promise<void>;
    addOneTimeEntry: (entry: Omit<OneTimeEntry, 'id'>) => Promise<void>;
    deleteOneTimeEntry: (id: string) => Promise<void>;

    // Journal
    addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
    updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
    deleteJournalEntry: (id: string) => void;

    // OKRs
    addObjective: (objective: Omit<Objective, 'id' | 'progress' | 'keyResults'>) => void;
    updateObjective: (id: string, updates: Partial<Objective>) => void;
    deleteObjective: (id: string) => void;
    addKeyResult: (objectiveId: string, keyResult: Omit<KeyResult, 'id'>) => void;
    updateKeyResult: (objectiveId: string, keyResultId: string, updates: Partial<KeyResult>) => void;
    deleteKeyResult: (objectiveId: string, keyResultId: string) => void;

    // Content Pipeline
    addContentIdea: (idea: Omit<ContentIdea, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateContentIdea: (id: string, updates: Partial<ContentIdea>) => void;
    deleteContentIdea: (id: string) => void;

    // CRM
    addContact: (contact: Omit<Contact, 'id'>) => void;
    updateContact: (id: string, updates: Partial<Contact>) => void;
    deleteContact: (id: string) => void;

    // Routine
    toggleRoutineTask: (dayId: string, taskId: string) => void;
    addRoutineTask: (dayId: string, text: string) => void;
    updateRoutineTask: (dayId: string, taskId: string, text: string) => void;
    deleteRoutineTask: (dayId: string, taskId: string) => void;
    resetRoutineWeek: () => void;

    // Weekly Coach
    setWeeklyReport: (report: WeeklyReport | null) => void;

    // Competitive Watch Actions
    addCompetitor: (competitor: Omit<Competitor, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateCompetitor: (id: string, updates: Partial<Competitor>) => void;
    deleteCompetitor: (id: string) => void;
    updateMySolution: (updates: Partial<MySolution>) => void;
    addMarketSignal: (signal: Omit<MarketSignal, 'id' | 'createdAt' | 'updatedAt'>) => void;
    deleteMarketSignal: (id: string) => void;

    // Feature Matrix Actions
    addComparisonCriterion: (feature: string) => void;
    deleteComparisonCriterion: (feature: string) => void;

    // Market Signal update
    updateMarketSignal: (id: string, updates: Partial<MarketSignal>) => void;

    // Competitive Intelligence Actions
    setCompetitiveIntelligence: (intelligence: CompetitiveIntelligence) => void;
    addCompetitiveSnapshot: (snapshot: Omit<CompetitiveSnapshot, 'id'>) => void;
    acknowledgeAlert: (alertId: string) => void;
    addScenarioAnalysis: (scenario: Omit<ScenarioAnalysis, 'id' | 'createdAt'>) => void;
    updateScenarioAnalysis: (id: string, updates: Partial<ScenarioAnalysis>) => void;
    deleteScenarioAnalysis: (id: string) => void;

    // AI Actions
    setStrategicRecommendations: (recommendations: StrategicRecommendation) => void;
    showStrategicRecommendations: boolean;
    toggleStrategicRecommendations: () => void;
    removeStrategicRecommendation: (
        type: 'swot' | 'lean' | 'roadmap',
        content: string,
        swotType?: 'strengths' | 'weaknesses' | 'opportunities' | 'threats'
    ) => void;
    addSwotItem: (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', content: string) => void;
    updateSwotItem: (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', index: number, content: string) => void;
    removeSwotItem: (type: 'strengths' | 'weaknesses' | 'opportunities' | 'threats', index: number) => void;

    // Canvas
    updateCanvasSection: (sectionId: string, content: string) => Promise<void>;
    saveLeanCanvasSnapshot: () => void;
    deleteLeanCanvasSnapshot: (id: string) => void;

    // Roadmap
    addRoadmapItem: (item: Omit<RoadmapItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateRoadmapItem: (id: string, updates: Partial<RoadmapItem>) => Promise<void>;
    deleteRoadmapItem: (id: string) => Promise<void>;

    // --- Settings / i18n ---
    language: 'fr' | 'en';
    setLanguage: (lang: 'fr' | 'en') => void;
    hydrate: (state: Partial<FounderStore>) => void;
    density: 'compact' | 'comfortable';
    setDensity: (density: 'compact' | 'comfortable') => void;
    setUserId: (id: string | null) => void;
    setPlanStatus: (status: PlanStatus) => void;
    setPlan: (plan: PlanType | null) => void;
    setFounderDeal: (val: boolean) => void;
    setCohort: (val: number | null) => void;
    setCohortRank: (val: number | null) => void;
    setAiSettings: (settings: Partial<AiSettings>) => void;
    setFounderProfile: (profile: Partial<FounderProfile>) => void;
    updateGoToMarket: (updates: Partial<GoToMarketStrategy>) => void;
    setMvpTargetDate: (date: string | null) => void;
    setDashboardLayout: (layout: { id: string; type: string; size: 'small' | 'medium' | 'large' | 'full' }[]) => void;
    reset: () => void;
}

// Helper to calc progress
const calculateObjectiveProgress = (krs: KeyResult[]): number => {
    if (krs.length === 0) return 0;
    const total = krs.reduce((acc, kr) => {
        const p = Math.min(100, Math.max(0, (kr.current / kr.target) * 100));
        return acc + p;
    }, 0);
    return Math.round(total / krs.length);
};

// --- Store Implementation ---

const initialState = {
    userId: null,
    planStatus: 'trialing' as PlanStatus,
    plan: null as PlanType | null,
    founderDeal: false,
    cohort: null,
    cohortRank: null,
    language: 'fr' as const,
    hypotheses: [],
    finance: {
        cashAvailable: 0,
        lastUpdated: new Date().toISOString(),
        entries: [],
        oneTimeEntries: [],
    },
    journalEntries: [],
    objectives: [],
    contentIdeas: [],
    contacts: [],
    routine: [
        {
            id: 'mon', day: 'Lundi', tasks: [
                { id: '1', text: 'Revue stratégie & mise à jour Lean Canvas', done: false },
                { id: '2', text: 'Définir les 3 priorités de la semaine', done: false }
            ]
        },
        {
            id: 'tue', day: 'Mardi', tasks: [
                { id: '3', text: 'Outreach : contacter 5-10 prospects', done: false },
                { id: '4', text: '1 interview utilisateur (15-20 min)', done: false }
            ]
        },
        {
            id: 'wed', day: 'Mercredi', tasks: [
                { id: '5', text: 'Rédiger 1 post LinkedIn (build in public)', done: false },
                { id: '6', text: 'Veille concurrence & écosystème IA', done: false }
            ]
        },
        {
            id: 'thu', day: 'Jeudi', tasks: [
                { id: '7', text: '1 appel réseau (mentor, fondateur, expert)', done: false },
                { id: '8', text: 'Avancement admin / finance / juridique', done: false }
            ]
        },
        {
            id: 'fri', day: 'Vendredi', tasks: [
                { id: '9', text: 'Synthèse feedback utilisateurs → décisions produit', done: false },
                { id: '10', text: 'Rétrospective perso : qu\'est-ce qui a marché ?', done: false },
                { id: '11', text: 'Mise à jour roadmap semaine suivante', done: false }
            ]
        }
    ],
    routineHistory: [],
    leanCanvas: {},
    leanCanvasSnapshots: [],
    roadmap: [], // Initial empty state
    weeklyReport: null,
    competitors: [],
    marketSignals: [],
    mySolution: {
        name: '',
        website: '',
        description: '',
        radarScores: {
            price: 5,
            features: 5,
            ux: 5,
            market: 5,
            innovation: 5,
            support: 5,
        },
        swot: {
            strengths: '',
            weaknesses: '',
            opportunities: '',
            threats: '',
        },
        featureAnalysis: {},
        comparisonCriteria: ['Mobile App', 'API Access', '24/7 Support', 'Custom Branding', 'Analytics'], // Defaults
        teamSize: '',
        fundingStage: '',
        fundingAmount: '',
        yearFounded: '',
        geography: '',
        pricing: '',
    },
    strategicRecommendations: null,
    competitiveIntelligence: null,
    competitiveSnapshots: [],
    scenarioAnalyses: [],
    showStrategicRecommendations: true, // Default to true
    aiSettings: {
        provider: 'openai',
        model: 'gpt-4o',
        modelsConfig: {},
        configuredProviders: [],
    } as AiSettings,
    founderProfile: {
        linkedinUrl: '',
        writingStyleContext: '',
        displayName: '',
        niche: '',
    },
    goToMarket: {
        sbHero: '',
        sbProblem: '',
        sbGuide: '',
        oaAlternatives: '',
        oaUniqueAttributes: '',
        oaValue: '',
        ompTarget: '',
        ompMessage: '',
        ompMedia: '',
        csAtomicNetwork: '',
        owCadence: '',
    },
    mvpTargetDate: null,
    dashboardLayout: [],
};

export const useFounderStore = create<FounderStore>()(
    persist(
        (set, get) => ({
            ...initialState,
            language: 'fr', // Explicit override if needed, but initialState has it

            density: 'comfortable',
    setDensity: (density) => set({ density }),
    setUserId: (id) => set({ userId: id }),
            setPlanStatus: (status) => set({ planStatus: status }),
            setPlan: (plan) => set({ plan }),
            setFounderDeal: (val) => set({ founderDeal: val }),
            setCohort: (val) => set({ cohort: val }),
            setCohortRank: (val) => set({ cohortRank: val }),
            setLanguage: (lang) => set({ language: lang }),
            setAiSettings: (settings) => set((state) => ({ aiSettings: { ...state.aiSettings, ...settings } })),
            setFounderProfile: (profile) => set((state) => ({ founderProfile: { ...state.founderProfile, ...profile } })),
            updateGoToMarket: (updates) => set((state) => ({ goToMarket: { ...state.goToMarket, ...updates } })),
            setMvpTargetDate: (date) => set({ mvpTargetDate: date }),
            setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
            reset: () => set(initialState),
            hydrate: (state) => set({ ...state }),
            addHypothesis: async (hypothesis) => {
                const id = crypto.randomUUID();
                const now = new Date().toISOString();
                const newHypothesis = { ...hypothesis, id, createdAt: now, updatedAt: now } as Hypothesis;
                
                set((state) => ({ hypotheses: [ ...state.hypotheses, newHypothesis ] }));

                try {
                    const res = await fetch('/api/data/hypotheses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'add', payload: newHypothesis })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    set((state) => ({ hypotheses: state.hypotheses.filter((h) => h.id !== id) }));
                }
            },

            updateHypothesis: async (id, updates) => {
                let previousHypothesis: Hypothesis | undefined;
                set((state) => {
                    previousHypothesis = state.hypotheses.find(h => h.id === id);
                    return {
                        hypotheses: state.hypotheses.map((h) => h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h)
                    };
                });
                
                try {
                    const res = await fetch('/api/data/hypotheses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'update', payload: { id, ...updates } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    if (previousHypothesis) {
                        set((state) => ({ hypotheses: state.hypotheses.map((h) => h.id === id ? previousHypothesis! : h) }));
                    }
                }
            },

            deleteHypothesis: async (id) => {
                let previousHypothesis: Hypothesis | undefined;
                set((state) => {
                    previousHypothesis = state.hypotheses.find(h => h.id === id);
                    return { hypotheses: state.hypotheses.filter((h) => h.id !== id) };
                });
                
                try {
                    const res = await fetch('/api/data/hypotheses', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete', payload: { id } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
                    if (previousHypothesis) {
                        set((state) => ({ hypotheses: [ ...state.hypotheses, previousHypothesis! ] }));
                    }
                }
            },

            updateCashAvailable: async (amount) => {
                let previousAmount: number;
                set((state) => {
                    previousAmount = state.finance.cashAvailable;
                    return {
                        finance: {
                            ...state.finance,
                            cashAvailable: amount,
                            lastUpdated: new Date().toISOString(),
                        },
                    };
                });
                
                try {
                    const state = get();
                    const payload = {
                        cashAvailable: amount,
                        targetMrr: state.finance.targetMRR,
                        firstRevenueDate: state.finance.firstRevenueDate,
                        firstRevenueAmount: state.finance.firstRevenueAmount
                    };
                    const res = await fetch('/api/data/finances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'updateSettings', payload })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    set((state) => ({ finance: { ...state.finance, cashAvailable: previousAmount } }));
                }
            },

            updateFinanceData: async (updates) => {
                let previousFinance: any;
                set((state) => {
                    previousFinance = { ...state.finance };
                    return {
                        finance: {
                            ...state.finance,
                            ...updates,
                            lastUpdated: new Date().toISOString(),
                        },
                    };
                });

                try {
                    const state = get();
                    const payload = {
                        cashAvailable: state.finance.cashAvailable,
                        targetMrr: state.finance.targetMRR,
                        firstRevenueDate: state.finance.firstRevenueDate,
                        firstRevenueAmount: state.finance.firstRevenueAmount,
                        // Override with updates just in case state wasn't updated synchronously in time (though it should be)
                        ...updates
                    };
                    const res = await fetch('/api/data/finances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'updateSettings', payload })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    if (previousFinance) {
                        set((state) => ({ finance: previousFinance }));
                    }
                }
            },

            hydrateFinances: (data) => set((state) => ({
                finance: {
                    ...state.finance,
                    cashAvailable: data.settings?.cashAvailable ?? 0,
                    targetMRR: data.settings?.targetMrr ?? 0,
                    firstRevenueDate: data.settings?.firstRevenueDate,
                    firstRevenueAmount: data.settings?.firstRevenueAmount,
                    entries: data.entries || [],
                    oneTimeEntries: data.oneTimeEntries || [],
                    lastUpdated: new Date().toISOString(),
                }
            })),

            addEntry: async (entry) => {
                const id = crypto.randomUUID();
                const newEntry = { ...entry, id };
                
                set((state) => ({
                    finance: { ...state.finance, entries: [...(state.finance.entries || []), newEntry] }
                }));

                try {
                    const res = await fetch('/api/data/finances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'addEntry', payload: newEntry })
                    });
                    if (!res.ok) throw new Error('API Error');
                    const data = await res.json();
                    if (data.gamification?.xpAdded) {
                        toast({ title: 'XP Gained!', description: `+${data.gamification.xpAdded} XP` });
                    }
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    set((state) => ({
                        finance: { ...state.finance, entries: (state.finance.entries || []).filter(e => e.id !== id) }
                    }));
                }
            },

            updateEntry: async (id, updates) => {
                let previousEntry: ExpenseItem | undefined;
                set((state) => {
                    previousEntry = (state.finance.entries || []).find(e => e.id === id);
                    return {
                        finance: {
                            ...state.finance,
                            entries: (state.finance.entries || []).map(e => e.id === id ? { ...e, ...updates } : e)
                        }
                    };
                });

                try {
                    const res = await fetch('/api/data/finances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'updateEntry', payload: { id, ...updates } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de modifier', variant: 'destructive' });
                    if (previousEntry) {
                        set((state) => ({
                            finance: {
                                ...state.finance,
                                entries: (state.finance.entries || []).map(e => e.id === id ? previousEntry! : e)
                            }
                        }));
                    }
                }
            },

            deleteEntry: async (id) => {
                let previousEntry: ExpenseItem | undefined;
                set((state) => {
                    previousEntry = (state.finance.entries || []).find(e => e.id === id);
                    return {
                        finance: {
                            ...state.finance,
                            entries: (state.finance.entries || []).filter(e => e.id !== id)
                        }
                    };
                });

                try {
                    const res = await fetch('/api/data/finances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'deleteEntry', payload: { id } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
                    if (previousEntry) {
                        set((state) => ({
                            finance: { ...state.finance, entries: [...(state.finance.entries || []), previousEntry!] }
                        }));
                    }
                }
            },

            addOneTimeEntry: async (entry) => {
                const id = crypto.randomUUID();
                const newEntry = { ...entry, id };
                set((state) => ({
                    finance: { ...state.finance, oneTimeEntries: [...(state.finance.oneTimeEntries || []), newEntry] }
                }));

                try {
                    const res = await fetch('/api/data/finances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'addOneTimeEntry', payload: newEntry })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible d\'ajouter', variant: 'destructive' });
                    set((state) => ({
                        finance: { ...state.finance, oneTimeEntries: (state.finance.oneTimeEntries || []).filter(e => e.id !== id) }
                    }));
                }
            },

            deleteOneTimeEntry: async (id) => {
                let previousEntry: OneTimeEntry | undefined;
                set((state) => {
                    previousEntry = (state.finance.oneTimeEntries || []).find(e => e.id === id);
                    return {
                        finance: { ...state.finance, oneTimeEntries: (state.finance.oneTimeEntries || []).filter(e => e.id !== id) }
                    };
                });
                
                try {
                    const res = await fetch('/api/data/finances', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'deleteOneTimeEntry', payload: { id } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
                    if (previousEntry) {
                        set((state) => ({
                            finance: { ...state.finance, oneTimeEntries: [...(state.finance.oneTimeEntries || []), previousEntry!] }
                        }));
                    }
                }
            },

            addJournalEntry: (entry) => set((state) => {
                const entryDate = entry.date.split('T')[0]; // Simple YYYY-MM-DD check
                const existingIndex = state.journalEntries.findIndex(e => e.date.split('T')[0] === entryDate);

                if (existingIndex >= 0) {
                    // Update existing
                    const newEntries = [...state.journalEntries];
                    newEntries[existingIndex] = { ...newEntries[existingIndex], ...entry };
                    return { journalEntries: newEntries };
                }

                return {
                    journalEntries: [
                        ...state.journalEntries,
                        { ...entry, id: crypto.randomUUID() }
                    ]
                };
            }),

            updateJournalEntry: (id, updates) => set((state) => ({
                journalEntries: state.journalEntries.map((e) =>
                    e.id === id ? { ...e, ...updates } : e
                )
            })),

            deleteJournalEntry: (id) => set((state) => ({
                journalEntries: state.journalEntries.filter((e) => e.id !== id)
            })),

            // OKR Actions
            addObjective: (objective) => set((state) => ({
                objectives: [
                    ...state.objectives,
                    { ...objective, id: crypto.randomUUID(), progress: 0, keyResults: [] }
                ]
            })),

            updateObjective: (id, updates) => set((state) => ({
                objectives: state.objectives.map(o => o.id === id ? { ...o, ...updates } : o)
            })),

            deleteObjective: (id) => set((state) => ({
                objectives: state.objectives.filter(o => o.id !== id)
            })),

            addKeyResult: (objectiveId, keyResult) => set((state) => {
                const newKR = { ...keyResult, id: crypto.randomUUID() };
                const updatedObjectives = state.objectives.map(o => {
                    if (o.id === objectiveId) {
                        const newKRs = [...o.keyResults, newKR];
                        return {
                            ...o,
                            keyResults: newKRs,
                            progress: calculateObjectiveProgress(newKRs)
                        };
                    }
                    return o;
                });
                return { objectives: updatedObjectives };
            }),

            updateKeyResult: (objectiveId, keyResultId, updates) => set((state) => {
                const updatedObjectives = state.objectives.map(o => {
                    if (o.id === objectiveId) {
                        const newKRs = o.keyResults.map(kr =>
                            kr.id === keyResultId ? { ...kr, ...updates } : kr
                        );
                        return {
                            ...o,
                            keyResults: newKRs,
                            progress: calculateObjectiveProgress(newKRs)
                        };
                    }
                    return o;
                });
                return { objectives: updatedObjectives };
            }),

            deleteKeyResult: (objectiveId, keyResultId) => set((state) => {
                const updatedObjectives = state.objectives.map(o => {
                    if (o.id === objectiveId) {
                        const newKRs = o.keyResults.filter(kr => kr.id !== keyResultId);
                        return {
                            ...o,
                            keyResults: newKRs,
                            progress: calculateObjectiveProgress(newKRs)
                        };
                    }
                    return o;
                });
                return { objectives: updatedObjectives };
            }),

            // Content Pipeline Actions
            addContentIdea: (idea) => set((state) => ({
                contentIdeas: [
                    ...state.contentIdeas,
                    {
                        ...idea,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    }
                ]
            })),

            updateContentIdea: (id, updates) => set((state) => ({
                contentIdeas: state.contentIdeas.map(i =>
                    i.id === id
                        ? { ...i, ...updates, updatedAt: new Date().toISOString() }
                        : i
                )
            })),

            deleteContentIdea: (id) => set((state) => ({
                contentIdeas: state.contentIdeas.filter(i => i.id !== id)
            })),


            // Competitive Watch Actions
            addCompetitor: (competitor) => set((state) => ({
                competitors: [
                    ...state.competitors,
                    {
                        ...competitor,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                ],
            })),

            updateCompetitor: (id, updates) => set((state) => ({
                competitors: state.competitors.map((c) =>
                    c.id === id
                        ? { ...c, ...updates, updatedAt: new Date().toISOString() }
                        : c
                ),
            })),

            updateMySolution: (updates) => set((state) => ({
                mySolution: { ...state.mySolution, ...updates }
            })),

            deleteCompetitor: (id) => set((state) => ({
                competitors: state.competitors.filter((c) => c.id !== id),
            })),

            addMarketSignal: (signal) => set((state) => ({
                marketSignals: [
                    ...state.marketSignals,
                    {
                        ...signal,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    },
                ],
            })),

            deleteMarketSignal: (id) => set((state) => ({
                marketSignals: state.marketSignals.filter((s) => s.id !== id),
            })),



            addComparisonCriterion: (feature) => set((state) => {
                const currentCriteria = state.mySolution.comparisonCriteria || [];
                if (currentCriteria.includes(feature)) return state;
                return {
                    mySolution: {
                        ...state.mySolution,
                        comparisonCriteria: [...currentCriteria, feature]
                    }
                };
            }),

            deleteComparisonCriterion: (feature) => set((state) => ({
                mySolution: {
                    ...state.mySolution,
                    comparisonCriteria: (state.mySolution.comparisonCriteria || []).filter(f => f !== feature)
                }
            })),

            updateMarketSignal: (id, updates) => set((state) => ({
                marketSignals: state.marketSignals.map((s) =>
                    s.id === id ? { ...s, ...updates } : s
                ),
            })),

            // Competitive Intelligence Actions
            setCompetitiveIntelligence: (intelligence) => set({ competitiveIntelligence: intelligence }),

            addCompetitiveSnapshot: (snapshot) => set((state) => ({
                competitiveSnapshots: [
                    ...state.competitiveSnapshots,
                    { ...snapshot, id: crypto.randomUUID() },
                ],
            })),

            acknowledgeAlert: (alertId) => set((state) => {
                if (!state.competitiveIntelligence) return state;
                return {
                    competitiveIntelligence: {
                        ...state.competitiveIntelligence,
                        alerts: state.competitiveIntelligence.alerts.map((a) =>
                            a.id === alertId
                                ? { ...a, acknowledgedAt: new Date().toISOString() }
                                : a
                        ),
                    },
                };
            }),

            addScenarioAnalysis: (scenario) => set((state) => ({
                scenarioAnalyses: [
                    ...state.scenarioAnalyses,
                    {
                        ...scenario,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                    },
                ],
            })),

            updateScenarioAnalysis: (id, updates) => set((state) => ({
                scenarioAnalyses: state.scenarioAnalyses.map((s) =>
                    s.id === id ? { ...s, ...updates } : s
                ),
            })),

            deleteScenarioAnalysis: (id) => set((state) => ({
                scenarioAnalyses: state.scenarioAnalyses.filter((s) => s.id !== id),
            })),

            updateCanvasSection: async (sectionId, content) => {
                let previousContent: string = '';
                set((state) => {
                    previousContent = state.leanCanvas[sectionId] || '';
                    return { leanCanvas: { ...state.leanCanvas, [sectionId]: content } };
                });
                try {
                    const res = await fetch('/api/data/canvas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'updateSection', payload: { sectionId, content } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    set((state) => ({ leanCanvas: { ...state.leanCanvas, [sectionId]: previousContent } }));
                }
            },

            saveLeanCanvasSnapshot: () => set((state) => {
                const newSnapshot = {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    data: { ...state.leanCanvas },
                };
                return {
                    leanCanvasSnapshots: [newSnapshot, ...state.leanCanvasSnapshots]
                };
            }),

            deleteLeanCanvasSnapshot: (id) => set((state) => ({
                leanCanvasSnapshots: state.leanCanvasSnapshots.filter(s => s.id !== id)
            })),

            // Roadmap Actions
            addRoadmapItem: async (item) => {
                const id = crypto.randomUUID();
                const now = new Date().toISOString();
                const newItem = { ...item, id, createdAt: now, updatedAt: now } as RoadmapItem;
                
                set((state) => ({ roadmap: [ ...state.roadmap, newItem ] }));

                try {
                    const res = await fetch('/api/data/roadmap', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'add', payload: newItem })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    set((state) => ({ roadmap: state.roadmap.filter((r) => r.id !== id) }));
                }
            },

            updateRoadmapItem: async (id, updates) => {
                let previousItem: RoadmapItem | undefined;
                set((state) => {
                    previousItem = state.roadmap.find(r => r.id === id);
                    return {
                        roadmap: state.roadmap.map((item) => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)
                    };
                });
                
                try {
                    const res = await fetch('/api/data/roadmap', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'update', payload: { id, ...updates } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de sauvegarder', variant: 'destructive' });
                    if (previousItem) {
                        set((state) => ({ roadmap: state.roadmap.map((item) => item.id === id ? previousItem! : item) }));
                    }
                }
            },

            deleteRoadmapItem: async (id) => {
                let previousItem: RoadmapItem | undefined;
                set((state) => {
                    previousItem = state.roadmap.find(r => r.id === id);
                    return { roadmap: state.roadmap.filter((item) => item.id !== id) };
                });
                
                try {
                    const res = await fetch('/api/data/roadmap', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'delete', payload: { id } })
                    });
                    if (!res.ok) throw new Error('API Error');
                } catch (e) {
                    toast({ title: 'Erreur', description: 'Impossible de supprimer', variant: 'destructive' });
                    if (previousItem) {
                        set((state) => ({ roadmap: [ ...state.roadmap, previousItem! ] }));
                    }
                }
            },

            // CRM Actions
            addContact: (contact) => set((state) => ({
                contacts: [
                    ...state.contacts,
                    {
                        ...contact,
                        id: crypto.randomUUID(),
                        lastContactDate: contact.lastContactDate || new Date().toISOString(),
                    }
                ]
            })),

            updateContact: (id, updates) => set((state) => ({
                contacts: state.contacts.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                )
            })),

            deleteContact: (id) => set((state) => ({
                contacts: state.contacts.filter(c => c.id !== id)
            })),

            // Routine Actions
            toggleRoutineTask: (dayId, taskId) => set((state) => {
                const newRoutine = state.routine.map(day =>
                    day.id === dayId ? {
                        ...day,
                        tasks: day.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
                    } : day
                );

                // Calculate progress
                const totalTasks = newRoutine.reduce((acc, day) => acc + day.tasks.length, 0);
                const completedTasks = newRoutine.reduce((acc, day) => acc + day.tasks.filter(t => t.done).length, 0);
                const rate = totalTasks > 0 ? completedTasks / totalTasks : 0;

                // Update History for Today
                const today = new Date().toISOString().split('T')[0];
                const existingHistoryIndex = state.routineHistory.findIndex(h => h.date === today);
                let newHistory = [...state.routineHistory];

                if (existingHistoryIndex >= 0) {
                    newHistory[existingHistoryIndex] = {
                        ...newHistory[existingHistoryIndex],
                        completionRate: rate,
                        completedItemIds: [] // We could track specific IDs here if needed
                    };
                } else {
                    newHistory.push({
                        date: today,
                        completionRate: rate,
                        completedItemIds: []
                    });
                }

                // Keep history sorted or limited? Maybe just last 90 days.
                if (newHistory.length > 365) newHistory = newHistory.slice(-365);

                return {
                    routine: newRoutine,
                    routineHistory: newHistory
                };
            }),

            addRoutineTask: (dayId, text) => set((state) => ({
                routine: state.routine.map(day =>
                    day.id === dayId ? {
                        ...day,
                        tasks: [...day.tasks, { id: crypto.randomUUID(), text, done: false }]
                    } : day
                )
            })),

            updateRoutineTask: (dayId, taskId, text) => set((state) => ({
                routine: state.routine.map(day =>
                    day.id === dayId ? {
                        ...day,
                        tasks: day.tasks.map(t => t.id === taskId ? { ...t, text } : t)
                    } : day
                )
            })),

            deleteRoutineTask: (dayId, taskId) => set((state) => ({
                routine: state.routine.map(day =>
                    day.id === dayId ? {
                        ...day,
                        tasks: day.tasks.filter(t => t.id !== taskId)
                    } : day
                )
            })),

            resetRoutineWeek: () => set((state) => ({
                routine: state.routine.map(day => ({
                    ...day,
                    tasks: day.tasks.map(t => ({ ...t, done: false }))
                }))
            })),

            setWeeklyReport: (report) => set({ weeklyReport: report }),

            // AI Actions
            setStrategicRecommendations: (recommendations) => set({ strategicRecommendations: recommendations }),
            toggleStrategicRecommendations: () => set((state) => ({ showStrategicRecommendations: !state.showStrategicRecommendations })),
            removeStrategicRecommendation: (type, content, swotType) => set((state) => {
                const current = state.strategicRecommendations;
                if (!current) return state;

                const newState = { ...current };

                if (type === 'roadmap') {
                    newState.roadmapRecommendations = current.roadmapRecommendations.filter(r => r.title !== content);
                } else if (type === 'lean') {
                    newState.leanCanvasRecommendations = current.leanCanvasRecommendations.filter(r => r.suggestion !== content);
                } else if (type === 'swot' && swotType && newState.swotAnalysis) {
                    newState.swotAnalysis = {
                        ...newState.swotAnalysis,
                        [swotType]: newState.swotAnalysis[swotType].filter(s => s !== content)
                    };
                }

                return { strategicRecommendations: newState };
            }),

            addSwotItem: (type, content) => set((state) => {
                const current = state.strategicRecommendations;
                // If no recommendations exist, create the structure
                if (!current) {
                    return {
                        strategicRecommendations: {
                            generatedAt: new Date().toISOString(),
                            featureGaps: [],
                            leanCanvasRecommendations: [],
                            roadmapRecommendations: [],
                            hypothesisSuggestions: [],
                            routineOptimization: [],
                            marketNews: [],
                            swotAnalysis: {
                                strengths: type === 'strengths' ? [content] : [],
                                weaknesses: type === 'weaknesses' ? [content] : [],
                                opportunities: type === 'opportunities' ? [content] : [],
                                threats: type === 'threats' ? [content] : [],
                            }
                        }
                    };
                }

                // If recommendations exist but no SWOT part
                if (!current.swotAnalysis) {
                    return {
                        strategicRecommendations: {
                            ...current,
                            swotAnalysis: {
                                strengths: type === 'strengths' ? [content] : [],
                                weaknesses: type === 'weaknesses' ? [content] : [],
                                opportunities: type === 'opportunities' ? [content] : [],
                                threats: type === 'threats' ? [content] : [],
                            }
                        }
                    };
                }

                const currentList = current.swotAnalysis[type] || [];
                if (currentList.length >= 3) return state; // Constraint: Max 3

                return {
                    strategicRecommendations: {
                        ...current,
                        swotAnalysis: {
                            ...current.swotAnalysis,
                            [type]: [...currentList, content]
                        }
                    }
                };
            }),

            updateSwotItem: (type, index, content) => set((state) => {
                const current = state.strategicRecommendations;
                if (!current?.swotAnalysis) return state;

                const list = [...(current.swotAnalysis[type] || [])];
                if (index < 0 || index >= list.length) return state;

                list[index] = content;

                return {
                    strategicRecommendations: {
                        ...current,
                        swotAnalysis: {
                            ...current.swotAnalysis,
                            [type]: list
                        }
                    }
                };
            }),

            removeSwotItem: (type, index) => set((state) => {
                const current = state.strategicRecommendations;
                if (!current?.swotAnalysis) return state;

                const list = [...(current.swotAnalysis[type] || [])];
                if (index < 0 || index >= list.length) return state;

                list.splice(index, 1);

                return {
                    strategicRecommendations: {
                        ...current,
                        swotAnalysis: {
                            ...current.swotAnalysis,
                            [type]: list
                        }
                    }
                };
            }),


        }),
        {
            name: 'founder-os-store', // name of the item in the storage (must be unique)
            partialize: (state) => {
                const { finance, ...rest } = state;
                return rest;
            },
        }
    )
);
