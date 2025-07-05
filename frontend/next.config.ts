import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  generateEtags: false,
  compress: false,
  experimental: {
    turbo: undefined,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Additional API route configuration for body size limit
  async rewrites() {
    return [];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Length",
            value: "10485760", // 10MB in bytes
          },
        ],
      },
    ];
  },
};

export default nextConfig;
