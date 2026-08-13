'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, BrainCircuit, TrendingUp } from 'lucide-react';

interface CostStats {
  totalCalls: number;
  totalTokens: number;
  estimatedCost: number;
  byModel: Record<string, { calls: number; tokens: number; cost: number }>;
  byDay: Record<string, { calls: number; cost: number }>;
  topUsers: { userId: string; calls: number; cost: number }[];
}

/**
 * HD-104 · Dashboard interne coûts IA Helmdash
 *
 * Page admin réservée aux fondateurs — visualise les coûts IA.
 * Lit les données depuis memory_notes taggées 'token-usage'.
 */
export default function AICostsDashboard() {
  const [stats, setStats] = useState<CostStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ai/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'token-usage ai costs', limit: 200, threshold: 0.1 }),
      });
      if (res.ok) {
        const data = await res.json();
        // Agréger les résultats en stats
        const results = data.results || [];
        const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};
        let totalTokens = 0;
        let totalCost = 0;

        for (const r of results) {
          const entry = r.metadata || {};
          const model = entry.model || 'unknown';
          const tokens = entry.tokens || 0;
          const cost = entry.cost || 0;
          totalTokens += tokens;
          totalCost += cost;
          if (!byModel[model]) byModel[model] = { calls: 0, tokens: 0, cost: 0 };
          byModel[model].calls += 1;
          byModel[model].tokens += tokens;
          byModel[model].cost += cost;
        }

        setStats({
          totalCalls: results.length,
          totalTokens,
          estimatedCost: totalCost,
          byModel,
          byDay: {},
          topUsers: [],
        });
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-mono flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-emerald-500" />
          Coûts IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Dashboard interne — consommation et coûts des appels IA.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appels totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalCalls || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tokens estimés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats?.totalTokens || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Coût estimé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">
              ${(stats?.estimatedCost || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats?.byModel && Object.keys(stats.byModel).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="w-5 h-5" />
              Par modèle
            </CardTitle>
            <CardDescription>Répartition des coûts par modèle IA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.byModel)
                .sort(([, a], [, b]) => b.cost - a.cost)
                .map(([model, data]) => (
                  <div key={model} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                    <div>
                      <p className="text-sm font-medium font-mono">{model}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.calls} appels · {data.tokens.toLocaleString()} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${data.cost.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {((data.cost / (stats?.estimatedCost || 1)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}