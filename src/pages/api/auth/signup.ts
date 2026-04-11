import { AppError, ErrorCode } from '../../../lib/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getKnex } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { encrypt, computeBlindIndex } from '../../../lib/crypto';
import { generateMfaToken } from '../../../lib/mfaToken';
import { respondWithSession } from '../../../lib/authResponse';
import { getUtcDate } from '../../../lib/time';
import { generateTruequeId } from '../../../lib/truequeId';
import { mapUserToUI } from '../../../lib/mappers';

// Helper: safe null
const safeNull = (val: any) => (val && val !== '' ? val : null);

async function createUserTransaction(db: any, payload: any) {
  const {
    email,
    password, // Raw password
    firstName,
    lastName,
    country, // Mapped from countryOfResidence/country_of_residence
    street_address, // Mapped from address
    address, // Fallback/Alternate source
    city,
    state, // Mapped from state_province
    state_province, // specific payload field
    postal_code,
    beneficiary,
    phone,
    isDev,
  } = payload;

  return await db.transaction(async (tx: any) => {
    // 1. Check Existence
    if (isDev) {
      try {
        await tx.transaction(async (innerTx: any) => {
          const existing = await innerTx('users').where({ email }).first();
          if (existing) {
            await innerTx('beneficiaries').where({ owner_id: existing.id }).del();
            await innerTx('users').where({ id: existing.id }).del();
          }
        });
      } catch (e) {
        console.warn('Dev cleanup failed', e);
      }
    } else {
      const existing = await tx('users').where({ email }).first();
      if (existing) {
        throw new AppError(ErrorCode.AUTH_USER_ALREADY_EXISTS, 'User already exists', 409);
      }
    }

    // 2. Hash Password
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    // 3. Generate Smart TID (S + YYYYMMDD + CC + RandomSequence)
    const now = getUtcDate();
    const randomSequence = Math.floor(1000 + Math.random() * 8999); // 4 digits
    const tid = generateTruequeId(now, country || 'US', randomSequence);

    // 4. Insert User
    const toInsert = {
      first_name: safeNull(firstName),
      last_name: safeNull(lastName),
      email: safeNull(email),
      phone_number: safeNull(phone) ? encrypt(phone) : null,
      password_hash,
      country: safeNull(country),
      street_address: safeNull(street_address) ? encrypt(street_address) : (safeNull(address) ? encrypt(address) : null), // Prefer street_address, fallback to address
      city: safeNull(city), // Cities usually not encrypted for analytics
      state: safeNull(state) || safeNull(state_province), // Map state_province to state
      postal_code: safeNull(postal_code), // Postcode often kept plain for geo
      kyc_status: 'INCOMPLETE',
      mfa_enabled: false,
      mfa_method: null,
      tid: tid, // AIMED: Included in the initial INSERT
      created_at: getUtcDate(),
    };

    const insertResult = await tx('users').insert(toInsert).returning(['id', 'created_at']);
    const inserted = Array.isArray(insertResult) ? (insertResult[0] ?? insertResult) : insertResult;
    const newId = inserted.id ?? inserted;

    if (!newId) {
      throw new Error("Database insert failed to return ID");
    }

    // (Update logic removed as it's now part of Insert)

    // 5. Insert Beneficiary (if any)
    if (beneficiary?.name && beneficiary?.account) {
      await tx('beneficiaries').insert({
        user_id: newId,
        name: beneficiary.name,
        account_type: beneficiary.type || 'bank',
        account_identifier: beneficiary.account,
        email,
      });
    }

    // 6. Return User Row
    const [userRow] = await tx('users')
      .select('id', 'email', 'first_name', 'last_name', 'tid', 'created_at', 'country', 'kyc_status', 'street_address', 'city', 'state', 'postal_code', 'phone_number') // inclusive select
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
    const bodyRaw = req.body;
    const parsedBody = typeof bodyRaw === 'string' ? JSON.parse(bodyRaw) : bodyRaw;

    // Destructure & Validate (Handle both camelCase and snake_case)
    const {
      email,
      password,
      phone,
      firstName: fnCamel,
      first_name: fnSnake,
      lastName: lnCamel,
      last_name: lnSnake,
      countryOfResidence,
      country_of_residence, // Client sends snake_case
      address,
      beneficiary,
      is_test
    } = parsedBody || {};

    const firstName = fnCamel || fnSnake;
    const lastName = lnCamel || lnSnake;
    const residence = countryOfResidence || country_of_residence;

    // --- RELAXED VALIDATION (Fast Signup Rule) ---
    if (!email) throw new AppError(ErrorCode.BAD_REQUEST, 'Email is required', 400);
    if (!password) throw new AppError(ErrorCode.BAD_REQUEST, 'Password is required', 400);
    if (!firstName) throw new AppError(ErrorCode.BAD_REQUEST, 'First name is required', 400);
    if (!lastName) throw new AppError(ErrorCode.BAD_REQUEST, 'Last name is required', 400);
    if (!phone) throw new AppError(ErrorCode.BAD_REQUEST, 'Phone number is required', 400);
    if (!residence) throw new AppError(ErrorCode.BAD_REQUEST, 'Country of residence is required', 400);

    const payload = {
      ...parsedBody,
      country: residence, // Map resolved residence to 'country' for DB logic
      firstName: firstName, // Use resolved value
      lastName: lastName, // Use resolved value
      isDev: process.env.NODE_ENV === 'development' || is_test === true,
    };

    const user = await createUserTransaction(db, payload);

    if (!user || !user.id) {
      throw new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to create user (No ID returned)', 500);
    }

    // Verify DB Creation
    console.log(`[DB_VERIFY] User created in DB: ${user.email} (ID: ${user.id})`);

    // 7. GENERATE MFA (Restores Console Log)
    await generateMfaToken(user.email);

    // --- A+ REFACTOR: Use Single Source of Truth Mapper ---
    const mappedUser = mapUserToUI(user);

    // SESSION UNIFICATION: Use respondWithSession to ensure cookie structure matches verify.ts
    return await respondWithSession(req, res, mappedUser);

  } catch (err: any) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json(err.toJSON());
    }
    console.error('[SIGNUP] Fatal Error:', err);

    if (err.code === '23505') {
      return res.status(409).json({
        error: {
          code: ErrorCode.AUTH_USER_ALREADY_EXISTS,
          message: 'Account already exists or ID collision. Please try again.',
          detail: err.detail
        }
      });
    }

    return res.status(500).json({
      error: {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        detail: err?.message || 'Unknown error'
      }
    });
  }
}