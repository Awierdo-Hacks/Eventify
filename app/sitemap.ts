import { MetadataRoute } from "next";

const BASE_URL = "https://eventiphy.be";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/waitlist`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/voorwaarden`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic provider pages — fetch from DB when available
  // TODO: Replace with real DB query once providers are live
  // Example:
  // const providers = await prisma.provider.findMany({ where: { isPublished: true }, select: { id: true, updatedAt: true } });
  // const providerPages = providers.map((p) => ({
  //   url: `${BASE_URL}/providers/${p.id}`,
  //   lastModified: p.updatedAt,
  //   changeFrequency: "weekly" as const,
  //   priority: 0.8,
  // }));

  return [...staticPages];
}
