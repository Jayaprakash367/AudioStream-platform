/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100',
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
      // beforeFiles: Next.js API routes in app/api are resolved FIRST (filesystem)
      // afterFiles: only proxy non-music gateway calls
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

