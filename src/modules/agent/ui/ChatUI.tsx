'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, User, Loader2, Copy, Square, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProposalCard } from './ProposalCard';
import { cn } from '@/lib/utils';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';

function CaptureChip({ kind, payload }: { kind: string; payload: any }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const tabName = kind === 'contact' ? 'crm' 
                : kind === 'expense' ? 'finances'
                : kind === 'task' ? 'roadmap'
                : kind === 'hypothesis' ? 'hypotheses'
                : kind === 'decision' ? 'decisions'
                : 'inbox';

  const handleCapture = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/ai/proposals/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabName, payload }),
      });
      if (res.ok) setStatus('success');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  };

  const label = kind === 'contact' ? `Contact: ${payload.name || 'Nouveau'}`
              : kind === 'expense' ? `Dépense: ${payload.label || 'Nouvelle'}`
              : kind === 'task' ? `Tâche: ${payload.title || 'Nouvelle'}`
              : kind === 'hypothesis' ? `Hypothèse`
              : kind === 'decision' ? `Décision: ${payload.title || ''}`
              : `Note`;

  if (status === 'success') {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20 my-1 cursor-default">
        <Check className="w-3.5 h-3.5" />
        Capturé avec succès
      </div>
    );
  }

  return (
    <button
      onClick={handleCapture}
      disabled={status === 'loading'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors border border-primary/20 my-1 group disabled:opacity-50"
    >
      {status === 'loading' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
      Capturer {label}
    </button>
  );
}

export function ChatUI({ initialConversationId }: { initialConversationId?: string }) {
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState('');

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/ai/chat/stream',
    body: {
      conversationId,
    },
  }), [conversationId]);

  const { messages, status, setMessages, sendMessage, stop } = useChat({
    transport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    if (initialConversationId) {
      fetch(`/api/ai/chat/history?conversationId=${initialConversationId}`)
        .then(res => res.json())
        .then(data => {
          if (data.conversation?.messages) {
            setMessages(data.conversation.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              parts: [{ type: 'text', text: m.content }]
            })));
          }
        })
        .catch(console.error);
    }
  }, [initialConversationId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    sendMessage({ role: 'user', parts: [{ type: 'text', text: localInput }] });
    setLocalInput('');
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessageContent = (m: any) => {
    const textContent = m.parts?.map((p: any) => (p.type === 'text' ? p.text : '')).join('') || '';
    
    return (
      <div className="flex flex-col gap-3 relative group">
        {textContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown>{textContent}</ReactMarkdown>
          </div>
        )}
        
        {m.role === 'assistant' && textContent && (
          <button 
            onClick={() => handleCopy(m.id, textContent)}
            className="absolute -top-2 -right-2 p-1.5 rounded-md bg-black/40 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
          >
            {copiedId === m.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Render Proposals from toolInvocations */}
        {m.toolInvocations?.map((toolInv: any) => {
          if (toolInv.toolName === 'write_dashboard_tab' && toolInv.state === 'result') {
            const result = toolInv.result;
            if (result && result.proposalId) {
              return (
                <ProposalCard
                  key={toolInv.toolCallId}
                  proposalId={result.proposalId}
                  tabName={toolInv.args.tabName}
                  action={toolInv.args.action}
                  payload={toolInv.args.data}
                />
              );
            }
          }
          if (toolInv.toolName === 'suggest_capture' && toolInv.state === 'result') {
            return (
              <CaptureChip 
                key={toolInv.toolCallId} 
                kind={toolInv.args.kind} 
                payload={toolInv.args.payload} 
              />
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-colors">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-70">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">Bonjour, je suis le Barreur.</p>
            <p className="text-sm">Comment puis-je vous aider aujourd'hui ?</p>
          </div>
        )}
        
        {messages.map(m => (
          <div key={m.id} className={cn("flex gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm", m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white/5 border border-white/10")}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn("max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-[15px] leading-relaxed relative", m.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white/5 border border-white/10 text-foreground")}>
              {renderMessageContent(m)}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 flex-row">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div className="max-w-[85%] rounded-2xl px-5 py-3.5 bg-white/5 border border-white/10 text-foreground flex items-center gap-3 shadow-sm text-[15px]">
              <Loader2 className="w-4 h-4 animate-spin text-primary" /> Le Barreur réfléchit...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      
      <div className="p-4 bg-background/40 backdrop-blur-md border-t border-white/10 relative z-20">
        <form onSubmit={handleFormSubmit} className="flex gap-3 relative max-w-4xl mx-auto">
          <input
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Posez votre question ou décrivez une tâche..."
            className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-[15px] focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-inner placeholder:text-muted-foreground/70"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button 
              type="button" 
              onClick={() => stop()}
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-all shadow-md" 
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md" 
              disabled={!localInput.trim()}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
