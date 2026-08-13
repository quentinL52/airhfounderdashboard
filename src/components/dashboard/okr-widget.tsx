'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OkrWidget() {
  const [objectives, setObjectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOkrs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/data/objectives');
      if (res.ok) {
        const data = await res.json();
        setObjectives(data.objectives || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const refreshKrs = async () => {
    try {
      await fetch('/api/data/key-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' })
      });
      await fetchOkrs();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOkrs();
  }, []);

  if (loading) {
    return (
      <Card className="h-full bg-card/80 backdrop-blur border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="font-pixel text-[10px] text-muted-foreground uppercase flex items-center gap-2">
            <Target className="w-4 h-4" /> OBJECTIFS ET RÉSULTATS CLÉS (OKR)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeObjectives = objectives.filter(o => o.status === 'active');

  return (
    <Card className="h-full bg-card/80 backdrop-blur border-border overflow-hidden group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="font-pixel text-[10px] text-muted-foreground uppercase flex items-center gap-2">
            <Target className="w-4 h-4" /> OKR
          </CardTitle>
          <CardDescription className="text-xs">
            Objectifs en cours
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={refreshKrs} title="Rafraîchir les valeurs">
          <TrendingUp className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
        </Button>
      </CardHeader>
      <CardContent>
        {activeObjectives.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-md border border-dashed border-border text-center">
            Aucun OKR actif. Demandez au Barreur de vous aider à en définir.
          </div>
        ) : (
          <div className="space-y-6">
            {activeObjectives.map((obj) => (
              <div key={obj.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-primary text-sm">{obj.title} <span className="text-muted-foreground text-xs font-normal">({obj.period})</span></h4>
                </div>
                
                <div className="space-y-2">
                  {obj.keyResults?.map((kr: any) => {
                    const progress = kr.target > 0 ? Math.min(100, (kr.current / kr.target) * 100) : 0;
                    return (
                      <div key={kr.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{kr.title}</span>
                          <span className="font-mono text-[10px]">{kr.current} / {kr.target} {kr.unit || ''}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
