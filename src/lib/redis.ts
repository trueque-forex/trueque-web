// src/lib/redis.ts
type RedisClient = {
  on: (ev: string, cb: (...args: any[]) => void) => void;
  quit?: () => Promise<void>;
  disconnect?: () => void;
  [k: string]: any;
};

let _redis: RedisClient | null = null;

export function getRedis(): RedisClient | null {
  if (_redis) return _redis;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    // lazy require so bundler doesn't include ioredis in client builds
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const IORedis = require('ioredis');
    const client = new IORedis(url, { lazyConnect: false, connectTimeout: 10000 }) as RedisClient;
    client.on('error', (err: unknown) => {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as any).message : String(err);
      console.warn('[redis] client error:', msg);
    });
    client.on('connect', () => {
      console.debug('[redis] connected');
    });
    client.on('close', () => {
      console.debug('[redis] closed');
    });
    _redis = client;
    return _redis;
  } catch (e: unknown) {
    const msg = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
    console.warn('ioredis not installed or failed to init:', msg);
    return null;
  }
}

export async function closeRedis(): Promise<void> {
  if (!_redis) return;
  try {
    if (typeof _redis.quit === 'function') {
      await _redis.quit();
    } else if (typeof _redis.disconnect === 'function') {
      _redis.disconnect();
    }
  } catch (e: unknown) {
    const msg = (e && typeof e === 'object' && 'message' in e) ? (e as any).message : String(e);
    console.warn('error closing redis client:', msg);
  } finally {
    _redis = null;
  }
}