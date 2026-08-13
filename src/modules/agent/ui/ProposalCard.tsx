'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, Loader2 } from 'lucide-react';

interface ProposalCardProps {
  proposalId: string;
  tabName: string;
  action: string;
  payload: any;
  onProcessed?: () => void;
}

/**
 * AGENTS.md Decision D4: Écriture agent = proposal.
 * Widget pour valider ou rejeter explicitement une mutation proposée par un agent.
 */
export function ProposalCard({ proposalId, tabName, action, payload, onProcessed }: ProposalCardProps) {
  const [status, setStatus] = useState<'pending' | 'loading' | 'accepted' | 'rejected'>('pending');

  const handleAction = async (userAction: 'accept' | 'reject') => {
    setStatus('loading');
    try {
      const res = await fetch('/api/ai/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, userAction }),
      });
      if (res.ok) {
        setStatus(userAction === 'accept' ? 'accepted' : 'rejected');
        onProcessed?.();
      } else {
        setStatus('pending');
      }
    } catch (e) {
      console.error('[ProposalCard] Error processing proposal:', e);
      setStatus('pending');
    }
  };

  if (status === 'accepted') {
    return (
      <Card className="my-2 border-green-500/20 bg-green-500/5">
        <CardContent className="p-3 text-sm flex items-center gap-2 text-green-500">
          <Check className="w-4 h-4" /> Action effectuée ({action} sur {tabName})
        </CardContent>
      </Card>
    );
  }

  if (status === 'rejected') {
    return (
      <Card className="my-2 border-muted/20 bg-muted/5">
        <CardContent className="p-3 text-sm flex items-center gap-2 text-muted-foreground">
          <X className="w-4 h-4" /> Action annulée
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Action requise : {action.toUpperCase()} sur {tabName}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground pb-2 overflow-x-auto">
        <pre className="text-xs bg-black/20 p-2 rounded-md font-mono">{JSON.stringify(payload, null, 2)}</pre>
      </CardContent>
      <CardFooter className="flex gap-2 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={() => handleAction('reject')} disabled={status === 'loading'}>
          <X className="w-4 h-4 mr-1" /> Rejeter
        </Button>
        <Button size="sm" onClick={() => handleAction('accept')} disabled={status === 'loading'}>
          {status === 'loading' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />} 
          Confirmer
        </Button>
      </CardFooter>
    </Card>
  );
}
