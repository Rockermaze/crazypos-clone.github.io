import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // disable typedRoutes to avoid Link href errors
    typedRoutes: false,
  },
};

export default nextConfig;
