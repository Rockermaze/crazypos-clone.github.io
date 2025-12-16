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
  // Turbopack config placeholder to silence Next 16 warning
  turbopack: {},
};

module.exports = nextConfig;
