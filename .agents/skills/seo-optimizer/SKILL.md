---
name: seo-optimizer
description: Analyze and optimize the SEO of the current codebase by reading source files directly, identifying issues, and editing them in place. Use this skill whenever the user mentions SEO, search engine optimization, meta tags, Open Graph tags, structured data, JSON-LD, search rankings, Google indexing, page discoverability, sitemap, robots.txt, canonical URLs, or asks to "make my site rank better," "improve search visibility," "audit SEO," "fix my meta tags," or anything related to how a website appears in search engine results. Also trigger when the user asks you to "optimize the codebase" or "look through the project" in an SEO context, or asks about performance/visibility improvements to a web app — SEO is often part of what they need even if they don't say the word. Covers plain HTML sites and all modern JS frameworks (Next.js, Nuxt, Gatsby, Remix, Astro, SvelteKit, etc.).
---

# SEO Optimizer Skill

Scan the current codebase for SEO issues, then edit the files in place to fix them. The goal is to leave the repo better than you found it — with fixes applied, not just recommended.

## Workflow

### Step 1: Understand the project

Identify the framework and structure so you know where SEO lives:

- Check for `package.json`, `next.config.*`, `nuxt.config.*`, `astro.config.*`, `svelte.config.*`, `gatsby-config.*`, `remix.config.*`
- For Next.js: Is it App Router (`app/` dir) or Pages Router (`pages/` dir)?
- For plain HTML: Where are the `.html` files?
- What does the entry layout/template look like?

This shapes everything — a `<title>` tag in Next.js App Router is handled via a `metadata` export, not a raw HTML tag.

### Step 2: Run the automated SEO scanner

The skill includes a Python scanner that finds mechanical issues quickly. Run it against the project root:

```bash
python3 "<skill-base-dir>/scripts/analyze_seo.py" .
```

(Replace `<skill-base-dir>` with the base directory shown at the top of your skill context.)

Read the JSON output carefully — it gives you a structured list of issues by severity (critical, warning, info) across all scanned files.

### Step 3: Read the SEO reference checklist

Before making changes, read the full checklist to ensure nothing is missed, especially framework-specific patterns:

```
<skill-base-dir>/references/seo-checklist.md
```

### Step 4: Manual review — what the scanner can't catch

After the automated scan, do a quick read of the key layout/page files yourself. Look for:

- Poor content hierarchy (the H1 exists but doesn't describe the page well)
- Pages that are server-rendered vs. client-rendered (client-only pages hurt SEO)
- Missing internal links between related content
- URL patterns that are unfriendly (e.g., `/p?id=123` instead of `/blog/post-title`)
- Framework SSR config issues (Next.js pages marked `'use client'` that don't need to be)

### Step 5: Apply fixes directly to the codebase

Work through issues by priority, editing files in place using your Edit tool.

#### Critical first
- Missing or duplicate `<title>` / `metadata.title`
- Missing `<meta name="description">` / `metadata.description`
- Missing or broken `<h1>` (every page needs exactly one)
- Missing `lang` attribute on `<html>`
- Missing viewport meta tag
- Unintentional `noindex`
- Missing canonical URL

#### Then high priority
- Missing Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
- Missing Twitter Card tags
- Images missing `alt` attributes
- Heading hierarchy violations (e.g., jumping from h1 to h3)
- Missing structured data (JSON-LD)
- Non-semantic HTML (`<div>` soup instead of `<nav>`, `<main>`, `<article>`, etc.)

#### Then medium priority
- Images missing `width`/`height` (causes layout shift)
- Below-fold images missing `loading="lazy"`
- External links missing `rel="noopener noreferrer"`
- Scripts missing `async` or `defer`
- Missing `<link rel="preconnect">` for external origins
- Missing `robots.txt` or `sitemap.xml`

### Step 6: Framework-specific approach

Pick the right approach for the detected framework — don't apply HTML patterns to a Next.js App Router codebase:

- **Next.js App Router**: Use `metadata` export or `generateMetadata()` in `layout.tsx`/`page.tsx`. Use `next/image`. Add `sitemap.ts`.
- **Next.js Pages Router**: Use `<Head>` from `next/head` in every page. Check `_document.tsx` for `lang`.
- **Nuxt 3**: Use `useSeoMeta()` or `useHead()`. Check `nuxt.config.ts` for sitemap module.
- **Gatsby**: Use Head API or `gatsby-plugin-react-helmet`. Check `gatsby-plugin-sitemap`.
- **Remix**: Use `meta` export function in routes.
- **Astro**: Use `<head>` in layouts. Add `@astrojs/sitemap` integration.
- **SvelteKit**: Use `<svelte:head>` blocks in pages/layouts.
- **Plain HTML**: Patch `<head>` directly in the HTML files.

See `references/seo-checklist.md` for copy-paste code templates for each framework.

### Step 7: Add structured data where missing

Add JSON-LD schemas appropriate to the page type. Inject as `<script type="application/ld+json">` in `<head>`, or as a framework component. Templates are in the reference file:

- **Every site**: `WebSite` + `Organization`
- **Blog/articles**: `Article` or `BlogPosting`
- **Products**: `Product` with `offers`
- **Local business**: `LocalBusiness`
- **FAQ content**: `FAQPage`
- **How-to guides**: `HowTo`
- **Navigation**: `BreadcrumbList`

### Step 8: Generate missing supporting files

If `robots.txt` or `sitemap.xml` are absent and the framework doesn't auto-generate them, create them. Templates are in `references/seo-checklist.md`.

### Step 9: Write the audit report

After applying all fixes, write a markdown report summarizing what was done. Place it in the project root as `SEO_AUDIT.md`:

```markdown
# SEO Audit Report

## Summary
- X critical issues fixed
- Y warnings resolved
- Z enhancements added

## Changes Made

### Critical Fixes
- `src/app/layout.tsx`: Added metadata export with title template and description
- `public/robots.txt`: Created — was missing entirely

### SEO Enhancements
- `src/components/Hero.tsx`: Added alt text to 3 images
- `src/app/page.tsx`: Added WebSite + Organization JSON-LD schema

## Remaining Recommendations
- Items that need your input (e.g., writing unique descriptions per page, choosing target keywords, providing OG images)
```

## Principles to keep in mind

**Don't invent content.** For meta descriptions, page titles, and alt text — infer from existing code where possible. Where you can't, insert clear placeholder text like `[TODO: Write 150-160 char description about ...]` so the user knows what to fill in.

**Preserve functionality.** Never break existing JS behavior, styles, or layout. SEO fixes should be purely additive or corrective.

**Explain your reasoning briefly.** In the audit report, note *why* each change matters so the user understands and can maintain good practices.

**Be honest about tradeoffs.** If a page is `'use client'` for good reason, note the SEO implication rather than silently removing the directive.
