import 'server-only';
import { db } from '@/lib/db';
import { termsFor } from '@/features/legal/documents';

/** The terms a user still has to accept (current version), or null when up to date. */
export async function pendingTermsFor(userId: string, role: string) {
  const terms = termsFor(role);
  if (!terms) return null;
  const accepted = await db.legalAcceptance.findFirst({
    where: { user_id: userId, document: terms.key, version: terms.version },
    select: { id: true },
  });
  return accepted ? null : terms;
}
