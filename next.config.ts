import type { NextConfig } from "next";

const enableStandaloneOutput = process.env.NEXT_OUTPUT_STANDALONE === '1';

const nextConfig: NextConfig = {
  // Enable standalone output only when explicitly requested (e.g. Docker build)
  ...(enableStandaloneOutput && { output: 'standalone' }),
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
  },
  
  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' && {
    productionBrowserSourceMaps: false,
  }),
};

export default nextConfig;
