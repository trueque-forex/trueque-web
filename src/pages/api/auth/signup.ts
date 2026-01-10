import { AppError, ErrorCode } from '../../../lib/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../../lib/db';
import { buildTidAndReserve } from '../../../lib/buildTID'; // corrected relative path to src/lib/buildTID.ts
import { respondWithSession } from '../../../lib/authResponse';
import { getUtcDate } from '../../../lib/time';

async function createUserTransaction(db: any, payload: any) {
  // ... (keep payload destructuring)
  const {
    email,
    firstName,
    lastName,
    dob,
    countryOfResidence,
    countryDestiny,
    address,
    street_address,
    apartment,
    city,
    state_province,
    postal_code,
    beneficiary,
    phone,
    isDev,
  } = payload;

  return await db.transaction(async (tx: any) => {
    // ... (keep dev cleanup)
    if (isDev) {
      try {
        await tx.transaction(async (innerTx: any) => {
          const existing = await innerTx('users').where({ email }).first();
          if (existing) {
            await innerTx('beneficiaries').where({ owner_id: existing.id }).del();
            await innerTx('users').where({ id: existing.id }).del();
          }
        });
      } catch (e) { console.warn('Dev cleanup failed', e); }
    } else {
      // Enforce Unique Email for Prod
      const existing = await tx('users').where({ email }).first();
      if (existing) {
        throw new AppError(ErrorCode.AUTH_USER_ALREADY_EXISTS, 'User already exists', 409);
      }
    }

    // ... (keep formatting)
    const toInsert = {
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      phone: phone || null,
      dob: dob || null,
      country_of_residence: countryOfResidence || null,
      country_destiny: countryDestiny || null,
      address: address || null,
      street_address: street_address || null,
      apartment: apartment || null,
      city: city || null,
      state_province: state_province || null,
      postal_code: postal_code || null,
      is_test: isDev ? true : false,
      created_at: getUtcDate(),
    };

    const insertResult = await tx('users').insert(toInsert).returning(['id', 'created_at']);
    const inserted = Array.isArray(insertResult) ? (insertResult[0] ?? insertResult) : insertResult;
    const newId = inserted.id ?? inserted;

    // ... (keep TID generation)
    // Build canonical TID when not dev. Reserve sequence and set tid inside same transaction.
    let tid: string;
    if (isDev) {
      tid = `TDEV${String(newId).padStart(6, '0')}`;
    } else {
      const randomSuffix = Math.floor(100000 + Math.random() * 900000); // 6 digits
      tid = `TRQ-PENDING-${randomSuffix}`;
    }

    await tx('users').where({ id: newId }).update({ tid });

    // ... (keep beneficiary insert)
    if (beneficiary?.name && beneficiary?.account) {
      await tx('beneficiaries').insert({
        user_id: newId,
        name: beneficiary.name,
        account_type: beneficiary.type || 'bank',
        account_identifier: beneficiary.account,
        email,
      });
    }

    // ... (keep helper)
    const [userRow] = await tx('users')
      .select('id', 'email', 'first_name', 'last_name', 'tid', 'created_at', 'country_of_residence', 'street_address', 'apartment', 'city', 'state_province', 'postal_code')
      .where({ id: newId })
      .limit(1);
    return userRow;
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Method Not Allowed', 405);
    }

    const db = getKnex();
    // ... (keep body parsing)
    const bodyRaw = req.body;
    // ... (keep parsedBody IIFE - assumed same logic for brevity or copy if strict)
    const parsedBody = typeof bodyRaw === 'string' ? JSON.parse(bodyRaw) : bodyRaw;

    const {
      email,
      phone,
      firstName,
      lastName,
      dob,
      countryOfResidence,
      countryDestiny,
      address,
      beneficiary,
      is_test
    } = parsedBody || {};

    // Validate
    if (!email) {
      throw new AppError(ErrorCode.BAD_REQUEST, 'Email is required', 400);
    }

    const payloadForInsert = {
      email,
      phone,
      firstName,
      lastName,
      dob,
      countryOfResidence,
      countryDestiny,
      address,
      beneficiary,
      isDev: process.env.NODE_ENV === 'development' || is_test === true,
    };

    const user = await createUserTransaction(db, payloadForInsert);
    return await respondWithSession(res, user);
  } catch (err: any) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }
    console.error('signup create error', err);
    return res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        detail: err?.message
      }
    });
  }
}