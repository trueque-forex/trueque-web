import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

const cache: Record<string, { rate: number; ts: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

const FALLBACK: Record<string, number> = {
  'USD-MXN': 17.33, 'MXN-USD': 0.0577,
  'USD-EUR': 0.92,  'EUR-USD': 1.087,
  'USD-BRL': 5.10,  'BRL-USD': 0.196,
  'USD-GTQ': 7.75,  'GTQ-USD': 0.129,
};

function httpsGet(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('JSON parse failed')); }
      });
    });
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timed out')); });
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const from = (req.query.from as string || '').toUpperCase();
  const to   = (req.query.to   as string || '').toUpperCase();

  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to query params' });
  }

  const key = `${from}-${to}`;
  const now = Date.now();

  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    const rate = cache[key].rate;
    return res.status(200).json({
      rate: rate.toFixed(4),
      readable: rate < 0.2 ? `1 ${to} ≈ ${(1/rate).toFixed(2)} ${from}` : `1 ${from} ≈ ${rate.toFixed(4)} ${to}`,
    });
  }

  try {
    const data = await httpsGet(`https://open.er-api.com/v6/latest/${from}`);
    if (data?.rates?.[to]) {
      const rate = Number(data.rates[to]);
      if (!isNaN(rate) && rate > 0) {
        cache[key] = { rate, ts: now };
        console.log(`[FX] ${key} = ${rate.toFixed(4)} (open.er-api.com)`);
        const readable = rate < 0.2 ? `1 ${to} ≈ ${(1/rate).toFixed(2)} ${from}` : `1 ${from} ≈ ${rate.toFixed(4)} ${to}`;
        return res.status(200).json({ rate: rate.toFixed(4), readable, fallback: false });
      }
    }
  } catch (err: any) {
    console.warn(`[FX] Live rate failed for ${key}:`, err.message);
  }

  if (FALLBACK[key]) {
    const rate = FALLBACK[key];
    const readable = rate < 0.2 ? `1 ${to} ≈ ${(1/rate).toFixed(2)} ${from}` : `1 ${from} ≈ ${rate.toFixed(4)} ${to}`;
    return res.status(200).json({ rate: rate.toFixed(4), readable, fallback: true });
  }

  return res.status(404).json({ error: `Rate not found for ${key}` });
}
