'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { limitByIp, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/session';
import { REPORT_REASONS, REPORT_TARGETS } from '@/features/reports/config';

const reportSchema = z.object({
  targetType: z.enum(Object.keys(REPORT_TARGETS) as [string, ...string[]], {
    message: 'Kies wat je wilt melden.',
  }),
  targetId: z.string().trim().max(200).optional(),
  reason: z.enum(Object.keys(REPORT_REASONS) as [string, ...string[]], {
    message: 'Kies een reden.',
  }),
  details: z.string().trim().min(20, 'Leg kort uit wat er mis is (minstens 20 tekens).').max(3000),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Vul een geldig e-mailadres in.')
    .max(254)
    .or(z.literal('')),
  // The DSA asks for a statement of good faith.
  goodFaith: z.literal(true, { message: 'Bevestig dat je melding naar waarheid is.' }),
});

export type ReportInput = z.input<typeof reportSchema>;

/** Anyone — signed in or not — can report content. */
export async function submitReportAction(input: ReportInput): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const limit = await limitByIp('report', 6, 60 * 60_000);
  if (!limit.allowed) return fail(TOO_MANY_REQUESTS);

  const data = parsed.data;
  const user = await getCurrentUser();
  if (!user && !data.email) {
    const message = 'Vul je e-mailadres in zodat we je kunnen laten weten wat we beslissen.';
    return fail(message, { email: message });
  }

  try {
    await db.contentReport.create({
      data: {
        reporter_id: user?.id ?? null,
        reporter_email: data.email || user?.email || null,
        target_type: data.targetType,
        target_id: data.targetId || 'onbekend',
        reason: data.reason,
        details: data.details,
      },
    });
    return ok();
  } catch (error) {
    console.error('[reports] submit failed', error);
    return fail(GENERIC_ERROR);
  }
}
