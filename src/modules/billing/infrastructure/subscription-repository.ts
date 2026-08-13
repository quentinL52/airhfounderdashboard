import { prisma } from '@/lib/prisma';

export const subscriptionRepository = {
  async findUserByStripeCustomerId(customerId: string) {
    return prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
  },

  async findUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  },

  async updateUserPlan(
    userId: string,
    data: { planStatus: string; plan?: string | null; stripeSubscriptionId?: string | null; stripeCustomerId?: string | null }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  },
};
