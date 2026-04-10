#!/usr/bin/env python3
"""
SEO Analyzer Script
Scans web project files for common SEO issues and outputs a structured JSON report.
Supports: HTML, JSX/TSX, Vue, Svelte, Astro files.
"""

import os
import re
import json
import sys
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict

# ---------------------------------------------------------------------------
# Severity levels
# ---------------------------------------------------------------------------
CRITICAL = "critical"
WARNING = "warning"
INFO = "info"

# ---------------------------------------------------------------------------
# HTML Tag Extractor (lightweight, no external deps)
# ---------------------------------------------------------------------------
class SEOHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []  # list of (tag, attrs_dict, content)
        self._stack = []
        self._current_data = []

    def handle_starttag(self, tag, attrs):
        self._stack.append((tag, dict(attrs), []))

    def handle_endtag(self, tag):
        # Pop matching tag from stack
        for i in range(len(self._stack) - 1, -1, -1):
            if self._stack[i][0] == tag:
                t, a, content_parts = self._stack.pop(i)
                self.tags.append((t, a, "".join(content_parts).strip()))
                break

    def handle_data(self, data):
        if self._stack:
            self._stack[-1][2].append(data)

    def error(self, message):
        pass  # Ignore parse errors


def extract_tags(content):
    """Extract HTML tags from content (works for HTML, JSX, Vue templates, etc.)."""
    parser = SEOHTMLParser()
    try:
        parser.feed(content)
    except Exception:
        pass
    return parser.tags


# ---------------------------------------------------------------------------
# Individual checks
# ---------------------------------------------------------------------------

def check_title(filepath, content, tags):
    """Check for <title> tag."""
    issues = []
    titles = [(t, a, c) for t, a, c in tags if t == "title"]
    if not titles:
        # Also check for framework patterns
        has_framework_title = bool(
            re.search(r'(useHead|useSeoMeta|<Head>|<svelte:head>|metadata\s*=|generateMetadata|export\s+const\s+meta)', content)
        )
        if not has_framework_title:
            issues.append({
                "severity": CRITICAL,
                "rule": "missing-title",
                "message": "No <title> tag found. Every page must have a unique, descriptive title (50-60 characters ideal).",
                "file": filepath,
            })
    else:
        for t, a, c in titles:
            if not c or c.strip() == "":
                issues.append({
                    "severity": CRITICAL,
                    "rule": "empty-title",
                    "message": "The <title> tag is empty. It should contain a descriptive page title.",
                    "file": filepath,
                })
            elif len(c.strip()) > 60:
                issues.append({
                    "severity": WARNING,
                    "rule": "title-too-long",
                    "message": f"Title is {len(c.strip())} characters — ideally keep it under 60 to avoid truncation in search results.",
                    "file": filepath,
                })
        if len(titles) > 1:
            issues.append({
                "severity": WARNING,
                "rule": "duplicate-title-tags",
                "message": f"Found {len(titles)} <title> tags. There should be exactly one per page.",
                "file": filepath,
            })
    return issues


def check_meta_description(filepath, content, tags):
    """Check for meta description."""
    issues = []
    descs = [(t, a, c) for t, a, c in tags if t == "meta" and a.get("name", "").lower() == "description"]
    if not descs:
        has_framework_meta = bool(re.search(r'(useSeoMeta|generateMetadata|export\s+const\s+meta)', content))
        if not has_framework_meta:
            issues.append({
                "severity": CRITICAL,
                "rule": "missing-meta-description",
                "message": "No <meta name=\"description\"> found. Search engines display this in results — aim for 150-160 characters.",
                "file": filepath,
            })
    else:
        for t, a, c in descs:
            desc_content = a.get("content", "")
            if not desc_content:
                issues.append({
                    "severity": CRITICAL,
                    "rule": "empty-meta-description",
                    "message": "Meta description exists but has no content attribute.",
                    "file": filepath,
                })
            elif len(desc_content) > 160:
                issues.append({
                    "severity": WARNING,
                    "rule": "meta-description-too-long",
                    "message": f"Meta description is {len(desc_content)} chars — keep under 160 to avoid truncation.",
                    "file": filepath,
                })
            elif len(desc_content) < 50:
                issues.append({
                    "severity": WARNING,
                    "rule": "meta-description-too-short",
                    "message": f"Meta description is only {len(desc_content)} chars — aim for 150-160 for best results.",
                    "file": filepath,
                })
    return issues


def check_viewport(filepath, content, tags):
    """Check for viewport meta tag."""
    issues = []
    viewports = [t for t, a, c in tags if t == "meta" and a.get("name", "").lower() == "viewport"]
    if not viewports:
        # Frameworks usually handle this in layout files
        if not re.search(r'(next|nuxt|gatsby|remix|astro|svelte)', filepath.lower()):
            issues.append({
                "severity": CRITICAL,
                "rule": "missing-viewport",
                "message": "No <meta name=\"viewport\"> found. Required for mobile responsiveness and mobile-first indexing.",
                "file": filepath,
            })
    return issues


