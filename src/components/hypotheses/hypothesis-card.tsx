'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useFounderStore } from '@/store/founder-store';
import { GrowthHypothesis as Hypothesis, HypothesisStatus } from '@/modules/gtm';
import { formatDistanceToNow } from 'date-fns';
import { translations } from '@/lib/translations';

interface HypothesisCardProps {
    hypothesis: Hypothesis;
    onEdit: (hypothesis: Hypothesis) => void;
    color: string;
}

const COLORS = {
    surface: "#181a24",
    border: "#282c3a",
    text: "#e8e9ed",
    textMuted: "#8b8fa3",
    textDim: "#5c6078",
    danger: "#ff6b6b",
    warning: "#fdcb6e",
    teal: "#00b894",
    green: "#00cec9"
};

export const HypothesisCard = memo(function HypothesisCard({ hypothesis, onEdit, color }: HypothesisCardProps) {
    const deleteHypothesis = useFounderStore(s => s.deleteHypothesis);
    const updateHypothesis = useFounderStore(s => s.updateHypothesis);
    const language = useFounderStore(s => s.language);
    const t = translations[language].hypotheses;
    const common = translations[language].common;

    const riskColor = {
        low: COLORS.teal,
        medium: COLORS.warning,
        high: '#ff9f43',
        critical: COLORS.danger,
    }[hypothesis.riskLevel];

    const statusOptions: { value: HypothesisStatus; label: string }[] = [
        { value: 'draft', label: t.columns.draft },
        { value: 'testing', label: t.columns.testing },
        { value: 'validated', label: t.columns.validated },
        { value: 'invalidated', label: t.columns.invalidated },
        { value: 'pivoted', label: t.columns.pivoted },
    ];

    return (
        <Card
            className="group mb-2 hover:border-opacity-100 transition-all duration-200"
            style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
            }}
        >
            <CardContent className="p-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1">
                        <p className="text-[13px] font-semibold tracking-tight text-foreground line-clamp-3 leading-snug">
                            {hypothesis.statement}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-6 w-6 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem onSelect={(e) => {
                                e.preventDefault();
                                onEdit(hypothesis);
                            }} className="text-xs">
                                <Edit className="mr-2 h-3 w-3" />
                                {common.edit}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="text-red-500 focus:text-red-500 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteHypothesis(hypothesis.id);
                                }}
                            >
                                <Trash2 className="mr-2 h-3 w-3" />
                                {common.delete}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {hypothesis.testMethod && (
                    <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2 leading-relaxed opacity-80">
                        {hypothesis.testMethod}
                    </p>
                )}

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-5 font-medium border-0"
                            style={{
                                color: riskColor,
                                backgroundColor: `${riskColor}15`,
                            }}
                        >
                            {t.risks[hypothesis.riskLevel]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                            {formatDistanceToNow(new Date(hypothesis.updatedAt), { addSuffix: true })}
                        </span>
                    </div>

                    <Select
                        value={hypothesis.status}
                        onValueChange={(value) => updateHypothesis(hypothesis.id, { status: value as HypothesisStatus })}
                    >
                        <SelectTrigger
                            className="h-6 text-[10px] w-auto border-0 bg-transparent focus:ring-0 p-0 gap-1 text-muted-foreground hover:text-foreground"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
});
