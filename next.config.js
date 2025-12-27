const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for self-hosting
  output: 'standalone',
  // Fix workspace root detection
  outputFileTracingRoot: path.join(__dirname),
  // Disable TypeScript checking since we're using JavaScript for backend
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Webpack config to disable source maps in development
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Disable source maps in development
      config.devtool = false;
    }
    return config;
  },
  // Turbopack configuration
  turbopack: {},
  // Note: Source map warnings in development with Turbopack are cosmetic and don't affect functionality
};

module.exports = nextConfig;
