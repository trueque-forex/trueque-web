// src/lib/mfaServices.ts
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import getKnex from './db';
import { encryptSecret, decryptSecret } from './mfaCrypto';

const RECOVERY_COUNT = 8;
const BCRYPT_ROUNDS = Number(process.env.MFA_BCRYPT_ROUNDS || 12);

function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < RECOVERY_COUNT; i++) {
    const raw = uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export async function startTotpSetup(userId: string, email: string) {
  const knex: any = getKnex();
  const secret = speakeasy.generateSecret({ length: 20, name: `Trueque:${email}`, issuer: 'Trueque' });
  const encrypted = encryptSecret(secret.base32);

  try {
    if (typeof knex === 'function' || typeof (knex as any).insert === 'function') {
      await knex('mfa_attempts').insert({ user_id: userId, event_type: 'setup', success: false });
    } else if (typeof knex.query === 'function') {
      await knex.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
        userId,
        'setup',
        false,
      ]);
    }
  } catch (err) {
    console.error('mfa.startTotpSetup audit insert failed', err);
  }

  const otpauth = secret.otpauth_url;
  const qrDataUrl = await qrcode.toDataURL(otpauth);

  return { secretBase32: secret.base32, otpauth, qrDataUrl, secretEncrypted: encrypted };
}

export type ConfirmSetupResult = { ok: boolean; recoveryCodes?: string[] };

export async function confirmTotpSetup(
  userId: string,
  providedToken: string,
  secretBase32Plain: string
): Promise<ConfirmSetupResult> {
  const knex: any = getKnex();
  const verified = speakeasy.totp.verify({
    secret: secretBase32Plain,
    encoding: 'base32',
    token: providedToken,
    window: 1,
  });

  if (!verified) {
    try {
      if (typeof knex === 'function' || typeof (knex as any).insert === 'function') {
        await knex('mfa_attempts').insert({ user_id: userId, event_type: 'verify', success: false });
      } else if (typeof knex.query === 'function') {
        await knex.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
          userId,
          'verify',
          false,
        ]);
      }
    } catch (e) {
      console.error('mfa.confirmTotpSetup failed to log failed verify attempt', e);
    }
    return { ok: false };
  }

  const recoveryCodes = generateRecoveryCodes();
  const hashed = await Promise.all(recoveryCodes.map((c) => bcrypt.hash(c, BCRYPT_ROUNDS)));
  const encrypted = encryptSecret(secretBase32Plain);

  if (typeof knex.transaction === 'function') {
    await knex.transaction(async (trx: any) => {
      await trx('mfa_totp')
        .insert({
          user_id: userId,
          secret_encrypted: encrypted,
          created_at: trx.fn && trx.fn.now ? trx.fn.now() : new Date(),
        })
        .onConflict('user_id')
        .merge({ secret_encrypted: encrypted, created_at: trx.fn && trx.fn.now ? trx.fn.now() : new Date() });

      await trx('mfa_recovery_codes').where({ user_id: userId }).del();
      const inserts = hashed.map((h) => ({ user_id: userId, code_hash: h }));
      if (inserts.length) await trx('mfa_recovery_codes').insert(inserts);

      await trx('users').where({ id: userId }).update({ mfa_enabled: true, mfa_method: 'totp' });

      await trx('mfa_attempts').insert({ user_id: userId, event_type: 'verify', success: true });
    });
  } else if (typeof knex.query === 'function') {
    const client = await (knex as any).connect?.() ?? null;
    if (client) {
      try {
        await client.query('BEGIN');

        await client.query(
          `INSERT INTO mfa_totp (user_id, secret_encrypted, created_at)
           VALUES ($1,$2,now())
           ON CONFLICT (user_id) DO UPDATE SET secret_encrypted = EXCLUDED.secret_encrypted, created_at = EXCLUDED.created_at`,
          [userId, encrypted]
        );

        await client.query('DELETE FROM mfa_recovery_codes WHERE user_id = $1', [userId]);
        for (const h of hashed) {
          await client.query('INSERT INTO mfa_recovery_codes (user_id, code_hash) VALUES ($1,$2)', [userId, h]);
        }

        await client.query('UPDATE users SET mfa_enabled = true, mfa_method = $2 WHERE id = $1', [userId, 'totp']);

        await client.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
          userId,
          'verify',
          true,
        ]);

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release?.();
      }
    } else {
      throw new Error('DB client does not support transaction');
    }
  } else {
    throw new Error('Unsupported DB client');
  }

  return { ok: true, recoveryCodes };
}

