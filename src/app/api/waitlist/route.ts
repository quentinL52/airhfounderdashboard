import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Resend } from 'resend';
import { upstashRateLimit } from '@/lib/security/with-rate-limit';
import { env } from '@/lib/env';
import { logger } from '@/lib/logging/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const waitlistSchema = z.object({
  email: z.string().email('Email invalide').transform(e => e.toLowerCase().trim()),
  website: z.string().optional(), // Honeypot field
  timestamp: z.number().optional(),
  signature: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? (req as any).ip ?? 'unknown';
    
    // Rate limit: 5 requests per minute
    const rateLimit = await upstashRateLimit(`waitlist:${ip}`, 5);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes, veuillez réessayer plus tard.' }, { status: 429 });
    }

    const now = Date.now();
    const body = await req.json();
    const { email, website, timestamp, signature } = waitlistSchema.parse(body);

    // Honeypot check
    if (website) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Signature/Timestamp check (fail-open)
    if (timestamp && signature) {
      // Basic signature check: btoa(`${email}:${timestamp}:HELMDASH`)
      const expectedSignature = Buffer.from(`${email}:${timestamp}:HELMDASH`).toString('base64');
      if (signature !== expectedSignature) {
        logger.warn(`[Waitlist] Invalid signature for ${email}`);
        // fail-open: We don't block the request, but we could flag it in DB or just proceed.
      }
      
      const age = now - timestamp;
      if (age < 0 || age > 1000 * 60 * 60) { // Future or older than 1 hour
        logger.warn(`[Waitlist] Invalid timestamp for ${email}`);
        // fail-open
      }
    }

    // Try to create, ignore if already exists. Status is pending by default.
    const entry = await prisma.waitlist.upsert({
      where: { email },
      update: {},
      create: { email, source: 'landing', status: 'pending' },
    });

    if (entry.status === 'pending') {
      const confirmUrl = `${env.NEXT_PUBLIC_APP_URL}/api/waitlist/confirm?token=${entry.id}`;
      
      // Envoi de l'email de confirmation via Resend
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'Helmdash <hello@helmdash.app>',
          to: email,
          subject: 'Confirmez votre place sur la liste d\'attente Helmdash',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0E1B2E;">Vous y êtes presque !</h2>
              <p>Merci de vouloir rejoindre la liste d'attente d'Helmdash.</p>
              <p>Pour confirmer votre place, veuillez cliquer sur le lien ci-dessous :</p>
              <a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #F0522E; color: #fff; text-decoration: none; border-radius: 8px; margin-top: 10px; font-weight: bold;">Confirmer mon email</a>
              <p style="margin-top: 30px; font-size: 12px; color: #6e7b90;">Si vous n'avez pas demandé à rejoindre cette liste, vous pouvez ignorer cet email.</p>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    logger.error('Waitlist error', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
