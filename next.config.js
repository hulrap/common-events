/** @type {import('next').NextConfig} */

// Get the site domain from environment variable, with fallback for local dev
const siteDomain = process.env.SITE_DOMAIN || 'localhost';

const nextConfig = {
  reactStrictMode: true,

  // Standalone output for Docker deployment
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        // Self-hosted storage (MinIO via Caddy proxy)
        protocol: 'https',
        hostname: siteDomain,
        pathname: '/storage/**',
      },
      {
        // Google Maps images
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
      {
        // Google user content
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            // Updated CSP for self-hosted setup
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.googleapis.com https://*.google.com https://*.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.google.com https://*.gstatic.com",
              "img-src 'self' blob: data: https://*.googleapis.com https://*.google.com https://*.gstatic.com https://*.googleusercontent.com",
              "font-src 'self' https://*.gstatic.com",
              "connect-src 'self' data: https://*.googleapis.com https://*.google.com https://*.gstatic.com",
              "frame-src 'self' https://*.google.com",
              "worker-src 'self' blob:",
            ].join("; ")
          }
        ]
      }
    ];
  },
};

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

module.exports = withPWA(nextConfig);
