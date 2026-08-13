import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canWrite } from '../domain/entitlements';

export class SubscriptionLifecycle {
  public repository = {
    findUserById: async (userId: string) => {
      return prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, planStatus: true },
      });
    },
  };

  async assertCanWrite(userId: string): Promise<NextResponse | null> {
    const user = await this.repository.findUserById(userId);
    if (!user || !canWrite(user.planStatus)) {
      return NextResponse.json(
        { error: 'subscription_required' },
        { status: 403 }
      );
    }
    return null;
  }
}
