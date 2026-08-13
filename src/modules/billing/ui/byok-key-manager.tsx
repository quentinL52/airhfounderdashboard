'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Key, Save, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useFounderStore } from '@/store/founder-store';
import type { ProviderName, AIModel } from '@/lib/ai/provider-interface';

interface BYOKKeyManagerProps {
  onSaved?: () => void;
}

export function BYOKKeyManager({ onSaved }: BYOKKeyManagerProps) {
  const store = useFounderStore();
  const { aiSettings, setAiSettings } = store;

  const [provider, setProvider] = useState<ProviderName>(aiSettings.provider || 'openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>(aiSettings.model || '');
  const [showKey, setShowKey] = useState(false);
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const PROVIDERS: { id: ProviderName; name: string }[] = [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'gemini', name: 'Google Gemini' },
    { id: 'mistral', name: 'Mistral AI' },
  ];

  useEffect(() => {
    const fetchConfiguredProviders = async () => {
      try {
        const res = await fetch('/api/settings/ai-keys');
        if (res.ok) {
          const data = await res.json();
          setConfiguredProviders(data.configuredProviders || []);
        }
      } catch (err) {
        console.error('Failed to fetch configured providers', err);
      }
    };
    fetchConfiguredProviders();
  }, []);

  useEffect(() => {
    setApiKey('');
    setModel(aiSettings.provider === provider ? aiSettings.model || '' : '');
    setAvailableModels([]);
    setError('');
    setSuccess('');
  }, [provider, aiSettings]);

  const fetchModels = async (currentKey?: string) => {
    const isConfigured = configuredProviders.includes(provider);
    if (!currentKey && !isConfigured) return;

    setIsLoadingModels(true);
    setError('');

    try {
      const headers: Record<string, string> = {};
      if (currentKey) {
        headers['x-api-key'] = currentKey;
      }

      const res = await fetch(`/api/ai/models?provider=${provider}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur de connexion au fournisseur');
      }

      const uniqueModels = Array.from(new Map((data.models || []).map((m: any) => [m.id, m])).values());
      setAvailableModels(uniqueModels as AIModel[]);

      if (!model && uniqueModels && uniqueModels.length > 0) {
        setModel((uniqueModels[0] as AIModel).id);
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les modèles');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = async () => {
    const isConfigured = configuredProviders.includes(provider);

    if (!apiKey && !isConfigured) {
      setError('Veuillez entrer une clé API');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const providerName = provider as ProviderName;

      if (apiKey) {
        const res = await fetch('/api/settings/ai-keys', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: providerName, apiKey }),
        });

        if (!res.ok) {
          throw new Error('Erreur lors de la sauvegarde de la clé sur le serveur');
        }

        if (!isConfigured) {
          setConfiguredProviders((prev) => [...prev, providerName]);
        }
      }

      setAiSettings({
        provider: providerName,
        model,
        modelsConfig: aiSettings.modelsConfig || {},
      });

      setSuccess('Clé et modèle sauvegardés avec succès (BYOK)!');
      setApiKey('');
      if (onSaved) onSaved();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const isCurrentProviderConfigured = configuredProviders.includes(provider);

  return (
    <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-md">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base font-bold">BYOK Key Manager</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Gérez vos propres clés d'API (Bring Your Own Key) pour le plan Core.
              </CardDescription>
            </div>
          </div>
          {isCurrentProviderConfigured && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {provider.toUpperCase()} Configuré
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <Tabs value={provider} onValueChange={(v) => setProvider(v as ProviderName)}>
          <TabsList className="grid grid-cols-4 w-full bg-background/50 border border-border/50">
            {PROVIDERS.map((p) => (
              <TabsTrigger
                key={p.id}
                value={p.id}
                className="text-xs font-mono data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                {p.name}
                {configuredProviders.includes(p.id) && (
                  <CheckCircle2 className="w-3 h-3 ml-1 text-emerald-400 inline" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="byokApiKey" className="text-xs font-medium flex items-center justify-between">
                <span>Clé API {provider.toUpperCase()}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Stockage chiffré serveur
                </span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="byokApiKey"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      isCurrentProviderConfigured
                        ? '(Clé déjà configurée. Entrez-en une nouvelle pour remplacer)'
                        : `sk-...`
                    }
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchModels(apiKey)}
                  disabled={(!apiKey && !isCurrentProviderConfigured) || isLoadingModels}
                  className="text-xs font-mono shrink-0"
                >
                  {isLoadingModels ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vérifier'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Modèle Principal</Label>
              <Select value={model} onValueChange={setModel} disabled={availableModels.length === 0 && !isCurrentProviderConfigured}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue
                    placeholder={
                      isLoadingModels
                        ? 'Chargement...'
                        : availableModels.length === 0 && !isCurrentProviderConfigured
                        ? 'Vérifiez la clé pour voir les modèles'
                        : 'Sélectionner un modèle'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m, idx) => (
                    <SelectItem key={`${m.id}-${idx}`} value={m.id} className="font-mono text-xs">
                      {m.name || m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || (!apiKey && !isCurrentProviderConfigured)}
                size="sm"
                className="font-mono text-xs flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Sauvegarder BYOK
              </Button>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