def check_html_lang(filepath, content, tags):
    """Check for lang attribute on <html>."""
    issues = []
    html_tags = [(t, a, c) for t, a, c in tags if t == "html"]
    for t, a, c in html_tags:
        if "lang" not in a or not a["lang"]:
            issues.append({
                "severity": CRITICAL,
                "rule": "missing-html-lang",
                "message": "The <html> tag is missing a 'lang' attribute. This helps search engines understand the page language.",
                "file": filepath,
            })
    return issues


def check_canonical(filepath, content, tags):
    """Check for canonical URL."""
    issues = []
    canonicals = [(t, a, c) for t, a, c in tags if t == "link" and a.get("rel", "").lower() == "canonical"]
    if not canonicals:
        has_framework_canonical = bool(re.search(r'(alternates|canonical)', content, re.IGNORECASE))
        if not has_framework_canonical:
            issues.append({
                "severity": WARNING,
                "rule": "missing-canonical",
                "message": "No <link rel=\"canonical\"> found. Canonical URLs prevent duplicate content issues.",
                "file": filepath,
            })
    return issues


def check_headings(filepath, content, tags):
    """Check heading hierarchy."""
    issues = []
    headings = [(t, a, c) for t, a, c in tags if t in ("h1", "h2", "h3", "h4", "h5", "h6")]

    # Also catch JSX headings via regex
    jsx_headings = re.findall(r'<(h[1-6])[^>]*>', content, re.IGNORECASE)

    h1_count = sum(1 for t, _, _ in headings if t == "h1") + sum(1 for h in jsx_headings if h.lower() == "h1")

    if h1_count == 0:
        issues.append({
            "severity": CRITICAL,
            "rule": "missing-h1",
            "message": "No <h1> tag found. Every page should have exactly one <h1> describing the page's primary topic.",
            "file": filepath,
        })
    elif h1_count > 1:
        issues.append({
            "severity": WARNING,
            "rule": "multiple-h1",
            "message": f"Found {h1_count} <h1> tags. Best practice is exactly one <h1> per page.",
            "file": filepath,
        })

    # Check hierarchy gaps
    all_levels = []
    for t, _, _ in headings:
        all_levels.append(int(t[1]))
    for h in jsx_headings:
        all_levels.append(int(h[1]))

    for i in range(1, len(all_levels)):
        if all_levels[i] > all_levels[i - 1] + 1:
            issues.append({
                "severity": WARNING,
                "rule": "heading-hierarchy-gap",
                "message": f"Heading hierarchy skips from h{all_levels[i-1]} to h{all_levels[i]}. Headings should not skip levels.",
                "file": filepath,
            })
            break  # Report once per file

    return issues


def check_images(filepath, content, tags):
    """Check images for alt text, dimensions, and lazy loading."""
    issues = []
    images = [(t, a, c) for t, a, c in tags if t == "img"]

    # Also find self-closing img tags via regex (JSX style)
    img_regex = re.findall(r'<img\s([^>]+?)/?>', content, re.IGNORECASE | re.DOTALL)

    missing_alt = 0
    missing_dims = 0
    missing_lazy = 0

    for t, a, c in images:
        if "alt" not in a:
            missing_alt += 1
        if "width" not in a or "height" not in a:
            missing_dims += 1
        if a.get("loading", "") != "lazy":
            missing_lazy += 1

    for attr_str in img_regex:
        if "alt" not in attr_str.lower():
            missing_alt += 1
        if "width" not in attr_str.lower() or "height" not in attr_str.lower():
            missing_dims += 1

    # Deduplicate roughly (parser + regex may double count)
    if missing_alt > 0:
        issues.append({
            "severity": WARNING,
            "rule": "images-missing-alt",
            "message": f"~{missing_alt} image(s) are missing 'alt' attributes. Alt text is essential for accessibility and image SEO.",
            "file": filepath,
        })
    if missing_dims > 0:
        issues.append({
            "severity": INFO,
            "rule": "images-missing-dimensions",
            "message": f"~{missing_dims} image(s) are missing width/height attributes. Setting explicit dimensions prevents layout shift (CLS).",
            "file": filepath,
        })
    if missing_lazy > 0:
        issues.append({
            "severity": INFO,
            "rule": "images-missing-lazy-loading",
            "message": f"~{missing_lazy} image(s) could benefit from loading=\"lazy\" for better performance.",
            "file": filepath,
        })

    return issues


