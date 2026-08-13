'use client';

import React from 'react';
import { GrowthHypothesis, calculateICEScore } from '../domain/growth-hypothesis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Beaker, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface GrowthHypothesesBoardProps {
  hypotheses: GrowthHypothesis[];
  onStatusChange?: (id: string, newStatus: GrowthHypothesis['status']) => void;
  onSelectHypothesis?: (hypothesis: GrowthHypothesis) => void;
}

export function GrowthHypothesesBoard({ hypotheses, onStatusChange, onSelectHypothesis }: GrowthHypothesesBoardProps) {
  const columns: { key: GrowthHypothesis['status']; label: string; color: string }[] = [
    { key: 'draft', label: 'Draft', color: 'border-slate-500' },
    { key: 'testing', label: 'Testing', color: 'border-blue-500' },
    { key: 'validated', label: 'Validated', color: 'border-emerald-500' },
    { key: 'invalidated', label: 'Invalidated', color: 'border-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((col) => {
        const items = (hypotheses || []).filter((h) => h.status === col.key);

        return (
          <div key={col.key} className="space-y-3 bg-muted/20 p-3 rounded-lg border border-border">
            <div className={`flex items-center justify-between border-b pb-2 ${col.color}`}>
              <span className="font-pixel text-xs font-semibold uppercase">{col.label}</span>
              <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
            </div>

            <div className="space-y-2 min-h-[200px]">
              {items.length === 0 ? (
                <div className="text-[11px] text-muted-foreground italic p-4 text-center">No items</div>
              ) : (
                items.map((hyp) => {
                  const ice = calculateICEScore(hyp.impactScore, hyp.confidenceScore, hyp.easeScore);

                  return (
                    <Card
                      key={hyp.id}
                      className="p-3 cursor-pointer hover:border-primary/50 transition-colors bg-card"
                      onClick={() => onSelectHypothesis && onSelectHypothesis(hyp)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {hyp.category}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px] font-mono">
                          ICE: {ice.iceScore}
                        </Badge>
                      </div>
                      <p className="text-xs font-medium mt-2 line-clamp-2">{hyp.statement}</p>
                      <div className="mt-2 text-[10px] text-muted-foreground truncate">
                        Test: {hyp.testMethod}
                      </div>

                      {onStatusChange && col.key === 'testing' && (
                        <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-emerald-400 hover:text-emerald-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(hyp.id, 'validated');
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Validate
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-red-400 hover:text-red-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusChange(hyp.id, 'invalidated');
                            }}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Invalidate
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
