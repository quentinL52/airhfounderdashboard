'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Radar, RefreshCw, Bell, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export function WatchWidget() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [newQuery, setNewQuery] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data/watch-settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('[WatchWidget] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newFields: any) => {
    try {
      const updated = {
        frequency: newFields.frequency ?? settings.frequency,
        scope: newFields.scope ?? settings.scope,
        remindersEnabled: newFields.remindersEnabled ?? settings.remindersEnabled,
      };
      const res = await fetch('/api/data/watch-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('[WatchWidget] Update error:', e);
    }
  };

  const handleRunScan = async () => {
    try {
      setScanning(true);
      const res = await fetch('/api/data/watch-scan', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setScanResult(result);
        await fetchSettings();
      }
    } catch (e) {
      console.error('[WatchWidget] Scan error:', e);
    } finally {
      setScanning(false);
    }
  };

  const handleAddCompetitor = () => {
    if (!newCompetitor.trim() || !settings) return;
    const currentScope = settings.scope || { competitors: [], queries: [] };
    const updatedScope = {
      ...currentScope,
      competitors: [...(currentScope.competitors || []), newCompetitor.trim()],
    };
    setNewCompetitor('');
    updateSettings({ scope: updatedScope });
  };

  const handleRemoveCompetitor = (index: number) => {
    if (!settings) return;
    const currentScope = settings.scope || { competitors: [], queries: [] };
    const updatedCompetitors = [...(currentScope.competitors || [])];
    updatedCompetitors.splice(index, 1);
    updateSettings({ scope: { ...currentScope, competitors: updatedCompetitors } });
  };

  const handleAddQuery = () => {
    if (!newQuery.trim() || !settings) return;
    const currentScope = settings.scope || { competitors: [], queries: [] };
    const updatedScope = {
      ...currentScope,
      queries: [...(currentScope.queries || []), newQuery.trim()],
    };
    setNewQuery('');
    updateSettings({ scope: updatedScope });
  };

  const handleRemoveQuery = (index: number) => {
    if (!settings) return;
    const currentScope = settings.scope || { competitors: [], queries: [] };
    const updatedQueries = [...(currentScope.queries || [])];
    updatedQueries.splice(index, 1);
    updateSettings({ scope: { ...currentScope, queries: updatedQueries } });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <Card className="h-full bg-card/80 backdrop-blur border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[10px] text-muted-foreground uppercase flex items-center gap-2">
            <Radar className="w-4 h-4 text-yellow-500" /> VEILLE CONCURREN TIELLE PROACTIVE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scope = settings?.scope || { competitors: [], queries: [] };
  const lastRunDate = settings?.lastRunAt
    ? new Date(settings.lastRunAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Aucun scan effectué';

  return (
    <Card className="h-full bg-card/80 backdrop-blur border-border overflow-hidden group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="font-pixel text-[10px] text-muted-foreground uppercase flex items-center gap-2">
            <Radar className="w-4 h-4 text-yellow-500" /> VEILLE CONCURRENTIELLE PROACTIVE
          </CardTitle>
          <CardDescription className="text-xs">
            Dernier scan : {lastRunDate}
          </CardDescription>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleRunScan}
          disabled={scanning}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scan en cours...' : 'Lancer un scan'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6 mt-2">
        {/* Fréquence & Rappels J+7 */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-muted/20 border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Fréquence :</span>
            <select
              value={settings?.frequency || 'manual'}
              onChange={(e) => updateSettings({ frequency: e.target.value })}
              className="bg-card border border-border text-xs rounded p-1"
            >
              <option value="manual">Manuelle</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="biweekly">Bi-mensuelle</option>
              <option value="monthly">Mensuelle</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">Rappels J+7 :</span>
            <Switch
              checked={settings?.remindersEnabled ?? true}
              onCheckedChange={(checked) => updateSettings({ remindersEnabled: checked })}
            />
          </div>
        </div>

        {/* Scan Results / Diff */}
        {scanResult && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-primary">
                <CheckCircle2 className="w-4 h-4" /> Scan Terminé
              </span>
              <span className="text-muted-foreground font-mono">
                {scanResult.diff?.newItems?.length || 0} nouveaux signaux
              </span>
            </div>

            {scanResult.diff?.newItems?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-pixel text-muted-foreground">Nouveautés détectées :</div>
                {scanResult.diff.newItems.map((item: any, idx: number) => (
                  <div key={idx} className="text-xs p-2 bg-card border border-border rounded flex justify-between items-center">
                    <span className="font-medium text-foreground">{item.title}</span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                        Voir
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Périmètre (Concurrents & Requêtes) */}
        <div className="space-y-4">
          {/* Concurrents */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase font-pixel">Concurrents suivis</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(scope.competitors || []).map((comp: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-xs py-1">
                  {comp}
                  <button onClick={() => handleRemoveCompetitor(idx)} className="hover:text-destructive">
                    <Trash2 className="w-3 h-3 ml-1" />
                  </button>
                </Badge>
              ))}
              {scope.competitors?.length === 0 && (
                <span className="text-xs text-muted-foreground italic">Aucun concurrent renseigné.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nom d'un concurrent..."
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                className="h-8 text-xs bg-card"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
              />
              <Button variant="outline" size="sm" onClick={handleAddCompetitor} className="h-8 px-2">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Mots-clés */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase font-pixel">Mots-clés / Requêtes de recherche</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(scope.queries || []).map((query: string, idx: number) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-1 text-xs py-1">
                  {query}
                  <button onClick={() => handleRemoveQuery(idx)} className="hover:text-destructive">
                    <Trash2 className="w-3 h-3 ml-1" />
                  </button>
                </Badge>
              ))}
              {scope.queries?.length === 0 && (
                <span className="text-xs text-muted-foreground italic">Aucun mot-clé renseigné.</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Mot-clé ou thème de veille..."
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                className="h-8 text-xs bg-card"
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuery()}
              />
              <Button variant="outline" size="sm" onClick={handleAddQuery} className="h-8 px-2">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
