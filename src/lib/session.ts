import Redis from 'redis';
import { promisify } from 'util';
import cookie from 'cookie';
import { v4 as uuidv4 } from 'uuid';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const client = Redis.createClient({ url: redisUrl });
client.connect?.(); // modern redis client supports connect
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createSession(res: any, payload: Record<string, any>) {
  const id = 'sess:' + uuidv4();
  await client.set(id, JSON.stringify(payload), { EX: TTL_SECONDS });
  const cookieValue = id;
  const cookieHeader = cookie.serialize('trueque_session', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL_SECONDS,
  });
  res.setHeader('Set-Cookie', cookieHeader);
  return id;
}

export async function getSession(req: any) {
  const header = req.headers?.cookie;
  if (!header) return null;
  const parsed = cookie.parse(header || '');
  const sid = parsed['trueque_session'];
  if (!sid) return null;
  const raw = await client.get(sid);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function destroySession(req: any, res: any) {
  const header = req.headers?.cookie;
  if (!header) return;
  const parsed = cookie.parse(header || '');
  const sid = parsed['trueque_session'];
  if (!sid) return;
  await client.del(sid);
  res.setHeader('Set-Cookie', cookie.serialize('trueque_session', '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0,
  }));
}