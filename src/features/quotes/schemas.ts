import { z } from 'zod';

const servicesList = z
  .array(z.string().trim().max(160))
  .transform((items) => items.filter((item) => item.length > 0))
  .refine((items) => items.length > 0, 'Voeg minstens één inbegrepen dienst toe.')
  .refine((items) => items.length <= 25, 'Maximaal 25 diensten per offerte.');

export const quoteContentSchema = z.object({
  totalPrice: z.coerce
    .number({ message: 'Vul een geldige prijs in.' })
    .positive('De prijs moet hoger zijn dan € 0.')
    .max(1_000_000, 'Deze prijs is te hoog.'),
  title: z.string().trim().min(3, 'Geef de offerte een korte omschrijving.').max(200),
  includedServices: servicesList,
  terms: z.string().trim().max(2000).optional(),
  validDays: z.coerce.number().int().min(1).max(90).default(14),
});

export const createQuoteSchema = quoteContentSchema.extend({
  requestId: z.string().min(1),
});

export const chatQuoteSchema = quoteContentSchema.extend({
  conversationId: z.string().min(1),
  eventDate: z.string().optional(),
  eventLocation: z.string().trim().max(200).optional(),
});

export type QuoteContentInput = z.input<typeof quoteContentSchema>;
export type CreateQuoteInput = z.input<typeof createQuoteSchema>;
export type ChatQuoteInput = z.input<typeof chatQuoteSchema>;

export const DEFAULT_TERMS = 'Standaard voorwaarden van toepassing.';
