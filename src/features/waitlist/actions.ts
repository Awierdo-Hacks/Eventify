'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { CATEGORIES } from '@/lib/catalog';
import { limitByIp, TOO_MANY_REQUESTS } from '@/lib/rate-limit';

const categoryValues = CATEGORIES.map((category) => category.key ?? category.slug.toUpperCase());

const waitlistSchema = z
  .object({
    type: z.enum(['CUSTOMER', 'PROVIDER'], { message: 'Kies of je klant of dienstverlener bent.' }),
    name: z.string().trim().min(2, 'Vul je naam in.').max(120),
    email: z.string().trim().toLowerCase().email('Vul een geldig e-mailadres in.').max(254),
    phone: z.string().trim().max(30).optional(),
    categories: z.array(z.string()).max(20).default([]),
    message: z.string().trim().max(1000, 'Houd je bericht onder de 1000 tekens.').optional(),
    // Honeypot: real visitors never fill this in.
    website: z.string().max(0).optional(),
  })
  .refine((data) => data.type !== 'PROVIDER' || data.categories.length > 0, {
    path: ['categories'],
    message: 'Kies minstens één dienst.',
  });

export type WaitlistInput = z.input<typeof waitlistSchema>;

export async function joinWaitlistAction(input: WaitlistInput): Promise<ActionResult> {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) {
    // A filled honeypot gets a silent "success" so bots learn nothing.
    if (input.website) return ok();
    return invalid(parsed.error);
  }
  const limit = await limitByIp('waitlist', 5, 60 * 60_000);
  if (!limit.allowed) return fail(TOO_MANY_REQUESTS);

  const data = parsed.data;
  try {
    await db.waitlistEntry.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        categories: data.type === 'PROVIDER' ? data.categories.filter((value) => categoryValues.includes(value)) : [],
        message: data.message || null,
      },
    });
    return ok();
  } catch (error) {
    console.error('[waitlist] join failed', error);
    return fail(GENERIC_ERROR);
  }
}
