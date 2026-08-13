import { billingService } from '@/modules/billing';

export async function syncStripeToFinances(stripeObject: any, eventType: string) {
  const customerId = stripeObject.customer as string;
  if (!customerId) return;
  
  const { subscriptionRepository } = await import('@/modules/billing/infrastructure/subscription.repository');
  const user = await subscriptionRepository.findUserByStripeCustomerId(customerId);
  if (!user) return;

  await billingService.syncStripeUserData(user.id);
}
