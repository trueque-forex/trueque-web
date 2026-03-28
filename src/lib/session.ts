// src/lib/session.ts
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { decrypt as decryptData } from './crypto';
import { TruequeSession } from '../types/auth'; // IMPORT SHARED TYPE

const SECRET_KEY = process.env.SESSION_SECRET || 'default_local_secret_change_me_in_prod';
const key = new TextEncoder().encode(SECRET_KEY);

// 2. ENCRYPT
export async function encrypt(payload: TruequeSession) {
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setJti(uuidv4())
    .sign(key);
}

// 3. DECRYPT
export async function decrypt(input: string): Promise<TruequeSession | null> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    return payload as unknown as TruequeSession;
  } catch (error) {
    return null;
  }
}

// 4. COOKIE HELPERS
export function setSessionCookie(res: NextApiResponse, token: string) {
  const cookie = serialize('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax',
  });
  res.setHeader('Set-Cookie', cookie);
}

export function destroySession(res: NextApiResponse) {
  const cookieOpts: any = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  };

  res.setHeader('Set-Cookie', [
    serialize('session', '', cookieOpts),
    serialize('trueque_sid', '', cookieOpts)
  ]);
}

// 5. SESSION CREATION
// We accept a partial user, but we MUST ensure it matches SessionUser strictness
// 5. SESSION CREATION
// We accept a partial user, but we MUST ensure it matches SessionUser strictness
export async function createSession(user: any, mfaVerified = false) {

  // SANITIZATION STEP:
  // We manually pick fields to ensure no hidden functions (like .save() or .update())
  // from the database object get passed to the JWT generator.

  // STRICT VALIDATION: Ensure ID is present. 
  // We do NOT allow "sub" fallback here. The caller must normalize the user object.
  const userId = user.id;
  if (!userId) {
    console.warn('[createSession] Missing user.id', user);
    throw new Error('createSession requires user.id');
  }

  const cleanUser: TruequeSession['user'] = {
    id: String(userId),
    email: user.email,
    // Map snake_case (DB) to camelCase (Session) if needed, but prefer explicit inputs.
    kycStatus: user.kyc_status || user.kycStatus || 'NONE',
    userType: (user.user_type === 'MERCHANT' || user.userType === 'MERCHANT') ? 'MERCHANT' : 'PEER',
    tid: user.tid,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    name: user.name || [user.first_name || user.firstName, user.last_name || user.lastName].filter(Boolean).join(' '),
    txCount: user.tx_count || user.txCount || 0,
    phone: decryptData(user.phone_number || user.phone) || '',
    country: user.country || user.country_of_residence || '',
    street_address: decryptData(user.street_address || user.address) || '',
    city: user.city || '',
    state: user.state || user.state_province || '',
    postalCode: user.postal_code || user.postalCode || ''
  };

  const sessionData: TruequeSession = {
    user: cleanUser,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    mfaVerified
  };

  // Now we are safe to encrypt because cleanUser is pure JSON.
  return await encrypt(sessionData);
}

// 6. GET SESSION
export async function getSession(tokenOrReq: string | any): Promise<TruequeSession | null> {
  let token = tokenOrReq;
  // Adapter: handle request object
  if (typeof tokenOrReq === 'object' && tokenOrReq.cookies) {
    token = tokenOrReq.cookies.session || tokenOrReq.cookies.trueque_sid;
  }

  if (!token || typeof token !== 'string') return null;
  return await decrypt(token);
}

// Added back for MFA/Totp flows
export async function getSessionById(cookieString: string | null): Promise<{ userId: string } | null> {
  if (!cookieString) return null;
  // Try both cookie names
  let match = cookieString.match(/session=([^;]+)/);
  if (!match) match = cookieString.match(/trueque_sid=([^;]+)/);

  const val = match ? match[1] : null;
  if (!val) return null;

  const sess = await decrypt(val);
  return sess ? { userId: sess.user.id } : null;
}