/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ML_API_URL: process.env.ML_API_URL || 'https://insurasphere-ml.onrender.com',
  },
  images: {
    domains: ['localhost', 'insurasphere-ml.onrender.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.ML_API_URL || 'https://insurasphere-ml.onrender.com'}/:path*`,
      },
    ];
  },
}

module.exports = nextConfig 