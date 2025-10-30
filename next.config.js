// next.config.js
<<<<<<< HEAD
/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  reactStrictMode: true
}

module.exports = nextConfig
=======
/** Temporarily allow dev server to start while we fix TypeScript errors incrementally */
const baseConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
};

module.exports = {
  ...baseConfig,
  typescript: {
    ignoreBuildErrors: true,
  },
};
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
