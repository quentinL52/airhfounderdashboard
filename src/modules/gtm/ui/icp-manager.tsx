'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Compass, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ICPProfile, validateICPProfile, createDefaultICPProfile } from '../domain/icp';

interface ICPManagerProps {
  initialProfile?: Partial<ICPProfile>;
  onSave?: (profile: ICPProfile) => void;
}

export function ICPManager({ initialProfile, onSave }: ICPManagerProps) {
  const tGtm = useTranslations('gtm');
  const [profile, setProfile] = useState<ICPProfile>(() => createDefaultICPProfile(initialProfile));
  const validation = validateICPProfile(profile);

  const handleFieldChange = (field: keyof ICPProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value, updatedAt: new Date().toISOString() }));
  };

  const handleListChange = (field: 'painPoints' | 'keyBenefits' | 'alternativeSolutions' | 'decisionCriteria', rawText: string) => {
    const items = rawText.split('\n').filter(line => line.trim().length > 0);
    setProfile(prev => ({ ...prev, [field]: items, updatedAt: new Date().toISOString() }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(profile);
    }
  };

  return (
    <Card className="border-t-4 border-t-primary shadow-sm bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-pixel text-primary">
            <Compass className="w-5 h-5" />
            {tGtm('icp.title')}
          </CardTitle>
          <Badge variant={validation.isValid ? 'default' : 'secondary'} className="font-mono text-xs">
            {tGtm('icp.completeness')}: {validation.score}%
          </Badge>
        </div>
        <CardDescription>
          {tGtm('icp.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{tGtm('icp.nameLabel')}</Label>
            <Input
              value={profile.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g. Solo Founders & Indie Hackers"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{tGtm('icp.buyerRoleLabel')}</Label>
            <Input
              value={profile.buyerRole || ''}
              onChange={(e) => handleFieldChange('buyerRole', e.target.value)}
              placeholder="e.g. Founder / CEO / Lead Engineer"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">{tGtm('icp.targetAudienceLabel')}</Label>
          <Input
            value={profile.targetAudience}
            onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
            placeholder="e.g. Early-stage B2B SaaS solo founders seeking streamlined execution"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{tGtm('icp.painPointsLabel')}</Label>
            <Textarea
              rows={4}
              value={profile.painPoints.join('\n')}
              onChange={(e) => handleListChange('painPoints', e.target.value)}
              placeholder={"Context switching between tools\nLack of clear priority focus\nUnclear GTM roadmap"}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{tGtm('icp.benefitsLabel')}</Label>
            <Textarea
              rows={4}
              value={profile.keyBenefits.join('\n')}
              onChange={(e) => handleListChange('keyBenefits', e.target.value)}
              placeholder={"All-in-one founder dashboard\nStep-by-step GTM roadmap\nAutomated lead scoring"}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">{tGtm('icp.alternativesLabel')}</Label>
          <Textarea
            rows={3}
            value={profile.alternativeSolutions.join('\n')}
            onChange={(e) => handleListChange('alternativeSolutions', e.target.value)}
            placeholder={"Excel / Google Sheets\nGeneric Notion templates\nMultiple single-purpose SaaS apps"}
          />
        </div>

        {validation.suggestions.length > 0 && (
          <div className="p-3 bg-muted/40 border border-muted rounded-md text-xs space-y-1">
            <div className="font-medium text-amber-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {tGtm('icp.suggestionsTitle')}:
            </div>
            {validation.suggestions.map((s, idx) => (
              <div key={idx} className="text-muted-foreground pl-5">• {s}</div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} className="flex items-center gap-2 font-pixel text-xs">
            <Sparkles className="w-4 h-4" /> {tGtm('icp.saveButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
