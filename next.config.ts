import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Optimization for performance - ENHANCED */
  
  // Image optimization - AGGRESSIVE
  images: {
    unoptimized: false, // Enable Next.js image optimization
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [], // Add external domains if needed
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year - images rarely change
  },

  // Compression and performance
  compress: true,

  // Production source maps in production (reduces bundle size)
  productionBrowserSourceMaps: false,
  
  // Enable SWR (Stale While Revalidate) for API routes
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react'],
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, s-maxage=60, stale-while-revalidate=120',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },

  // Redirect old paths if needed
  async redirects() {
    return [];
  },
};

export default nextConfig;
