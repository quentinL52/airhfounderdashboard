import { NextResponse } from 'next/server';
import { getPricingStatus } from '@/modules/billing';

let cached: { data: any; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }

  const data = await getPricingStatus();
  cached = { data, ts: now };

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
}
