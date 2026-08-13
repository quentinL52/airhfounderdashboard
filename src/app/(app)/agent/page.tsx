import { AgentSidebar, ChatUI } from '@/modules/agent';
import { AiUsageGauge } from '@/components/dashboard/ai-usage-gauge';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Barreur — Helmdash',
  description: "L'agent central de Helmdash. Apprend, challenge, motive, orchestre.",
};

export default async function AgentPage(props: {
  searchParams: Promise<{ c?: string }>;
}) {
  const searchParams = await props.searchParams;
  const cId = searchParams.c;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the conversation if cId is specified, otherwise latest
  let recentConv = null;
  if (cId) {
    recentConv = await prisma.conversation.findUnique({
      where: { id: cId, userId: user.id },
      select: { id: true }
    });
  } else {
    recentConv = await prisma.conversation.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true }
    });
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-8 bg-muted/20 h-full">
      <div className="w-full max-w-7xl mx-auto flex flex-col h-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">Barreur</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Orchestrateur & Mémoire Active — posez vos questions, déléguer des tâches.
            </p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 min-h-0">
          {/* Chat principal (migré) */}
          <div className="xl:col-span-3 min-h-0 flex flex-col space-y-4">
            <AiUsageGauge />
            <ChatUI initialConversationId={recentConv?.id} />
          </div>

          {/* Panneau latéral : historique des tâches et conversations */}
          <div className="xl:col-span-1 min-h-0 h-full max-h-full flex flex-col">
            <AgentSidebar userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}