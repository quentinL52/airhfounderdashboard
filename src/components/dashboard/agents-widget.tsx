'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useFounderStore } from "@/store/founder-store";
import { useGamificationStore } from "@/store/gamification-store";
import { Bot, Zap, PenTool, CheckCircle2, AlertCircle, Play, Loader2, Lock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgentResultPanel } from "./agent-result-panel";
import type { AgentId, AgentStatus } from "@/lib/ai/agent-orchestrator";

import type { FounderStore } from "@/store/founder-store";

interface AgentConfig {
  id: AgentId;
  name: string;
  emoji: string;
  description: string;
  icon: React.ElementType;
  locked: boolean;
  endpoint?: string;
  getContext?: (store: FounderStore) => any;
}

const AGENTS: AgentConfig[] = [
  {
    id: 'founder-coach',
    name: 'Founder Coach',
    emoji: '🎯',
    description: 'Analyse ta semaine et tes priorités',
    icon: Target,
    locked: false,
    endpoint: '/api/ai/agents/coach',
    getContext: (store) => ({
      hypotheses: { total: store.hypotheses.length, tested: store.hypotheses.filter(h => h.status !== 'draft').length, validated: store.hypotheses.filter(h => h.status === 'validated').length },
      finance: { cash: store.finance?.cashAvailable || 0, runway: 0, burnRate: 0 },
      streak: 0, // Should come from gamification store ideally
      okrProgress: 0,
      journalMoods: store.journalEntries.slice(0, 7).map(j => j.mood),
      canvasCompleteness: Object.values(store.leanCanvas).filter(v => v !== '').length / 9 * 100,
      contactsCount: store.contacts.length
    })
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    emoji: '✍️',
    description: 'Génère du contenu marketing',
    icon: PenTool,
    locked: false,
    endpoint: '/api/ai/agents/content',
    getContext: (store) => ({
      leanCanvas: store.leanCanvas,
      goToMarket: store.goToMarket,
      existingContent: []
    })
  },
  {
    id: 'relationship-manager',
    name: 'Relationship Mgr',
    emoji: '🤝',
    description: 'Analyse ton réseau et suggère des actions',
    icon: CheckCircle2,
    locked: false,
    endpoint: '/api/ai/agents/crm',
    getContext: (store) => ({
      contacts: store.contacts,
      projectPhase: 'MVP',
      goToMarket: store.goToMarket
    })
  },
  { id: 'canvas-optimizer', name: 'Canvas Optimizer', emoji: '📈', description: 'Optimise ton Business Model', icon: Lock, locked: true },
  { id: 'cfo-agent', name: 'CFO Agent', emoji: '💰', description: 'Analyse financière poussée', icon: Lock, locked: true },
  { id: 'research-scientist', name: 'Research Sci.', emoji: '🔬', description: 'Analyse de marché profonde', icon: Lock, locked: true },
  { id: 'launch-strategist', name: 'Launch Strategist', emoji: '🚀', description: 'Plan de lancement sur-mesure', icon: Lock, locked: true },
  { id: 'pmf-assessor', name: 'PMF Assessor', emoji: '🎯', description: 'Mesure ton Product-Market Fit', icon: Lock, locked: true },
];

