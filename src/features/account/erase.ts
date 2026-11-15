import 'server-only';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { deleteUpload } from '@/lib/storage';
import { disconnectGoogleCalendar } from '@/features/calendar/google';

export const ERASED_NAME = 'Verwijderde gebruiker';
export const ERASED_PROVIDER_NAME = 'Verwijderde dienstverlener';

export class ErasureBlockedError extends Error {}

/**
 * Erase an account (GDPR art. 17).
 *
 * Personal data is deleted or irreversibly replaced. Records the other party
 * needs — bookings, quotes, the fact that a conversation took place — are
 * kept without anything that identifies the erased person. The user row
 * itself stays as an anonymous stub so those records keep a valid owner.
 *
 * Upcoming bookings block erasure: someone is counting on them.
 */
export async function eraseAccount(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, deleted_at: true, provider: { select: { id: true, images: true, portfolio_images: true } } },
  });
  if (!user || user.deleted_at) return;
  if (user.role === 'ADMIN') throw new ErasureBlockedError('Een beheerdersaccount kan niet op deze manier verwijderd worden.');

  const providerId = user.provider?.id ?? null;
  const upcoming = await db.booking.count({
    where: {
      status: { in: ['PENDING', 'CONFIRMED'] },
      event_date: { gte: new Date() },
      OR: [{ customer_id: userId }, ...(providerId ? [{ provider_id: providerId }] : [])],
    },
  });
  if (upcoming > 0) {
    throw new ErasureBlockedError(
      'Er staan nog boekingen gepland. Rond ze af of annuleer ze in overleg met de andere partij, daarna kun je je account verwijderen.',
    );
  }

  const attachments = await db.messageAttachment.findMany({ where: { message: { sender_id: userId } }, select: { url: true } });
  const files = [...attachments.map((attachment) => attachment.url), ...(user.provider?.images ?? []), ...(user.provider?.portfolio_images ?? [])];

  if (providerId) await disconnectGoogleCalendar(providerId).catch(() => undefined);

  const unusablePassword = await bcrypt.hash(randomBytes(32).toString('hex'), 10);
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${userId}@deleted.invalid`,
        name: ERASED_NAME,
        first_name: null,
        last_name: null,
        phone: null,
        date_of_birth: null,
        password_hash: unusablePassword,
        deleted_at: now,
      },
    });

    // Contact details copied onto requests, and free text that may describe the person.
    await tx.serviceRequest.updateMany({
      where: { customer_id: userId },
      data: { customer_name: ERASED_NAME, customer_email: '', customer_phone: '', description: '', preferred_contact: null },
    });
    await tx.serviceRequest.updateMany({
      where: { customer_id: userId, status: { in: ['PENDING', 'QUOTED'] } },
      data: { status: 'CANCELLED' },
    });

    // Events are purely the customer's own planning.
    await tx.event.deleteMany({ where: { customer_id: userId } });

    // Messages: the other party keeps the thread, without this person's words or files.
    await tx.messageAttachment.deleteMany({ where: { message: { sender_id: userId } } });
    await tx.message.updateMany({
      where: { sender_id: userId, message_type: { not: 'QUOTE' } },
      data: { content: 'Dit bericht is verwijderd.', message_type: 'SYSTEM' },
    });

    await tx.consentRecord.updateMany({ where: { user_id: userId }, data: { user_id: null } });
    await tx.contentReport.updateMany({ where: { reporter_id: userId }, data: { reporter_id: null, reporter_email: null } });

    if (providerId) {
      await tx.serviceProvider.update({
        where: { id: providerId },
        data: {
          business_name: ERASED_PROVIDER_NAME,
          description: null,
          phone: null,
          website: null,
          btw_number: null,
          availability: null,
          response_time: null,
          services: [],
          images: [],
          portfolio_images: [],
          verified: false,
          is_active: false,
        },
      });
      await tx.providerService.deleteMany({ where: { provider_id: providerId } });
      await tx.blockedDate.deleteMany({ where: { provider_id: providerId } });
      await tx.calendarIntegration.deleteMany({ where: { provider_id: providerId } });
      // Open quotes can no longer be accepted.
      await tx.quote.updateMany({
        where: { provider_id: providerId, accepted: false, rejected_at: null },
        data: { valid_until: now, terms: null },
      });
      await tx.serviceRequest.updateMany({
        where: { provider_id: providerId, status: { in: ['PENDING', 'QUOTED'] } },
        data: { status: 'CANCELLED' },
      });
    }
  });

  await Promise.all(files.map((url) => deleteUpload(url)));
}
