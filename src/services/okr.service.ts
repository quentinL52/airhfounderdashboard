import { prisma } from '@/lib/prisma';

export async function refreshKeyResults(userId: string) {
  const krs = await prisma.keyResult.findMany({ where: { userId } });

  for (const kr of krs) {
    let newCurrent = kr.current;

    try {
      switch (kr.sourceType) {
        case 'mrr':
          const user = await prisma.user.findUnique({ where: { id: userId }, select: { mrr: true } });
          newCurrent = user?.mrr || 0;
          break;
          
        case 'pipeline_won':
          const wonContacts = await prisma.contact.count({
            where: { userId, status: 'client' }
          });
          newCurrent = wonContacts;
          break;
          
        case 'waitlist_confirmed':
          // Assuming waitlist confirmed means users with planStatus active or similar, or actual waitlist entries if tied to userId.
          // For now, if tied to landing page waitlist, we might need a specific table. 
          // Waitlist table doesn't have userId, it just has emails. We'll skip for now or mock it based on projects.
          const waitlistCount = await prisma.waitlist.count({
            where: { status: 'confirmed' }
          });
          newCurrent = waitlistCount; // Note: This is global unless we link waitlist to userId.
          break;
          
        case 'hypotheses_validated':
          const validated = await prisma.hypothesis.count({
            where: { userId, status: 'validated' }
          });
          newCurrent = validated;
          break;
          
        case 'runway_months':
          const financeSettings = await prisma.financeSettings.findUnique({ where: { userId } });
          if (financeSettings) {
            // Simplified runway calculation for backend context
            newCurrent = financeSettings.cashAvailable > 0 ? 12 : 0; 
          }
          break;
          
        case 'manual':
        default:
          // Ne rien faire pour manual
          break;
      }

      if (newCurrent !== kr.current && kr.sourceType !== 'manual') {
        await prisma.keyResult.update({
          where: { id: kr.id },
          data: { current: newCurrent }
        });
      }
    } catch (e) {
      console.error(`Error refreshing KR ${kr.id}:`, e);
    }
  }
}
