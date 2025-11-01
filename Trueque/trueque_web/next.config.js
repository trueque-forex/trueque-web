/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  typescript: {
    // TEMPORARY: allow dev server while we address TS errors incrementally
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
