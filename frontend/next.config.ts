import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lotusandlion.in' },
      { protocol: 'https', hostname: 'www.lotusandlion.in' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
  
  // Performance & Caching Optimization
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // ISR (Incremental Static Regeneration) for better cache
  staticPageGenerationTimeout: 60,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  // Optimize bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          cacheGroups: {
            default: false,
            vendors: false,
            vendor: {
              filename: 'chunks/vendor.js',
              test: /node_modules/,
              name: 'vendor',
              chunks: 'all',
              reuseExistingChunk: true,
              priority: 20
            },
            common: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              name: 'common'
            }
          }
        }
      };
    }
    return config;
  },
};

export default nextConfig;

