'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { fail, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { invalidateProviders } from '@/lib/cache';
import { limitByIp, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { createSession } from '@/lib/session';
import { dashboardPathFor } from '@/lib/session-token';
import { DEMO_ACCOUNTS, isDemoEnabled, type DemoAccountKey } from '@/features/demo/config';
import { ensureDemoData } from '@/features/demo/seed';

/**
 * Sign in as one of the demo accounts. Refused unless demo mode is switched
 * on for this deployment, and only ever for the fixed list of demo accounts.
 */
export async function demoLoginAction(input: { account: DemoAccountKey }): Promise<ActionResult> {
  if (!isDemoEnabled()) return fail('Demo-accounts zijn hier niet ingeschakeld.');
  const account = DEMO_ACCOUNTS.find((entry) => entry.key === input.account);
  if (!account) return fail('Onbekend demo-account.');

  const limit = await limitByIp('demo-login', 30, 10 * 60_000);
  if (!limit.allowed) return fail(TOO_MANY_REQUESTS);

  let destination: string;
  try {
    const find = () =>
      db.user.findUnique({
        where: { email: account.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          deleted_at: true,
          provider: { select: { id: true } },
        },
      });

    let user = await find();
    if (!user) {
      try {
        await ensureDemoData();
        invalidateProviders();
      } catch (error) {
        // Two people clicking at the same moment: the other request created the data.
        user = await find();
        if (!user) throw error;
      }
      user ??= await find();
    }
    if (!user || user.deleted_at || user.status !== 'ACTIVE') {
      return fail(
        'Dit demo-account is niet (meer) beschikbaar. Verwijder de demo-accounts in het beheer en probeer opnieuw.'
      );
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      providerId: user.provider?.id ?? null,
    });
    destination = dashboardPathFor(user.role);
  } catch (error) {
    console.error('[demo] login failed', error);
    return fail(GENERIC_ERROR);
  }

  redirect(destination);
}
