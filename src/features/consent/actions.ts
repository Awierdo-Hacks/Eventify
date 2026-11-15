'use server';

import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { limitByIp } from '@/lib/rate-limit';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session-token';
import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE,
  CONSENT_VERSION,
  parseConsent,
  type ConsentState,
} from '@/features/consent/config';

const choiceSchema = z.object({ analytics: z.boolean(), marketing: z.boolean() });

/**
 * Store the visitor's cookie choice: in a first-party cookie (so pages know
 * what may load) and as a database record (so the choice can be demonstrated
 * later). No IP address or device fingerprint is kept.
 */
export async function saveConsentAction(input: { analytics: boolean; marketing: boolean }): Promise<ConsentState | null> {
  const parsed = choiceSchema.safeParse(input);
  if (!parsed.success) return null;

  const cookieStore = await cookies();
  const previous = parseConsent(cookieStore.get(CONSENT_COOKIE)?.value);
  const state: ConsentState = {
    version: CONSENT_VERSION,
    analytics: parsed.data.analytics,
    marketing: parsed.data.marketing,
    visitorId: previous?.visitorId ?? randomUUID(),
    decidedAt: Date.now(),
  };

  cookieStore.set(CONSENT_COOKIE, encodeURIComponent(JSON.stringify(state)), {
    httpOnly: false, // read by the page to decide what may load
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: CONSENT_MAX_AGE,
    path: '/',
  });

  const limit = await limitByIp('consent', 20, 60_000);
  if (limit.allowed) {
    const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
    try {
      await db.consentRecord.create({
        data: {
          visitor_id: state.visitorId,
          user_id: session?.id ?? null,
          policy_version: state.version,
          analytics: state.analytics,
          marketing: state.marketing,
        },
      });
    } catch {
      // The choice is already in effect via the cookie; a failed log write
      // must not block the visitor.
    }
  }

  return state;
}
