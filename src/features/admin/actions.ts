'use server';

import { db } from '@/lib/db';
import { fail, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { invalidateProviders } from '@/lib/cache';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';
import { eraseAccount, ErasureBlockedError } from '@/features/account/erase';

async function admin() {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN' ? user : null;
}
const NOT_ALLOWED = 'Alleen beheerders kunnen dit doen.';

export async function setProviderVerifiedAction(input: { providerId: string; verified: boolean }): Promise<ActionResult> {
  if (!(await admin())) return fail(NOT_ALLOWED);
  try {
    await db.serviceProvider.update({ where: { id: input.providerId }, data: { verified: Boolean(input.verified) } });
  } catch (error) {
    console.error('[admin] verify failed', error);
    return fail(GENERIC_ERROR);
  }
  invalidateProviders();
  revalidateApp();
  return ok(undefined, input.verified ? 'Dienstverlener geverifieerd.' : 'Verificatie ingetrokken.');
}

export async function setProviderVisibleAction(input: { providerId: string; visible: boolean }): Promise<ActionResult> {
  if (!(await admin())) return fail(NOT_ALLOWED);
  try {
    await db.serviceProvider.update({ where: { id: input.providerId }, data: { is_active: Boolean(input.visible) } });
  } catch (error) {
    console.error('[admin] visibility failed', error);
    return fail(GENERIC_ERROR);
  }
  invalidateProviders();
  revalidateApp();
  return ok(undefined, input.visible ? 'Profiel is weer zichtbaar.' : 'Profiel is verborgen.');
}

const STATUS_FOR = { suspend: 'SUSPENDED', ban: 'BANNED', activate: 'ACTIVE' } as const;

export async function moderateUserAction(input: { userId: string; action: keyof typeof STATUS_FOR }): Promise<ActionResult> {
  const me = await admin();
  if (!me) return fail(NOT_ALLOWED);
  const status = STATUS_FOR[input.action];
  if (!status) return fail('Onbekende actie.');

  try {
    const target = await db.user.findUnique({ where: { id: input.userId }, select: { role: true, deleted_at: true } });
    if (!target || target.deleted_at) return fail('Deze gebruiker bestaat niet (meer).');
    if (target.role === 'ADMIN') return fail('Beheerders kunnen niet gemodereerd worden.');
    await db.user.update({ where: { id: input.userId }, data: { status } });
  } catch (error) {
    console.error('[admin] moderate failed', error);
    return fail(GENERIC_ERROR);
  }
  invalidateProviders();
  revalidateApp();
  const messages = { suspend: 'Account geschorst.', ban: 'Account geblokkeerd.', activate: 'Account weer actief.' };
  return ok(undefined, messages[input.action]);
}

/** Remove an account on the user's request or after a decision; data is erased, not cascaded away. */
export async function eraseUserAction(input: { userId: string }): Promise<ActionResult> {
  if (!(await admin())) return fail(NOT_ALLOWED);
  try {
    await eraseAccount(input.userId);
  } catch (error) {
    if (error instanceof ErasureBlockedError) return fail(error.message);
    console.error('[admin] erase failed', error);
    return fail(GENERIC_ERROR);
  }
  invalidateProviders();
  revalidateApp();
  return ok(undefined, 'Account verwijderd en gegevens gewist.');
}

export async function resolveReportAction(input: {
  reportId: string;
  outcome: 'ACTION_TAKEN' | 'DISMISSED';
  resolution: string;
}): Promise<ActionResult> {
  if (!(await admin())) return fail(NOT_ALLOWED);
  const resolution = String(input.resolution ?? '').trim().slice(0, 1000);
  if (resolution.length < 10) return fail('Beschrijf kort wat je besliste en waarom (minstens 10 tekens).');
  if (input.outcome !== 'ACTION_TAKEN' && input.outcome !== 'DISMISSED') return fail('Onbekende uitkomst.');

  try {
    await db.contentReport.update({
      where: { id: input.reportId },
      data: { status: input.outcome, resolution, resolved_at: new Date() },
    });
  } catch (error) {
    console.error('[admin] resolve report failed', error);
    return fail(GENERIC_ERROR);
  }
  revalidateApp();
  return ok(undefined, 'Melding afgehandeld.');
}
