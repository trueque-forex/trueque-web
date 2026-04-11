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
    return {
      // beforeFiles: checked before ANY filesystem lookup (use sparingly)
      beforeFiles: [
        {
          source: '/api/rate/:from/:to',
          destination: 'http://127.0.0.1:8000/api/quotes/rate?from_currency=:from&to_currency=:to'
        },
      ],
      afterFiles: [],
      // fallback: checked LAST — only if no Next.js page/api file matched (including dynamic routes).
      // This ensures all Next.js API routes (including [id].ts dynamic routes) take priority.
      fallback: [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*'
        }
      ]
    };
  }
};