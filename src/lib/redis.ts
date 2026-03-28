import Redis, { RedisOptions } from 'ioredis';

// Singleton Redis Client for Next.js HMR
// Prevents connection limits and "Connection is closed" errors during dev

const isProduction = process.env.NODE_ENV === 'production';

const redisOptions: RedisOptions = isProduction
  ? { tls: { rejectUnauthorized: false } }
  : {
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
      // Linear backoff: 50ms, 100ms, 150ms... max 2s
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  };

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

// Global declaration to prevent TS errors
declare global {
  var redis: Redis | undefined;
}

let redisClient: Redis;

if (!global.redis) {
  console.log('[REDIS] Initializing New Client:', redisUrl.replace(/:[^:]*@/, ':****@'));
  global.redis = new Redis(redisUrl, redisOptions);

  global.redis.on('error', (err) => {
    if ((err as any).code === 'ECONNREFUSED') {
      // console.warn('[REDIS] Connection refused'); 
    } else {
      console.error('[REDIS] Error:', err);
    }
  });

  global.redis.on('connect', () => {
    console.log('[REDIS] Connected');
  });
}

redisClient = global.redis;

export const redis = redisClient;
