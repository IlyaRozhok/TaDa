import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone output for Vercel deployment
  // output: "standalone", // This is for containerized deployments only
  poweredByHeader: false,
  generateEtags: false,
  compress: true, // Enable compression for production
  experimental: {
    turbo: undefined,
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // Enable image optimization for Vercel
    unoptimized: false,
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
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
