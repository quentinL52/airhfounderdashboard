import { stripeWebhookHandler } from '@/modules/billing';

export async function POST(req: Request) {
  return stripeWebhookHandler.handleWebhook(req);
}
