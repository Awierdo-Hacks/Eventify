import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only our own Blob store and the stock photos used in seed/demo data
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Uploaded files are never executed as pages
        source: '/uploads/:path*',
        headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; sandbox" }],
      },
    ];
  },

  productionBrowserSourceMaps: false,
};

export default nextConfig;
