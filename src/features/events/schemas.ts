import { z } from 'zod';
import { CATEGORY_KEYS, EVENT_TYPES } from '@/lib/catalog';

const optionalNumber = (max: number, message: string) =>
  z
    .union([z.literal(''), z.coerce.number().min(0, message).max(max, message)])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value));

const optionalDate = z
  .string()
  .optional()
  .transform((value) => (value ? value : null))
  .refine(
    (value) => value === null || !Number.isNaN(new Date(value).getTime()),
    'Vul een geldige datum in.'
  );

export const eventDetailsSchema = z
  .object({
    name: z.string().trim().min(2, 'Geef je event een naam.').max(120),
    eventDate: optionalDate,
    location: z.string().trim().max(160).optional(),
    guestCount: optionalNumber(100_000, 'Vul een geldig aantal gasten in.'),
    budgetMin: optionalNumber(10_000_000, 'Vul een geldig bedrag in.'),
    budgetMax: optionalNumber(10_000_000, 'Vul een geldig bedrag in.'),
  })
  .refine(
    (data) =>
      data.budgetMin === null || data.budgetMax === null || data.budgetMin <= data.budgetMax,
    {
      path: ['budgetMax'],
      message: 'Het maximum moet hoger zijn dan het minimum.',
    }
  );

const slotSchema = z.object({
  category: z.enum(CATEGORY_KEYS),
  isRequired: z.boolean().default(true),
  customName: z.string().trim().max(80).optional(),
});

export const createEventSchema = eventDetailsSchema.and(
  z.object({
    eventType: z.enum(EVENT_TYPES, { message: 'Kies een type event.' }),
    slots: z.array(slotSchema).min(1, 'Kies minstens één onderdeel.').max(30),
  })
);

export const addSlotSchema = slotSchema.extend({ eventId: z.string().min(1) });

export type EventDetailsInput = z.input<typeof eventDetailsSchema>;
export type CreateEventInput = z.input<typeof createEventSchema>;
export type AddSlotInput = z.input<typeof addSlotSchema>;
