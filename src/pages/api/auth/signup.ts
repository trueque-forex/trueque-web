// src/pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from 'next';
<<<<<<< HEAD

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, password } = JSON.parse(req.body || '{}');
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' });

    // TODO: create user, set cookie/session here
    // Simulate: new users need KYC review
    return res.status(201).json({ needsKyc: true, kycStatus: 'pending' });
  } catch (e: any) {
    return res.status(500).json({ error: 'internal_error' });
=======
import getKnex from '../../../lib/db';
import { buildTidAndReserve } from '../../../lib/buildTID'; // corrected relative path to src/lib/buildTID.ts

async function createUserTransaction(db: any, payload: any) {
  const {
    email,
    firstName,
    lastName,
    dob,
    countryOfResidence,
    countryDestiny,
    address,
    beneficiary,
    isDev,
  } = payload;

  return await db.transaction(async (tx: any) => {
    if (isDev) {
      await tx('beneficiaries').where({ email }).del().catch(() => {});
      await tx('users').where({ email }).del().catch(() => {});
    }

    const toInsert = {
      first_name: firstName || null,
      last_name: lastName || null,
      email: email || null,
      dob: dob || null,
      country_of_residence: countryOfResidence || null,
      country_destiny: countryDestiny || null,
      address: address || null,
      is_test: isDev ? true : false,
      created_at: new Date(),
    };

    // Insert user and get id and created_at back in the same transaction
    const insertResult = await tx('users').insert(toInsert).returning(['id', 'created_at']);
    const inserted = Array.isArray(insertResult) ? (insertResult[0] ?? insertResult) : insertResult;
    const newId = inserted.id ?? inserted;
    const createdAt = (inserted.created_at && new Date(inserted.created_at)) || new Date();

    // Build canonical TID when not dev. Reserve sequence and set tid inside same transaction.
    let tid: string;
    if (isDev) {
      // preserve simple dev tid pattern (pad numeric id for readability)
      tid = `TDEV${String(newId).padStart(6, '0')}`;
    } else {
      // country code must be 2-letter ISO; fall back to 'XX' if missing
      const country = (countryOfResidence || 'XX').toString().toUpperCase().slice(0, 2);
      // buildTidAndReserve is expected to run using the same transaction (tx)
      tid = await buildTidAndReserve(tx, createdAt, country);
    }

    await tx('users').where({ id: newId }).update({ tid });

    if (beneficiary?.name && beneficiary?.account) {
      await tx('beneficiaries').insert({
        user_id: newId,
        name: beneficiary.name,
        account_type: beneficiary.type || 'bank',
        account_identifier: beneficiary.account,
        email,
      });
    }

    // Return full user row fields we want the API to expose
    const [userRow] = await tx('users')
      .select('id', 'email', 'first_name', 'last_name', 'tid', 'created_at', 'country_of_residence')
      .where({ id: newId })
      .limit(1);
    return userRow;
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });

  const db = getKnex();

  const bodyRaw = req.body;

  const parsedBody: any = (() => {
    if (bodyRaw == null) return bodyRaw;
    if (typeof bodyRaw === 'object') return bodyRaw;
    if (typeof bodyRaw === 'string') {
      try {
        const first = JSON.parse(bodyRaw);
        if (typeof first === 'string') {
          try {
            return JSON.parse(first);
          } catch {
            return first;
          }
        }
        return first;
      } catch {
        return bodyRaw;
      }
    }
    return bodyRaw;
  })();

  const {
    email,
    password,
    address,
    beneficiary,
    is_test,
    first_name,
    last_name,
    dob,
    country_of_residence,
    country_destiny,
    firstName: bodyFirstName,
    lastName: bodyLastName,
    countryOfResidence: bodyCountryOfResidence,
    countryDestiny: bodyCountryDestiny,
    isTest: bodyIsTest,
  } = parsedBody || {};

  const firstName = first_name ?? bodyFirstName ?? null;
  const lastName = last_name ?? bodyLastName ?? null;
  const countryOfResidence = country_of_residence ?? bodyCountryOfResidence ?? null;
  const countryDestiny = country_destiny ?? bodyCountryDestiny ?? null;
  const isDevFlag =
    typeof is_test !== 'undefined' ? is_test : typeof bodyIsTest !== 'undefined' ? bodyIsTest : undefined;

  if (!email) return res.status(400).json({ ok: false, error: 'email_required' });

  const payloadForInsert = {
    email,
    firstName,
    lastName,
    dob,
    countryOfResidence,
    countryDestiny,
    address,
    beneficiary,
    isDev: process.env.NODE_ENV === 'development' ? true : isDevFlag === true,
  };

  try {
    const user = await createUserTransaction(db, payloadForInsert);
    // Return the created user object including canonical tid
    return res.status(201).json({ ok: true, user });
  } catch (err: any) {
    console.error('signup create error', err);
    return res
      .status(500)
      .json({ ok: false, error: 'create_failed', detail: String(err?.message || err) });
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  }
}