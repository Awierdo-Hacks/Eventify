'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { fail, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { getCurrentUser } from '@/lib/session';
import { LEGAL_DOCUMENTS, termsFor } from '@/features/legal/documents';

/** Record that the signed-in user accepts the current terms for their role. */
export async function acceptCurrentTermsAction(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return fail('Je bent niet meer ingelogd.');
  const terms = termsFor(user.role);
  if (!terms) return ok();

  try {
    const privacy = LEGAL_DOCUMENTS.privacy;
    await db.legalAcceptance.createMany({
      data: [
        { user_id: user.id, document: terms.key, version: terms.version },
        { user_id: user.id, document: privacy.key, version: privacy.version },
      ],
    });
    revalidatePath('/', 'layout');
    return ok();
  } catch (error) {
    console.error('[legal] accept terms failed', error);
    return fail(GENERIC_ERROR);
  }
}
