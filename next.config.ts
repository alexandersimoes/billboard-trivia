import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/billboard-trivia',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