export async function verifyTotpChallenge(userId: string, token: string): Promise<{ ok: boolean; reason?: string }> {
  const knex: any = getKnex();
  let row: any = null;

  if (typeof knex === 'function' || typeof (knex as any).where === 'function') {
    row = await knex('mfa_totp').where({ user_id: userId }).first();
  } else if (typeof knex.query === 'function') {
    const r = await knex.query('SELECT * FROM mfa_totp WHERE user_id = $1 LIMIT 1', [userId]);
    row = r?.rows?.[0] ?? null;
  }

  if (!row) {
    try {
      if (typeof knex === 'function' || typeof (knex as any).insert === 'function') {
        await knex('mfa_attempts').insert({ user_id: userId, event_type: 'challenge', success: false });
      } else if (typeof knex.query === 'function') {
        await knex.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
          userId,
          'challenge',
          false,
        ]);
      }
    } catch (e) {
      console.error('mfa.verifyTotpChallenge audit insert failed', e);
    }
    return { ok: false, reason: 'no_mfa' };
  }

  let secret: string;
  try {
    secret = decryptSecret(row.secret_encrypted);
  } catch (e) {
    console.error('mfa.verifyTotpChallenge decrypt failed', e);
    return { ok: false, reason: 'decrypt_failed' };
  }

  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });

  try {
    if (typeof knex === 'function' || typeof (knex as any).insert === 'function') {
      await knex('mfa_attempts').insert({ user_id: userId, event_type: 'challenge', success: !!verified });
    } else if (typeof knex.query === 'function') {
      await knex.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
        userId,
        'challenge',
        !!verified,
      ]);
    }
  } catch (e) {
    console.error('mfa.verifyTotpChallenge audit insert failed', e);
  }

  if (verified) {
    try {
      if (typeof knex === 'function' || typeof (knex as any).where === 'function') {
        await knex('mfa_totp')
          .where({ user_id: userId })
          .update({ last_used_at: (knex as any).fn && (knex as any).fn.now ? (knex as any).fn.now() : new Date() });
      } else if (typeof knex.query === 'function') {
        await knex.query('UPDATE mfa_totp SET last_used_at = now() WHERE user_id = $1', [userId]);
      }
    } catch (e) {
      console.error('mfa.verifyTotpChallenge update last_used_at failed', e);
    }
  }

  return { ok: !!verified };
}

export async function verifyRecoveryCode(userId: string, code: string): Promise<{ ok: boolean }> {
  const knex: any = getKnex();

  let rows: any[] = [];
  if (typeof knex === 'function' || typeof (knex as any).where === 'function') {
    rows = await knex('mfa_recovery_codes').where({ user_id: userId, used: false }).orderBy('created_at', 'asc');
  } else if (typeof knex.query === 'function') {
    const r = await knex.query(
      'SELECT * FROM mfa_recovery_codes WHERE user_id = $1 AND used = false ORDER BY created_at ASC',
      [userId]
    );
    rows = r?.rows ?? [];
  }

  for (const row of rows) {
    const match = await bcrypt.compare(code, row.code_hash);
    if (match) {
      if (typeof knex === 'function' || typeof (knex as any).where === 'function') {
        await knex('mfa_recovery_codes').where({ id: row.id }).update({ used: true });
        await knex('mfa_attempts').insert({ user_id: userId, event_type: 'recovery', success: true });
      } else if (typeof knex.query === 'function') {
        await knex.query('UPDATE mfa_recovery_codes SET used = true WHERE id = $1', [row.id]);
        await knex.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
          userId,
          'recovery',
          true,
        ]);
      }
      return { ok: true };
    }
  }

  try {
    if (typeof knex === 'function' || typeof (knex as any).insert === 'function') {
      await knex('mfa_attempts').insert({ user_id: userId, event_type: 'recovery', success: false });
    } else if (typeof knex.query === 'function') {
      await knex.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
        userId,
        'recovery',
        false,
      ]);
    }
  } catch (e) {
    console.error('mfa.verifyRecoveryCode audit insert failed', e);
  }

  return { ok: false };
}

export async function disableMfa(userId: string) {
  const knex: any = getKnex();
  if (typeof knex.transaction === 'function') {
    await knex.transaction(async (trx: any) => {
      await trx('mfa_totp').where({ user_id: userId }).del();
      await trx('mfa_recovery_codes').where({ user_id: userId }).del();
      await trx('users').where({ id: userId }).update({ mfa_enabled: false, mfa_method: null });
      await trx('mfa_attempts').insert({ user_id: userId, event_type: 'disable', success: true });
    });
  } else if (typeof knex.query === 'function') {
    const client = await (knex as any).connect?.() ?? null;
    if (client) {
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM mfa_totp WHERE user_id = $1', [userId]);
        await client.query('DELETE FROM mfa_recovery_codes WHERE user_id = $1', [userId]);
        await client.query('UPDATE users SET mfa_enabled = false, mfa_method = NULL WHERE id = $1', [userId]);
        await client.query('INSERT INTO mfa_attempts (user_id, event_type, success) VALUES ($1,$2,$3)', [
          userId,
          'disable',
          true,
        ]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release?.();
      }
    } else {
      throw new Error('DB client does not support transaction');
    }
  } else {
    throw new Error('Unsupported DB client');
  }
}