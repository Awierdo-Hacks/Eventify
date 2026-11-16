'use server';

import { redirect } from 'next/navigation';
import { fail, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { getCurrentUser } from '@/lib/session';
import { canStartConversation, findOrCreateConversation } from '@/features/messaging/access';

/** Open (or create) the conversation with another user and go to it. */
export async function openConversationAction(input: {
  recipientId: string;
  returnTo?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(input.returnTo ?? '/messages')}`);

  let conversationId: string;
  try {
    if (
      typeof input.recipientId !== 'string' ||
      !(await canStartConversation(user, input.recipientId))
    ) {
      return fail('Je kunt met deze gebruiker geen gesprek starten.');
    }
    conversationId = await findOrCreateConversation(user.id, input.recipientId);
  } catch (error) {
    console.error('[messaging] open conversation failed', error);
    return fail(GENERIC_ERROR);
  }
  redirect(`/messages/${conversationId}`);
}
