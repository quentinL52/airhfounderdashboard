'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';

export function ProposalCard({ proposalId }: { proposalId: string }) {
  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/ai/proposals/${proposalId}`)
      .then(res => res.json())
      .then(data => {
        setProposal(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [proposalId]);

  if (loading) return <div className="p-3 border rounded-md text-xs flex items-center gap-2 mt-2"><Loader2 className="w-3 h-3 animate-spin"/> Chargement de la proposition...</div>;
  if (!proposal || proposal.error) return null;

  const handleAction = async (action: 'confirm' | 'reject') => {
    setActionLoading(true);
    await fetch(`/api/ai/proposals/${proposalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setProposal({ ...proposal, status: action === 'confirm' ? 'confirmed' : 'rejected' });
    setActionLoading(false);
  };

  const statusColors = {
    pending: 'bg-primary/5 border-primary/20',
    confirmed: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
    rejected: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
  };

  return (
    <div className={`mt-2 p-3 border rounded-md text-xs ${statusColors[proposal.status as keyof typeof statusColors]}`}>
      <div className="font-semibold mb-2 uppercase tracking-wide opacity-80 flex items-center justify-between">
        <span>{proposal.action} · {proposal.domain}</span>
      </div>
      <pre className="text-[10px] bg-background/50 p-2 rounded overflow-x-auto mb-3 border border-border/50 max-h-32">
        {JSON.stringify(proposal.payload, null, 2)}
      </pre>
      {proposal.status === 'pending' && (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={actionLoading} onClick={() => handleAction('reject')}>
            <X className="w-3 h-3 mr-1"/> Rejeter
          </Button>
          <Button size="sm" className="h-7 text-[10px]" disabled={actionLoading} onClick={() => handleAction('confirm')}>
            {actionLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin"/> : <Check className="w-3 h-3 mr-1"/>}
            Confirmer
          </Button>
        </div>
      )}
      {proposal.status !== 'pending' && (
        <div className="font-medium flex items-center gap-1.5 opacity-90">
          {proposal.status === 'confirmed' ? <><Check className="w-3 h-3"/> Confirmé et appliqué</> : <><X className="w-3 h-3"/> Rejeté</>}
        </div>
      )}
    </div>
  );
}
