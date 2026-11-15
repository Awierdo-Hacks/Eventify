import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
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
    // Provider photos may live on object storage or (v1 data) any https host.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
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
        headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }],
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