def check_open_graph(filepath, content, tags):
    """Check for Open Graph meta tags."""
    issues = []
    og_tags = {a.get("property", "").lower() for t, a, c in tags if t == "meta" and a.get("property", "").startswith("og:")}

    required_og = {"og:title", "og:description", "og:image", "og:url", "og:type"}
    missing = required_og - og_tags

    if missing == required_og:
        has_framework_og = bool(re.search(r'(openGraph|og_|useSeoMeta)', content))
        if not has_framework_og:
            issues.append({
                "severity": WARNING,
                "rule": "missing-open-graph",
                "message": "No Open Graph tags found. OG tags control how your page appears when shared on social media.",
                "file": filepath,
            })
    elif missing:
        issues.append({
            "severity": INFO,
            "rule": "incomplete-open-graph",
            "message": f"Missing OG tags: {', '.join(sorted(missing))}.",
            "file": filepath,
        })

    return issues


def check_twitter_cards(filepath, content, tags):
    """Check for Twitter/X Card meta tags."""
    issues = []
    twitter_tags = {a.get("name", "").lower() for t, a, c in tags if t == "meta" and a.get("name", "").startswith("twitter:")}

    if not twitter_tags:
        has_framework_twitter = bool(re.search(r'(twitter:|twitterCard)', content))
        if not has_framework_twitter:
            issues.append({
                "severity": INFO,
                "rule": "missing-twitter-cards",
                "message": "No Twitter Card tags found. These control how your page appears when shared on X/Twitter.",
                "file": filepath,
            })
    return issues


def check_structured_data(filepath, content, tags):
    """Check for JSON-LD structured data."""
    issues = []
    has_jsonld = bool(re.search(r'application/ld\+json', content))
    if not has_jsonld:
        issues.append({
            "severity": WARNING,
            "rule": "missing-structured-data",
            "message": "No JSON-LD structured data found. Structured data enables rich search results (stars, prices, FAQ, etc.).",
            "file": filepath,
        })
    return issues


def check_semantic_html(filepath, content, tags):
    """Check for semantic HTML usage."""
    issues = []
    tag_names = {t for t, a, c in tags}

    semantic_tags = {"nav", "main", "article", "section", "header", "footer", "aside"}
    found_semantic = tag_names & semantic_tags

    # Also check via regex for JSX
    for st in semantic_tags:
        if re.search(rf'<{st}[\s>]', content, re.IGNORECASE):
            found_semantic.add(st)

    if "main" not in found_semantic:
        issues.append({
            "severity": WARNING,
            "rule": "missing-main-landmark",
            "message": "No <main> element found. The main content area should be wrapped in <main> for accessibility and SEO.",
            "file": filepath,
        })

    if not found_semantic:
        issues.append({
            "severity": WARNING,
            "rule": "no-semantic-html",
            "message": "No semantic HTML5 elements found (nav, main, article, section, header, footer). Using semantic tags helps search engines understand page structure.",
            "file": filepath,
        })

    return issues


def check_links(filepath, content, tags):
    """Check external links for rel attributes."""
    issues = []
    links = [(t, a, c) for t, a, c in tags if t == "a" and a.get("href", "").startswith("http")]
    missing_rel = 0
    for t, a, c in links:
        rel = a.get("rel", "").lower()
        if "noopener" not in rel:
            missing_rel += 1

    if missing_rel > 0:
        issues.append({
            "severity": INFO,
            "rule": "external-links-missing-rel",
            "message": f"{missing_rel} external link(s) missing rel=\"noopener noreferrer\". This is a security and minor SEO best practice.",
            "file": filepath,
        })
    return issues


def check_scripts(filepath, content, tags):
    """Check for render-blocking scripts."""
    issues = []
    scripts = [(t, a, c) for t, a, c in tags if t == "script" and a.get("src")]
    blocking = 0
    for t, a, c in scripts:
        if "async" not in a and "defer" not in a and "type" not in a:
            blocking += 1

    if blocking > 0:
        issues.append({
            "severity": INFO,
            "rule": "render-blocking-scripts",
            "message": f"{blocking} script(s) without async/defer may block rendering and hurt Core Web Vitals.",
            "file": filepath,
        })
    return issues


def check_noindex(filepath, content, tags):
    """Check for accidental noindex."""
    issues = []
    robots = [(t, a, c) for t, a, c in tags if t == "meta" and a.get("name", "").lower() == "robots"]
    for t, a, c in robots:
        robots_content = a.get("content", "").lower()
        if "noindex" in robots_content:
            issues.append({
                "severity": CRITICAL,
                "rule": "noindex-detected",
                "message": "Found <meta name=\"robots\" content=\"noindex\">. This page will NOT be indexed by search engines. Remove if unintentional.",
                "file": filepath,
            })
    return issues


