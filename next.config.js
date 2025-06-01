/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure output directory
  distDir: '.next',
  // Configure image domains if needed
  images: {
    domains: [],
  },
  // Configure source directory
  experimental: {
    appDir: true
  },
  output: 'standalone'
};

module.exports = nextConfig;