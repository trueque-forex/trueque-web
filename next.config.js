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

  // ── CORS — allow Flutter web (dev) and mobile clients ──────────────────
  // Production: replace '*' with your actual origin (e.g. 'https://app.symmetri.com')
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ];
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