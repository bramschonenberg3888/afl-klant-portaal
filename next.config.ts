import type { NextConfig } from 'next';
import './src/env';

const nextConfig: NextConfig = {
  transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core'],
  serverExternalPackages: ['jsdom'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.logistiekconcurrent.nl',
        pathname: '/media/**',
      },
    ],
  },
};

export default nextConfig;
