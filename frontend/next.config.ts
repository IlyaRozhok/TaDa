import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove standalone output for Vercel deployment
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  trailingSlash: false,
  images: {
    // Image optimization is disabled: galleries feed presigned S3 URLs into
    // next/image, and a fresh X-Amz-Signature on every request makes each view
    // a new "source image", so the optimizer never caches and the Vercel quota
    // drained -> HTTP 402 OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED on every
    // <Image>. With unoptimized: true every <Image> renders a plain <img> at
    // the raw src. Revisit once media is served over stable/CDN URLs.
    unoptimized: true,
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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false, // Strict TypeScript checking enabled
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
