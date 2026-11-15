import { z } from 'zod';
import { PRICE_RANGES } from '@/lib/catalog';

export const createRequestSchema = z.object({
  providerId: z.string().min(1),
  eventType: z.string().trim().min(2, 'Kies een type event.').max(80),
  eventDate: z
    .string()
    .min(1, 'Kies een datum.')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Vul een geldige datum in.')
    .refine((value) => new Date(`${value}T23:59:59`).getTime() >= Date.now(), 'Kies een datum in de toekomst.'),
  eventLocation: z.string().trim().min(2, 'Vul de plaats of het adres van je event in.').max(200),
  guestCount: z.coerce
    .number({ message: 'Vul het aantal gasten in.' })
    .int('Vul een heel getal in.')
    .min(1, 'Vul het aantal gasten in.')
    .max(100_000, 'Dit aantal is te hoog.'),
  budgetRange: z.enum(PRICE_RANGES).or(z.literal('')).optional(),
  description: z.string().trim().max(2000, 'Houd je bericht onder de 2000 tekens.').optional(),
  customerName: z.string().trim().min(2, 'Vul je naam in.').max(120),
  customerEmail: z.string().trim().toLowerCase().email('Vul een geldig e-mailadres in.').max(254),
  customerPhone: z
    .string()
    .trim()
    .min(6, 'Vul een telefoonnummer in.')
    .max(30)
    .regex(/^[+\d][\d\s./()-]+$/, 'Vul een geldig telefoonnummer in.'),
  preferredContact: z.enum(['email', 'phone', 'chat']).default('chat'),
  /** Optional: the event slot this request is for (marks it as "quotes requested"). */
  slotId: z.string().optional(),
});

export type CreateRequestInput = z.input<typeof createRequestSchema>;
