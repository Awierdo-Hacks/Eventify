'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { fail, invalid, ok, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { invalidateProviders } from '@/lib/cache';
import { CATEGORIES, PRICE_RANGES } from '@/lib/catalog';
import { revalidateApp } from '@/lib/revalidate';
import { getCurrentUser } from '@/lib/session';
import { isAllowedImageUrl } from '@/lib/storage';

const optionalInt = z
  .union([z.literal(''), z.coerce.number().int().min(0).max(1_000_000)])
  .optional()
  .transform((value) => (value === '' || value === undefined || value === 0 ? null : value));

const serviceSchema = z
  .object({
    name: z.string().trim().min(2, 'Geef de dienst een naam.').max(120),
    description: z.string().trim().max(500).optional(),
    priceFrom: z.coerce
      .number({ message: 'Vul een prijs in.' })
      .min(0, 'Vul een prijs in.')
      .max(1_000_000),
    priceTo: z
      .union([z.literal(''), z.coerce.number().min(0).max(1_000_000)])
      .optional()
      .transform((value) => (value === '' || value === undefined ? null : value)),
  })
  .refine((service) => service.priceTo === null || service.priceTo >= service.priceFrom, {
    path: ['priceTo'],
    message: 'De maximumprijs moet hoger zijn dan de minimumprijs.',
  });

const profileSchema = z
  .object({
    businessName: z.string().trim().min(2, 'Vul je bedrijfsnaam in.').max(120),
    category: z.enum(CATEGORIES.map((category) => category.slug) as [string, ...string[]], {
      message: 'Kies een categorie.',
    }),
    location: z.string().trim().min(2, 'Vul je stad of regio in.').max(120),
    priceRange: z.enum(PRICE_RANGES, { message: 'Kies een prijsklasse.' }),
    description: z.string().trim().min(50, 'Beschrijf je aanbod in minstens 50 tekens.').max(2000),
    phone: z.string().trim().max(30).optional(),
    website: z
      .string()
      .trim()
      .max(200)
      .optional()
      .refine(
        (value) => !value || /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(value),
        'Vul een geldige website in.'
      ),
    availability: z.string().trim().max(160).optional(),
    responseTime: z.string().trim().max(80).optional(),
    minGuests: optionalInt,
    maxGuests: optionalInt,
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
    images: z.array(z.string().max(500)).max(12, 'Maximaal 12 foto’s.'),
    services: z.array(serviceSchema).max(30),
  })
  .refine(
    (data) =>
      data.minGuests === null || data.maxGuests === null || data.minGuests <= data.maxGuests,
    {
      path: ['maxGuests'],
      message: 'Het maximum moet hoger zijn dan het minimum.',
    }
  );

export type ProfileInput = z.input<typeof profileSchema>;

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== 'PROVIDER' || !user.providerId)
    return fail('Alleen dienstverleners kunnen hun profiel bewerken.');
  const providerId = user.providerId;

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  const images = [...new Set(data.images)].filter(isAllowedImageUrl);

  try {
    await db.$transaction([
      db.serviceProvider.update({
        where: { id: providerId },
        data: {
          business_name: data.businessName,
          category: data.category,
          location: data.location,
          price_range: data.priceRange,
          description: data.description,
          phone: data.phone || null,
          website: data.website || null,
          availability: data.availability || null,
          response_time: data.responseTime || null,
          min_guests: data.minGuests,
          max_guests: data.maxGuests,
          services: data.tags,
          // First photo is the cover. `portfolio_images` mirrors the rest for v1.
          images,
          portfolio_images: images.slice(1),
        },
      }),
      db.providerService.deleteMany({ where: { provider_id: providerId } }),
      db.providerService.createMany({
        data: data.services.map((service) => ({
          provider_id: providerId,
          name: service.name,
          description: service.description || null,
          price_from: service.priceFrom,
          price_to: service.priceTo,
        })),
      }),
    ]);
  } catch (error) {
    console.error('[profile] update failed', error);
    return fail(GENERIC_ERROR);
  }

  invalidateProviders();
  revalidateApp();
  return ok(undefined, 'Profiel opgeslagen.');
}
