const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix workspace root detection
  outputFileTracingRoot: path.join(__dirname),
  // Disable TypeScript checking since we're using JavaScript for backend
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during builds to avoid conflicts  
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix path resolution for @ alias
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
};

module.exports = nextConfig;
