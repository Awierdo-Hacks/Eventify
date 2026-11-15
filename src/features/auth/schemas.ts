import { z } from 'zod';
import { CATEGORIES, PRICE_RANGES } from '@/lib/catalog';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Vul je e-mailadres in.')
  .max(254, 'Dit e-mailadres is te lang.')
  .email('Vul een geldig e-mailadres in.');

export const passwordSchema = z
  .string()
  .min(8, 'Kies een wachtwoord van minstens 8 tekens.')
  .max(128, 'Kies een wachtwoord van maximaal 128 tekens.');

const acceptTerms = z.literal(true, { message: 'Je moet akkoord gaan om een account aan te maken.' });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Vul je wachtwoord in.').max(128),
  redirect: z.string().optional(),
});

/** Customers must be adults: they enter into agreements with providers. */
function isAdult(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const eighteenth = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate());
  return eighteenth.getTime() <= Date.now() && date.getFullYear() > 1900;
}

export const registerCustomerSchema = z.object({
  firstName: z.string().trim().min(1, 'Vul je voornaam in.').max(80),
  lastName: z.string().trim().min(1, 'Vul je achternaam in.').max(80),
  email,
  dateOfBirth: z
    .string()
    .min(1, 'Vul je geboortedatum in.')
    .refine(isAdult, 'Je moet minstens 18 jaar zijn om een account aan te maken.'),
  password: passwordSchema,
  acceptTerms,
});

export const registerProviderSchema = z.object({
  contactName: z.string().trim().min(2, 'Vul de naam van de contactpersoon in.').max(120),
  email,
  phone: z
    .string()
    .trim()
    .min(6, 'Vul een telefoonnummer in.')
    .max(30)
    .regex(/^[+\d][\d\s./()-]+$/, 'Vul een geldig telefoonnummer in.'),
  password: passwordSchema,
  businessName: z.string().trim().min(2, 'Vul je bedrijfsnaam in.').max(120),
  category: z.enum(CATEGORIES.map((category) => category.slug) as [string, ...string[]], {
    message: 'Kies een categorie.',
  }),
  location: z.string().trim().min(2, 'Vul je stad of regio in.').max(120),
  priceRange: z.enum(PRICE_RANGES, { message: 'Kies een prijsklasse.' }),
  description: z
    .string()
    .trim()
    .min(50, 'Beschrijf je aanbod in minstens 50 tekens.')
    .max(2000, 'Houd je beschrijving onder de 2000 tekens.'),
  btwNumber: z
    .string()
    .trim()
    .max(20)
    .regex(/^(BE)?\s?0?\d{3}[.\s]?\d{3}[.\s]?\d{3}$/i, 'Vul een geldig Belgisch ondernemingsnummer in, bv. BE 0123.456.789.')
    .or(z.literal('')),
  acceptTerms,
  /** Providers confirm they act as a professional (trader status). */
  confirmProfessional: z.literal(true, { message: 'Bevestig dat je als professional handelt.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterCustomerInput = z.input<typeof registerCustomerSchema>;
export type RegisterProviderInput = z.input<typeof registerProviderSchema>;
