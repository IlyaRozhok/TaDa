import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone", // This is for containerized deployments
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
    unoptimized: true, // Keep this for S3 images
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
