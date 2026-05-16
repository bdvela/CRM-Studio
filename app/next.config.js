const { withSerwist } = require('@serwist/turbopack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

module.exports = withSerwist(nextConfig);
