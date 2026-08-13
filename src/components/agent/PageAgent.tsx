'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProposalCard } from './ProposalCard';

function MessageContent({ content }: { content: string }) {
  const regex = /\[PROPOSAL:([a-zA-Z0-9-]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{content.substring(lastIndex, match.index)}</span>);
    }
    parts.push(<ProposalCard key={match[1]} proposalId={match[1]} />);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(<span key={lastIndex}>{content.substring(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PageAgentProps {
  userId: string;
  pageLabel: string;
  /** Contexte injecté avant la conversation (données de la page) */
  pageContext?: string;
}

/**
 * Agent conversationnel contextuel par page.
 * Mini-chat fixé en bas à droite, connecté au Barreur via /api/ai/chat/stream.
 * Le contexte de la page est injecté comme premier message système invisible.
 */
export function PageAgent({ userId, pageLabel, pageContext }: PageAgentProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    // Ajouter le contexte de page comme préfixe invisible
    const contextualMessage = pageContext
      ? `[Contexte ${pageLabel}]\nVoici les données actuelles de cet onglet :\n${pageContext}\n\nQuestion du fondateur : ${text}`
      : text;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          messages: [
            { role: 'user', content: contextualMessage },
          ],
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE format: "0:content\n"
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              fullResponse += line.slice(2).replace(/^"|"$/g, '');
            }
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse || 'Désolé, je n\'ai pas pu répondre.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion au Barreur. Réessaie.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton déclencheur */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center"
          title={`Parler au Barreur — ${pageLabel}`}
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* Panneau de chat */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-muted/30">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold font-mono truncate">Barreur · {pageLabel}</div>
              <div className="text-[10px] text-muted-foreground">connecté à tes données</div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-xs mt-8 px-4">
                <p>Pose une question sur <strong>{pageLabel}</strong>.</p>
                <p className="mt-1">Le Barreur lit tes données en temps réel.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed',
                  msg.role === 'user'
                    ? 'ml-auto bg-primary/10 text-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm w-full'
                )}
              >
                <MessageContent content={msg.content} />
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs pl-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Le Barreur réfléchit…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-2 px-3 py-2.5 border-t bg-muted/20"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Question sur ${pageLabel.toLowerCase()}…`}
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/60"
              disabled={loading}
            />
            <Button type="submit" size="icon" variant="ghost" className="h-7 w-7" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
