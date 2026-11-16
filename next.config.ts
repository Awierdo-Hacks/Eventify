import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const analytics = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  ? ' https://www.googletagmanager.com https://*.google-analytics.com'
  : '';

/**
 * Content Security Policy. Scripts may only come from this site (plus the
 * analytics host when one is configured), nothing may frame the site, and
 * forms may only post back to it. Inline scripts are allowed because the
 * framework emits them; moving to nonces is a possible later hardening.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}${analytics}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? ' ws:' : ''}${analytics}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  // Docker builds set this to produce a self-contained server.
  ...(process.env.NEXT_OUTPUT_STANDALONE === '1' && { output: 'standalone' as const }),

  poweredByHeader: false,
  agentRules: false,
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    // Only our own object storage is optimised. Other addresses are rendered
    // directly by <SmartImage>, never fetched by the server.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },

  experimental: {
    // Import only the icons that are used instead of the whole icon set.
    optimizePackageImports: ['lucide-react', 'date-fns', 'radix-ui'],
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // User uploads are served as-is: never let a browser execute them.
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // v1 URLs that moved in v2.
      { source: '/events/new', destination: '/dashboard/events/new', permanent: true },
      { source: '/analyse', destination: '/admin/waitlist', permanent: false },
    ];
  },
};

export default nextConfig;
