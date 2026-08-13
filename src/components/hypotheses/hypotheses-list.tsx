'use client';

import { useState } from 'react';
import { useFounderStore } from '@/store/founder-store';
import { GrowthHypothesis as Hypothesis, HypothesisStatus } from '@/modules/gtm';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HypothesisDialog } from './create-hypothesis-dialog';
import { Edit, Trash2, RotateCcw } from 'lucide-react';
import { translations } from '@/lib/translations';

const PHASE_COLORS: Record<string, string> = {
    draft: "bg-slate-500/10 text-slate-500",
    build: "bg-blue-500/10 text-blue-500",
    measure: "bg-yellow-500/10 text-yellow-500",
    learn: "bg-teal-500/10 text-teal-500",
    validated: "bg-emerald-500/10 text-emerald-500",
    invalidated: "bg-red-500/10 text-red-500",
    pivoted: "bg-purple-500/10 text-purple-500",
};

const RISK_COLORS: Record<string, string> = {
    critical: "text-red-500",
    high: "text-orange-500",
    medium: "text-yellow-500",
    low: "text-emerald-500",
};

function getPhase(h: Hypothesis): string {
    if (h.status === 'draft') return 'draft';
    if (h.status === 'validated') return 'validated';
    if (h.status === 'invalidated') return 'invalidated';
    if (h.status === 'pivoted') return 'pivoted';
    // testing status - determine BML phase
    if (h.actualResult === 'learning') return 'learn';
    if (h.actualResult === 'measuring') return 'measure';
    return 'build';
}

function getPhaseLabel(phase: string, language: 'fr' | 'en'): string {
    const t = translations[language].hypotheses;
    const labels: Record<string, string> = {
        draft: t.columns.draft,
        build: 'Build',
        measure: 'Measure',
        learn: 'Learn',
        validated: t.columns.validated,
        invalidated: t.columns.invalidated,
        pivoted: t.columns.pivoted,
    };
    return labels[phase] || phase;
}

export function HypothesesList() {
    const hypotheses = useFounderStore(s => s.hypotheses);
    const deleteHypothesis = useFounderStore(s => s.deleteHypothesis);
    const language = useFounderStore(s => s.language);
    const t = translations[language].hypotheses.list;
    const tBml = translations[language].hypotheses.bml;
    const [editingHypothesis, setEditingHypothesis] = useState<Hypothesis | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleEdit = (hypothesis: Hypothesis) => {
        setEditingHypothesis(hypothesis);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this hypothesis?')) {
            deleteHypothesis(id);
        }
    };

    const handleDialogOpenChange = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setTimeout(() => setEditingHypothesis(null), 300);
        }
    };

    return (
        <div className="rounded-md border border-border bg-card overflow-hidden">
            <Table>
                <TableHeader className="bg-muted">
                    <TableRow className="border-b border-border hover:bg-muted">
                        <TableHead className="w-[100px] text-muted-foreground">Phase</TableHead>
                        <TableHead className="text-muted-foreground">{t.statement}</TableHead>
                        <TableHead className="w-[120px] text-muted-foreground">{t.category}</TableHead>
                        <TableHead className="w-[100px] text-muted-foreground">{t.risk}</TableHead>
                        <TableHead className="text-muted-foreground hidden md:table-cell">{t.method}</TableHead>
                        <TableHead className="text-muted-foreground hidden lg:table-cell">Measure</TableHead>
                        <TableHead className="text-muted-foreground hidden lg:table-cell">Learn</TableHead>
                        <TableHead className="text-right text-muted-foreground">{t.actions}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {hypotheses.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                {t.empty}
                            </TableCell>
                        </TableRow>
                    ) : (
                        hypotheses.map((hypothesis) => {
                            const phase = getPhase(hypothesis);
                            return (
                                <TableRow key={hypothesis.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className={`border-0 capitalize text-[10px] ${PHASE_COLORS[phase]}`}>
                                                {getPhaseLabel(phase, language)}
                                            </Badge>
                                            {hypothesis.pivotedFromId && (
                                                <RotateCcw className="w-3 h-3 text-purple-400" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">
                                        {hypothesis.statement}
                                    </TableCell>
                                    <TableCell className="capitalize text-muted-foreground">
                                        {hypothesis.category}
                                    </TableCell>
                                    <TableCell className={`capitalize font-medium ${RISK_COLORS[hypothesis.riskLevel]}`}>
                                        {hypothesis.riskLevel}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden md:table-cell">
                                        {hypothesis.testMethod || '—'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden lg:table-cell max-w-[200px]">
                                        <span className="text-[11px] line-clamp-2">{hypothesis.measureNotes || '—'}</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground hidden lg:table-cell max-w-[200px]">
                                        <span className="text-[11px] line-clamp-2">{hypothesis.learnings || '—'}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(hypothesis)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(hypothesis.id)}
                                                className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-muted"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            <HypothesisDialog
                key={editingHypothesis?.id || 'edit'}
                open={isDialogOpen}
                onOpenChange={handleDialogOpenChange}
                hypothesisToEdit={editingHypothesis}
            />
        </div>
    );
}