export function AgentsWidget() {
  const store = useFounderStore();
  const { awardXP } = useGamificationStore();
  const { aiSettings } = store;
  
  const isConfigured = !!aiSettings.provider && aiSettings.configuredProviders?.includes(aiSettings.provider);
  
  const [runs, setRuns] = useState<Record<AgentId, { status: AgentStatus; result?: any; error?: string }>>({} as any);
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);

  const runAgent = async (agent: AgentConfig) => {
    if (!isConfigured || agent.locked || !agent.endpoint || !agent.getContext) return;

    setRuns(prev => ({ ...prev, [agent.id]: { status: 'running' } }));
    
    try {
      const response = await fetch(agent.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiSettings.provider,
          model: aiSettings.model || 'gpt-4o', // fallback
          // apiKey is handled by the server now
          context: agent.getContext(store),
          locale: 'fr'
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === 'failed') {
        throw new Error(data.error || 'Erreur inconnue');
      }

      setRuns(prev => ({ ...prev, [agent.id]: { status: 'success', result: data.data } }));
      setSelectedAgent(agent.id);
      awardXP('agent_used'); // Gamification reward
    } catch (error: any) {
      setRuns(prev => ({ ...prev, [agent.id]: { status: 'failed', error: error.message } }));
    }
  };

  const activeCount = AGENTS.filter(a => !a.locked).length;

  return (
    <Card className="flex flex-col h-full bg-card/50 backdrop-blur border-accent/20 shadow-[0_0_15px_rgba(var(--accent),0.05)] relative overflow-hidden group">
      <div className="absolute inset-0 bg-[url('/pixel-overlay.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
      
      <CardHeader className="pb-2 border-b border-border/50 relative z-10 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2 font-pixel tracking-wide text-accent-foreground">
          <Bot className="w-4 h-4" />
          AI CO-FOUNDERS
        </CardTitle>
        <Badge variant="outline" className="font-pixel text-[9px]">
          [{activeCount}/{AGENTS.length} ACTIFS]
        </Badge>
      </CardHeader>
      
      <CardContent className="pt-4 flex-1 flex flex-col gap-3 relative z-10 overflow-y-auto custom-scrollbar">
        
        {!isConfigured && (
          <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 p-2 rounded border border-warning/20 mb-2 font-pixel">
            <AlertCircle className="w-3 h-3" />
            CONFIGUREZ L'IA (PARAMÈTRES)
          </div>
        )}

        <div className="space-y-2">
          {AGENTS.map(agent => {
            const runState = runs[agent.id] || { status: 'idle' };
            const isRunning = runState.status === 'running';
            const isSuccess = runState.status === 'success';
            const isError = runState.status === 'failed';

            return (
              <div key={agent.id} className="flex flex-col gap-1">
                <div className={cn(
                  "flex items-center justify-between p-2.5 rounded-md border transition-all duration-300",
                  agent.locked ? "bg-background/20 border-border/20 opacity-50" : "bg-background/50 border-border/50 hover:border-accent/50",
                  isRunning && "border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)] bg-primary/5",
                  isSuccess && "border-success bg-success/5",
                  isError && "border-destructive bg-destructive/5",
                )}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={cn(
                      "text-lg shrink-0",
                      agent.locked && "grayscale opacity-50"
                    )}>
                      {agent.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-pixel tracking-wider flex items-center gap-2 truncate">
                        {agent.name}
                        {agent.locked && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        "{agent.description}"
                      </div>
                    </div>
                  </div>
                  
                  {!agent.locked && (
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant="outline" className={cn(
                        "text-[9px] font-pixel transition-colors hidden sm:inline-flex",
                        isRunning ? "bg-primary/20 text-primary border-primary animate-pulse" :
                        isSuccess ? "bg-success/20 text-success border-success" :
                        isError ? "bg-destructive/20 text-destructive border-destructive" :
                        "text-muted-foreground border-border"
                      )}>
                        {isRunning ? 'RUNNING...' : isSuccess ? 'DONE ✓' : isError ? 'ERREUR' : 'READY'}
                      </Badge>
                      <Button 
                        variant={isRunning ? "secondary" : isSuccess ? "outline" : "default"} 
                        size="icon" 
                        className={cn("h-7 w-7 rounded", isSuccess && "text-success border-success")} 
                        disabled={!isConfigured || isRunning}
                        onClick={() => runAgent(agent)}
                      >
                        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                         isSuccess ? <Zap className="w-3 h-3" /> : 
                         <Play className="w-3 h-3 ml-0.5" />}
                      </Button>
                    </div>
                  )}
                </div>

                {isError && (
                  <div className="text-[10px] text-destructive px-2 font-mono">
                    Erreur: {runState.error}
                  </div>
                )}
                
                {isSuccess && selectedAgent === agent.id && (
                  <AgentResultPanel 
                    agentId={agent.id} 
                    result={runState.result} 
                    isOpen={selectedAgent === agent.id} 
                    onClose={() => setSelectedAgent(null)} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

