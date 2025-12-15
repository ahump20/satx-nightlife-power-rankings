import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Static export for Cloudflare Pages
  // API routes will be handled by separate Cloudflare Worker
  trailingSlash: true,
};

export default nextConfig;
