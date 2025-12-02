/** @type {import('next').NextConfig} */
// Force restart 2
module.exports = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json'
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*'
      }
    ]
  }
};