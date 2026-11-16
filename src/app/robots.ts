import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Signed-in areas and endpoints have nothing for search engines.
        disallow: [
          '/dashboard',
          '/provider-dashboard',
          '/admin',
          '/messages',
          '/account',
          '/request-quote',
          '/login',
          '/api/',
          '/melden',
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
