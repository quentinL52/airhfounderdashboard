'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mood, useFounderStore } from '@/store/founder-store';
import { BookOpen, Save, Smile, Frown, Meh, Angry } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { detectDistress } from '@/services/journal.service';
import { AlertCircle, Lightbulb } from 'lucide-react';

interface JournalEditorProps {
    onSave: (entry: {
        date: string;
        content: string;
        mood: Mood;
        tags: string[];
        blockers?: string;
    }) => void;
    initialDate?: Date;
}

export function JournalEditor({ onSave, initialDate = new Date() }: JournalEditorProps) {
    const language = useFounderStore(s => s.language);
    const t = (translations[language] as any).journal || {};
    const [date, setDate] = useState<Date>(initialDate || new Date());
    const [content, setContent] = useState('');
    const [mood, setMood] = useState<Mood>('neutral');
    const [tags, setTags] = useState('');
    const [blockers, setBlockers] = useState('');

    const distressCheck = detectDistress(content + ' ' + blockers);

    const locale = language === 'fr' ? fr : enUS;

    const moodOptions: { value: Mood; label: string; icon: React.ReactNode; color: string }[] = [
        { value: 'great', label: t.moods?.great || 'Great', icon: <Smile className="w-5 h-5" />, color: 'text-green-500' },
        { value: 'good', label: t.moods?.good || 'Good', icon: <Smile className="w-5 h-5" />, color: 'text-emerald-400' },
        { value: 'neutral', label: t.moods?.neutral || 'Neutral', icon: <Meh className="w-5 h-5" />, color: 'text-yellow-500' },
        { value: 'bad', label: t.moods?.bad || 'Bad', icon: <Frown className="w-5 h-5" />, color: 'text-orange-500' },
        { value: 'terrible', label: t.moods?.terrible || 'Terrible', icon: <Angry className="w-5 h-5" />, color: 'text-red-500' },
    ];

    const handleSave = () => {
        if (!date || !content.trim()) return;

        onSave({
            date: date.toISOString(),
            content,
            mood,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            blockers: blockers.trim() || undefined,
        });

        setContent('');
        setMood('neutral');
        setTags('');
        setBlockers('');
    };

    return (
        <div className="space-y-6 p-6 border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span className="bg-primary/10 p-2 rounded-lg text-primary">
                        <BookOpen className="w-4 h-4" />
                    </span>
                    {t.newEntry || 'Nouvelle entrée'}
                </h2>

                <input
                    type="date"
                    value={format(date, 'yyyy-MM-dd')}
                    onChange={(e) => {
                        const d = new Date(e.target.value + 'T12:00:00');
                        if (!isNaN(d.getTime())) setDate(d);
                    }}
                    style={{
                        colorScheme: 'dark',
                        background: 'transparent',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: 'hsl(var(--foreground))',
                        fontSize: '14px',
                        cursor: 'pointer',
                    }}
                />
            </div>

            {/* Prompt du jour contextuel */}
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2.5 text-xs text-primary">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold">Prompt du jour :</span> Qu'avez-vous appris ou franchi de marquant aujourd'hui pour faire progresser votre produit ?
                </div>
            </div>

            {/* Garde-fou Détresse (Message statique d'orientation sans coaching génératif) */}
            {distressCheck.isDistress && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-sm text-red-400 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <div className="font-bold">Besoin d'écoute ou d'accompagnement ?</div>
                        <div className="text-xs whitespace-pre-line leading-relaxed">{distressCheck.message}</div>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                {/* Mood Selector */}
                <div className="space-y-2">
                    <Label>{t.feelingToday || 'Comment vous sentez-vous aujourd\'hui ?'}</Label>
                    <div className="flex gap-2 flex-wrap">
                        {moodOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setMood(option.value)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                                    mood === option.value
                                        ? `border-primary bg-primary/10 ring-2 ring-primary/20 ${option.color}`
                                        : "border-border hover:bg-muted/50 opacity-70 hover:opacity-100"
                                )}
                            >
                                {option.icon}
                                <span className="text-sm font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <Label>{t.journalEntry || 'Entrée du journal'}</Label>
                    <Textarea
                        placeholder={t.placeholder || "Que s'est-il passé aujourd'hui ? Des victoires ? Des difficultés ?"}
                        className="min-h-[150px] resize-y bg-background/50 focus:bg-background transition-colors"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                {/* Blockers */}
                <div className="space-y-2">
                    <Label className="text-destructive/90">{t.blockers || 'Blocages / Frustrations (Optionnel)'}</Label>
                    <Input
                        placeholder={t.blockersPlaceholder || "Qu'est-ce qui vous empêche d'avancer ?"}
                        value={blockers}
                        onChange={(e) => setBlockers(e.target.value)}
                        className="border-destructive/20 focus:border-destructive/50"
                    />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <Label>{t.tags || 'Tags (séparés par des virgules)'}</Label>
                    <Input
                        placeholder={t.tagsPlaceholder || "produit, ventes, levée de fonds..."}
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} size="lg" className="gap-2">
                    <Save className="w-4 h-4" />
                    {t.saveEntry || 'Enregistrer'}
                </Button>
            </div>
        </div>
    );
}
