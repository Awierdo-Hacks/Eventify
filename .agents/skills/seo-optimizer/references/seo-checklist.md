# SEO Optimization Checklist & Reference

Complete reference for all SEO optimizations this skill can apply. Organized by category with code templates.

---

## Table of Contents

1. [Essential Meta Tags](#1-essential-meta-tags)
2. [Open Graph & Social Tags](#2-open-graph--social-tags)
3. [Structured Data / JSON-LD](#3-structured-data--json-ld)
4. [Semantic HTML Structure](#4-semantic-html-structure)
5. [Image Optimization](#5-image-optimization)
6. [Performance & Core Web Vitals](#6-performance--core-web-vitals)
7. [Crawlability & Indexing](#7-crawlability--indexing)
8. [Framework-Specific Patterns](#8-framework-specific-patterns)
9. [Common JSON-LD Schema Templates](#9-common-json-ld-schema-templates)

---

## 1. Essential Meta Tags

Every page needs these in `<head>`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Primary Keyword - Brand Name (50-60 chars)</title>
  <meta name="description" content="Compelling description with keywords, 150-160 characters. Include call to action.">
  <link rel="canonical" href="https://example.com/this-page">
</head>
```

Rules:
- Title: 50-60 chars, primary keyword near the start, brand at end
- Description: 150-160 chars, include target keywords naturally, end with a call to action
- Canonical: Always set to the preferred URL to avoid duplicate content penalties
- Lang: Use BCP 47 codes (en, en-US, fr, de, nl-BE, etc.)
- Viewport: Always `width=device-width, initial-scale=1.0` — never disable user scaling

---

## 2. Open Graph & Social Tags

```html
<!-- Open Graph (Facebook, LinkedIn, etc.) -->
<meta property="og:type" content="website">
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Page description for social sharing">
<meta property="og:image" content="https://example.com/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://example.com/this-page">
<meta property="og:site_name" content="Brand Name">
<meta property="og:locale" content="en_US">

<!-- Twitter/X Cards -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://example.com/twitter-image.jpg">
<meta name="twitter:site" content="@handle">
```

Image specs:
- OG image: 1200×630px recommended, minimum 600×315px
- Twitter image: 1200×628px for summary_large_image
- Format: JPG or PNG, under 5MB
- Always use absolute URLs for images

---

## 3. Structured Data / JSON-LD

Place in `<head>` or at the end of `<body>`. Always validate against schema.org.

General rules:
- Use `@context: "https://schema.org"` always
- Include all required properties for the chosen `@type`
- Use absolute URLs
- Nest related schemas when appropriate
- Multiple schemas can coexist on one page

See Section 9 for ready-to-use templates.

---

## 4. Semantic HTML Structure

### Good structure example:
```html
<body>
  <header>
    <nav aria-label="Main navigation">
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>

  <main>
    <article>
      <h1>Page Title — One Per Page</h1>
      <p>Introduction paragraph...</p>

      <section>
        <h2>First Major Section</h2>
        <p>Content...</p>

        <h3>Subsection</h3>
        <p>More content...</p>
      </section>

      <section>
        <h2>Second Major Section</h2>
        <p>Content...</p>
      </section>
    </article>

    <aside>
      <h2>Related Content</h2>
    </aside>
  </main>

  <footer>
    <nav aria-label="Footer navigation">
      <a href="/privacy">Privacy Policy</a>
    </nav>
  </footer>
</body>
```

Rules:
- Exactly one `<h1>` per page
- Headings must not skip levels: h1 → h2 → h3 (never h1 → h3)
- `<main>` wraps the primary content (one per page)
- `<nav>` for navigation blocks, with `aria-label` if multiple
- `<article>` for self-contained content
- `<section>` for thematic groupings (always with a heading)
- `<aside>` for tangentially related content
- `<header>` and `<footer>` for page/section headers and footers

---

## 5. Image Optimization

```html
<!-- Hero / above-fold image — NO lazy loading, preload it -->
<link rel="preload" as="image" href="/hero.webp">
<img
  src="/hero.webp"
  alt="Descriptive alt text explaining the image content"
  width="1200"
  height="800"
  fetchpriority="high"
>

<!-- Below-fold images — lazy load -->
<img
  src="/product-photo.webp"
  alt="Red leather wallet with brass zipper, open showing card slots"
  width="600"
  height="400"
  loading="lazy"
  decoding="async"
>
```

Rules:
- Every `<img>` must have a meaningful `alt` attribute (empty `alt=""` only for purely decorative images)
- Always include `width` and `height` to prevent Cumulative Layout Shift (CLS)
- Use `loading="lazy"` for below-fold images
- Use `fetchpriority="high"` for the largest above-fold image (LCP candidate)
- Prefer modern formats: WebP, AVIF
- Use `<picture>` with `<source>` for format fallbacks
- Use framework image components when available (next/image, NuxtImg, gatsby-plugin-image)

---

## 6. Performance & Core Web Vitals

### Preconnect to external origins
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://cdn.example.com">
```

### Script loading
```html
<!-- Non-critical JS: defer (runs after HTML parsing) -->
<script src="/analytics.js" defer></script>

<!-- Independent JS: async (runs when downloaded) -->
<script src="/widget.js" async></script>

<!-- Critical inline CSS for above-fold content -->
<style>/* Critical CSS here */</style>

<!-- Non-critical CSS: preload + swap -->
<link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
```

### Resource hints
```html
<link rel="dns-prefetch" href="https://api.example.com">
<link rel="preload" href="/fonts/brand.woff2" as="font" type="font/woff2" crossorigin>
```

---

## 7. Crawlability & Indexing

### robots.txt
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /private/

Sitemap: https://example.com/sitemap.xml
```

### sitemap.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.w3.org/2000/svg"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2025-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <lastmod>2025-01-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

### Multi-language (hreflang)
```html
<link rel="alternate" hreflang="en" href="https://example.com/en/page">
<link rel="alternate" hreflang="fr" href="https://example.com/fr/page">
<link rel="alternate" hreflang="x-default" href="https://example.com/page">
```

---

## 8. Framework-Specific Patterns

### Next.js (App Router — v13+)
```tsx
// app/layout.tsx
export const metadata = {
  metadataBase: new URL('https://example.com'),
  title: { default: 'Site Name', template: '%s | Site Name' },
  description: 'Site description',
  openGraph: { images: '/og-image.jpg' },
};

// app/page.tsx (per-page)
export const metadata = {
  title: 'Page Title',
  description: 'Page description',
  alternates: { canonical: '/this-page' },
};

// OR dynamic
export async function generateMetadata({ params }) {
  return { title: `${data.title} | Site Name` };
}
```

### Next.js (Pages Router)
```tsx
import Head from 'next/head';
export default function Page() {
  return (
    <>
      <Head>
        <title>Page Title | Site Name</title>
        <meta name="description" content="Page description" />
        <link rel="canonical" href="https://example.com/page" />
      </Head>
      <main>...</main>
    </>
  );
}
```

### Nuxt 3
```vue
<script setup>
useSeoMeta({
  title: 'Page Title',
  description: 'Page description',
  ogTitle: 'Page Title',
  ogDescription: 'Page description',
  ogImage: 'https://example.com/og.jpg',
  twitterCard: 'summary_large_image',
});
</script>
```

### Astro
```astro
---
// src/layouts/Base.astro
const { title, description } = Astro.props;
---
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={Astro.url} />
</head>
<body><slot /></body>
</html>
```

### SvelteKit
```svelte
<script>
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Page Title | Site Name</title>
  <meta name="description" content="Page description" />
  <link rel="canonical" href={$page.url.href} />
</svelte:head>
```

---

## 9. Common JSON-LD Schema Templates

### Website + Organization
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Company Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  }
}
```

### Article / Blog Post
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title (max 110 chars)",
  "description": "Article description",
  "image": "https://example.com/article-image.jpg",
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "https://example.com/author"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Publisher Name",
    "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
  },
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-20"
}
```

### Product
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Product Name",
  "image": "https://example.com/product.jpg",
  "description": "Product description",
  "brand": { "@type": "Brand", "name": "Brand Name" },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/product",
    "priceCurrency": "USD",
    "price": "29.99",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "42"
  }
}
```

### FAQ Page
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the return policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can return within 30 days for a full refund."
      }
    },
    {
      "@type": "Question",
      "name": "Do you ship internationally?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we ship to over 50 countries."
      }
    }
  ]
}
```

### Local Business
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Business Name",
  "image": "https://example.com/storefront.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "City",
    "addressRegion": "State",
    "postalCode": "12345",
    "addressCountry": "US"
  },
  "telephone": "+1-555-123-4567",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "09:00",
      "closes": "17:00"
    }
  ]
}
```

### Breadcrumbs
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com/" },
    { "@type": "ListItem", "position": 2, "name": "Category", "item": "https://example.com/category" },
    { "@type": "ListItem", "position": 3, "name": "Current Page" }
  ]
}
```

### HowTo
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Do X",
  "description": "A guide to doing X.",
  "step": [
    { "@type": "HowToStep", "name": "Step 1", "text": "Do this first." },
    { "@type": "HowToStep", "name": "Step 2", "text": "Then do this." }
  ]
}
```