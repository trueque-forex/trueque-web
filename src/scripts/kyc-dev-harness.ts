// scripts/kyc-dev-harness.ts
// Usage: node ./scripts/kyc-dev-harness.ts <sessionIdOrBearerToken> [--base http://localhost:3000]
// This script calls /api/kyc/status and prints the response, helpful for local dev and CI.
/**
 * Dev harness for testing KYC status.
 * Usage:
 *   npm run kyc:harness -- <userId> --base http://localhost:3000
 * Requires:
 *   - Next dev server running
 *   - DEV_API_TOKEN set in .env for authenticated requests
 */
import fetch from 'node-fetch';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/kyc-dev-harness.js <sessionIdOrBearerToken> [--base http://localhost:3000]');
    process.exit(2);
  }

  let sessionToken = args[0];
  const baseFlagIndex = args.indexOf('--base');
  const base = baseFlagIndex >= 0 && args[baseFlagIndex + 1] ? args[baseFlagIndex + 1] : 'http://localhost:3000';

  const url = `${base.replace(/\/$/, '')}/api/kyc/status`;
  console.log('Calling', url);

  // Try Bearer authorization first, fall back to cookie if token looks like a cookie
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (sessionToken.includes('=')) {
    // cookie-like token
    headers['Cookie'] = sessionToken;
  } else {
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  try {
    const res = await fetch(url, { method: 'GET', headers });
    const text = await res.text();
    console.log('Status:', res.status);
    try {
      console.log('Body:', JSON.parse(text));
    } catch {
      console.log('Body (raw):', text);
    }
  } catch (err) {
    console.error('Request failed:', err);
  }
}
{	
  main();
}
