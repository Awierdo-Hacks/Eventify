# SEO Audit Report — Eventiphy

**Framework:** Next.js App Router
**Language:** Dutch (nl_BE)
**Date:** 2026-03-26

---

## Summary

- **4 critical fixes applied**
- **3 high-priority enhancements added**
- **2 supporting files created**

---

## Changes Made

### Critical Fixes

- **`app/layout.tsx`** — Added `metadataBase: new URL("https://eventiphy.be")`. Without this, relative OG image URLs in metadata are silently broken and social previews fail entirely.

- **`app/layout.tsx`** — Added `title.template: "%s | Eventiphy"`. This ensures every page using a short title (e.g. "Vind Dienstverleners") automatically gets the brand appended in the `<title>` tag — consistent branding without repeating it on every page.

- **`app/layout.tsx`** — Added complete `openGraph` and `twitter` metadata blocks. Without these, sharing any Eventiphy link on WhatsApp, Instagram, LinkedIn, or X produces a blank/broken card preview instead of a rich preview with title, description, and image.

- **`app/layout.tsx`** — Added `robots` config with full `googleBot` directives (`max-snippet: -1`, `max-image-preview: large`). This allows Google to show extended snippets in results, which improves click-through rate.

### High-Priority Enhancements

- **`app/browse/layout.tsx`** *(new)* — Added page-specific metadata for the browse page. The page itself is `'use client'` so metadata can't live there — a wrapping layout solves this cleanly.

- **`app/waitlist/layout.tsx`** *(new)* — Same pattern. The waitlist page is `'use client'` with no metadata; this layout provides it.

- **`app/providers/[id]/layout.tsx`** *(new)* — Provider profile pages now have meaningful fallback metadata. Currently static; see the TODO in the file for upgrading to `generateMetadata()` with real provider names/descriptions once the page fetches data server-side.

### Supporting Files

- **`public/robots.txt`** *(new)* — Tells search engine crawlers which pages to index and which to skip. Private/authenticated routes (`/dashboard`, `/admin`, `/messages`, etc.) are disallowed — they'd be useless in search results and could leak internal URLs.

- **`app/sitemap.ts`** *(new)* — Dynamic sitemap served at `/sitemap.xml`. Includes all static public pages with appropriate priorities and change frequencies. Contains a commented-out template for adding provider pages dynamically once the DB is ready.

- **`app/layout.tsx`** — Added `Organization` and `WebSite` JSON-LD structured data. `Organization` tells Google about Eventiphy as a business (contact, social links). `WebSite` enables the Sitelinks Searchbox feature in Google results — users can search Eventiphy directly from the search results page.

---

## Remaining Recommendations (require your input)

1. **Create an OG image** — The metadata references `/public/og-image.jpg` (1200×630px). This doesn't exist yet. Create a branded image for this path, otherwise social shares will have no preview image. Tools: Figma, Canva, or a Next.js `/api/og` route using `@vercel/og`.

2. **Provider page dynamic metadata** — `app/providers/[id]/layout.tsx` has static metadata. For real SEO value (provider name in `<title>`, their description in the snippet), convert `providers/[id]/page.tsx` to a server component and use `generateMetadata()` to fetch their data. This would make individual provider profiles indexable with rich snippets.

3. **Per-page canonical URLs** — `about/` and `voorwaarden/` already have metadata but no `alternates: { canonical }`. Add canonical URLs there to prevent any duplicate-content issues if the site is ever served on multiple domains.

4. **`app/about/page.tsx` Open Graph** — The about page has title + description metadata but no `openGraph` block. Add one so sharing the About page produces a proper preview.

5. **Homepage `'use client'` consideration** — `app/page.tsx` is marked `'use client'` for the search `useState` and `useRouter`. Next.js does server-render client components on initial load, so this isn't broken — but for a homepage that should rank well, extracting the interactive search widget into a child client component and making the page itself a server component would be the cleanest long-term approach.

6. **Image alt text** — The browse page renders provider images dynamically. Make sure the `alt` attribute on those `<Image>` components uses the provider's business name, not an empty string or generic text.
