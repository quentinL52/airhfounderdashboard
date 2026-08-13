import Stripe from 'stripe';
import { PRICING_CONFIG, type StripePriceKey } from '../domain/types';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is missing');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
  appInfo: {
    name: 'Helmdash',
    version: '0.2.0',
  },
});

export const STRIPE_PRICES: Record<StripePriceKey, string> = {
  founder_monthly: process.env.STRIPE_PRICE_FOUNDER_MONTHLY ?? '',
  core_monthly: process.env.STRIPE_PRICE_CORE_MONTHLY ?? '',
  complete_monthly: process.env.STRIPE_PRICE_COMPLETE_MONTHLY ?? '',
};

export function resolvePrice(key: StripePriceKey): string {
  const priceId = STRIPE_PRICES[key];
  if (!priceId) {
    throw new Error(
      `Stripe price ID not configured for ${key}. Set STRIPE_PRICE_${key.toUpperCase()} env var.`,
    );
  }
  return priceId;
}