# ---------------------------------------------------------------------------
# Project-level checks
# ---------------------------------------------------------------------------

def check_project_files(project_path):
    """Check for robots.txt and sitemap.xml."""
    issues = []
    project = Path(project_path)

    # robots.txt
    robots_candidates = [
        project / "robots.txt",
        project / "public" / "robots.txt",
        project / "static" / "robots.txt",
    ]
    if not any(r.exists() for r in robots_candidates):
        issues.append({
            "severity": WARNING,
            "rule": "missing-robots-txt",
            "message": "No robots.txt found. This file tells search engine crawlers which pages to index.",
            "file": str(project),
        })

    # sitemap
    sitemap_candidates = [
        project / "sitemap.xml",
        project / "public" / "sitemap.xml",
        project / "static" / "sitemap.xml",
    ]
    has_sitemap_config = False
    pkg_json = project / "package.json"
    if pkg_json.exists():
        try:
            pkg = json.loads(pkg_json.read_text(errors="replace"))
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
            sitemap_packages = ["next-sitemap", "@astrojs/sitemap", "gatsby-plugin-sitemap", "nuxt-simple-sitemap", "@nuxtjs/sitemap"]
            has_sitemap_config = any(sp in deps for sp in sitemap_packages)
        except Exception:
            pass

    if not any(s.exists() for s in sitemap_candidates) and not has_sitemap_config:
        issues.append({
            "severity": WARNING,
            "rule": "missing-sitemap",
            "message": "No sitemap.xml found and no sitemap generation package detected. Sitemaps help search engines discover all your pages.",
            "file": str(project),
        })

    return issues


# ---------------------------------------------------------------------------
# Main scanner
# ---------------------------------------------------------------------------

SCANNABLE_EXTENSIONS = {".html", ".htm", ".jsx", ".tsx", ".vue", ".svelte", ".astro"}

SKIP_DIRS = {"node_modules", ".git", ".next", ".nuxt", ".output", "dist", "build", "__pycache__", ".cache", ".svelte-kit"}


def scan_file(filepath):
    """Run all checks on a single file."""
    try:
        content = Path(filepath).read_text(errors="replace")
    except Exception as e:
        return [{"severity": WARNING, "rule": "file-read-error", "message": str(e), "file": filepath}]

    tags = extract_tags(content)

    all_issues = []
    checks = [
        check_title,
        check_meta_description,
        check_viewport,
        check_html_lang,
        check_canonical,
        check_headings,
        check_images,
        check_open_graph,
        check_twitter_cards,
        check_structured_data,
        check_semantic_html,
        check_links,
        check_scripts,
        check_noindex,
    ]

    for check_fn in checks:
        all_issues.extend(check_fn(str(filepath), content, tags))

    return all_issues


def scan_project(project_path):
    """Scan all scannable files in a project directory."""
    project = Path(project_path)
    all_issues = []
    files_scanned = []

    if project.is_file():
        files_scanned.append(str(project))
        all_issues.extend(scan_file(project))
    else:
        for root, dirs, files in os.walk(project):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            for f in sorted(files):
                ext = Path(f).suffix.lower()
                if ext in SCANNABLE_EXTENSIONS:
                    full_path = os.path.join(root, f)
                    files_scanned.append(full_path)
                    all_issues.extend(scan_file(full_path))

        # Project-level checks
        all_issues.extend(check_project_files(project_path))

    # Organize by severity
    report = {
        "project": str(project_path),
        "files_scanned": len(files_scanned),
        "total_issues": len(all_issues),
        "by_severity": {
            "critical": [i for i in all_issues if i["severity"] == CRITICAL],
            "warning": [i for i in all_issues if i["severity"] == WARNING],
            "info": [i for i in all_issues if i["severity"] == INFO],
        },
        "summary": {
            "critical_count": sum(1 for i in all_issues if i["severity"] == CRITICAL),
            "warning_count": sum(1 for i in all_issues if i["severity"] == WARNING),
            "info_count": sum(1 for i in all_issues if i["severity"] == INFO),
        },
        "files": files_scanned,
    }

    return report


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analyze_seo.py <path-to-project-or-file>")
        sys.exit(1)

    target = sys.argv[1]
    if not os.path.exists(target):
        print(f"Error: '{target}' does not exist.")
        sys.exit(1)

    report = scan_project(target)

    print(json.dumps(report, indent=2))

    # Summary to stderr for quick glance
    s = report["summary"]
    print(f"\n--- SEO Scan Summary ---", file=sys.stderr)
    print(f"Files scanned: {report['files_scanned']}", file=sys.stderr)
    print(f"Critical: {s['critical_count']}  |  Warnings: {s['warning_count']}  |  Info: {s['info_count']}", file=sys.stderr)