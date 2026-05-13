/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  env: {
    // Point to auth-service directly in dev (port 3001).
    // In production set NEXT_PUBLIC_API_URL=https://api.auralux.io
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.saavncdn.com' },
      { protocol: 'https', hostname: '**.scdn.co' },
      { protocol: 'https', hostname: '**.mzstatic.com' },
      { protocol: 'https', hostname: 'cdn.auralux.io' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/gateway/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'}/:path*`,
        },
      ],
      fallback: [],
    };
  },
};

module.exports = nextConfig;

