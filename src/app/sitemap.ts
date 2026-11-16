import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { getPublicProviderIds } from '@/features/providers/queries';
import { CATEGORIES } from '@/lib/catalog';

/** Rebuilt hourly, so new provider profiles appear without a deploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const staticPages = [
    page('', 1, 'weekly'),
    page('/browse', 0.9, 'daily'),
    page('/voor-dienstverleners', 0.7, 'monthly'),
    page('/about', 0.6, 'monthly'),
    page('/waitlist', 0.5, 'monthly'),
    page('/register', 0.5, 'monthly'),
    page('/voorwaarden', 0.3, 'yearly'),
    page('/voorwaarden/klanten', 0.2, 'yearly'),
    page('/voorwaarden/dienstverleners', 0.2, 'yearly'),
    page('/privacy', 0.2, 'yearly'),
    page('/cookies', 0.2, 'yearly'),
  ];

  const categoryPages = CATEGORIES.map((category) =>
    page(`/browse?category=${category.slug}`, 0.7, 'daily')
  );

  // Real provider profiles. If the database is unreachable the sitemap still
  // serves the static pages instead of failing.
  const providers = await getPublicProviderIds().catch(() => []);
  const providerPages = providers.map((provider) => ({
    url: `${site.url}/providers/${provider.id}`,
    lastModified: new Date(provider.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...providerPages];
}
