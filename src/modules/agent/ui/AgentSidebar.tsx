'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, Clock, ShieldCheck } from 'lucide-react';
import { AgentTaskHistory } from './AgentTaskHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Conversation {
  id: string;
  title: string | null;
  updatedAt: string;
}

export function AgentSidebar({ userId }: { userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCId = searchParams.get('c');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/chat/history')
      .then(res => res.json())
      .then(data => {
        if (data.conversations) {
          setConversations(data.conversations);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleNewChat = () => {
    router.push('/agent');
  };

  const handleSelectChat = (id: string) => {
    router.push(`/agent?c=${id}`);
  };

  return (
    <div className="flex flex-col h-full bg-card/40 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 pointer-events-none" />
      
      <div className="p-4 relative z-10 border-b border-white/5">
        <Button onClick={handleNewChat} className="w-full flex items-center gap-2" variant="default">
          <PlusCircle className="w-4 h-4" /> Nouvelle conversation
        </Button>
      </div>

      <Tabs defaultValue="chats" className="flex-1 flex flex-col min-h-0 relative z-10">
        <TabsList className="grid grid-cols-3 mx-4 my-2">
          <TabsTrigger value="chats" className="text-xs">Chats</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs">Tâches</TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs">Décisions</TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="flex-1 min-h-0 m-0 px-4 pb-4">
          <ScrollArea className="h-full pr-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center p-4">
                Aucune conversation.
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {conversations.map(conv => (
                  <div 
                    key={conv.id} 
                    onClick={() => handleSelectChat(conv.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-colors flex flex-col gap-1 ${
                      currentCId === conv.id 
                        ? 'bg-primary/10 border-primary/20 text-foreground' 
                        : 'bg-white/5 border-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium truncate">
                        {conv.title || 'Nouvelle conversation'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] opacity-70 ml-5">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 min-h-0 m-0 px-4 pb-4">
          <AgentTaskHistory userId={userId} />
        </TabsContent>

        <TabsContent value="decisions" className="flex-1 min-h-0 m-0 px-4 pb-4">
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-70 p-4 text-center">
            <ShieldCheck className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm">Le journal de décisions enregistre les choix stratégiques de l'agent.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
