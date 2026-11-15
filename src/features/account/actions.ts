'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { invalidateProviders } from '@/lib/cache';
import { rateLimit, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { revalidateApp } from '@/lib/revalidate';
import { createSession, destroySession, getCurrentUser } from '@/lib/session';
import { passwordSchema } from '@/features/auth/schemas';
import { eraseAccount, ErasureBlockedError } from '@/features/account/erase';

const NOT_SIGNED_IN = 'Je bent niet meer ingelogd. Log opnieuw in.';

const detailsSchema = z.object({
  name: z.string().trim().min(2, 'Vul je naam in.').max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^$|^[+\d][\d\s./()-]+$/, 'Vul een geldig telefoonnummer in.'),
});

/** Correct your own details (GDPR art. 16). */
export async function updateAccountAction(input: z.input<typeof detailsSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  const parsed = detailsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const parts = parsed.data.name.split(/\s+/);
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        ...(user.role === 'CUSTOMER' ? { first_name: parts[0] ?? null, last_name: parts.slice(1).join(' ') || null } : {}),
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    // The session cookie carries the display name.
    await createSession({ ...updated, providerId: user.providerId });
  } catch (error) {
    console.error('[account] update failed', error);
    return fail(GENERIC_ERROR);
  }
  revalidateApp();
  return ok(undefined, 'Je gegevens zijn bijgewerkt.');
}

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Vul je huidige wachtwoord in.').max(128),
  newPassword: passwordSchema,
});

export async function changePasswordAction(input: z.input<typeof passwordChangeSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  const parsed = passwordChangeSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!rateLimit(`password:${user.id}`, 8, 15 * 60_000).allowed) return fail(TOO_MANY_REQUESTS);

  try {
    const account = await db.user.findUnique({ where: { id: user.id }, select: { password_hash: true } });
    if (!account || !(await bcrypt.compare(parsed.data.currentPassword, account.password_hash))) {
      const message = 'Je huidige wachtwoord klopt niet.';
      return fail(message, { currentPassword: message });
    }
    await db.user.update({ where: { id: user.id }, data: { password_hash: await bcrypt.hash(parsed.data.newPassword, 12) } });
  } catch (error) {
    console.error('[account] password change failed', error);
    return fail(GENERIC_ERROR);
  }
  return ok(undefined, 'Je wachtwoord is gewijzigd.');
}

/** Delete your own account (GDPR art. 17). Requires the password as confirmation. */
export async function deleteAccountAction(input: { password: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail(NOT_SIGNED_IN);
  if (!rateLimit(`delete-account:${user.id}`, 5, 15 * 60_000).allowed) return fail(TOO_MANY_REQUESTS);

  try {
    const account = await db.user.findUnique({ where: { id: user.id }, select: { password_hash: true } });
    if (!account || !(await bcrypt.compare(String(input.password ?? ''), account.password_hash))) {
      const message = 'Dit wachtwoord klopt niet.';
      return fail(message, { password: message });
    }
    await eraseAccount(user.id);
    await destroySession();
  } catch (error) {
    if (error instanceof ErasureBlockedError) return fail(error.message);
    console.error('[account] delete failed', error);
    return fail(GENERIC_ERROR);
  }

  if (user.role === 'PROVIDER') invalidateProviders();
  revalidateApp();
  redirect('/?account=verwijderd');
}
