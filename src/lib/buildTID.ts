// File: lib/buildTid.ts
// Usage: import { buildTidAndReserve } from '../lib/buildTid';
import crc from 'crc';
import { v4 as uuidv4 } from 'uuid';
import knex from './db'; // adjust path to your knex instance

async function nextSeqForDayCountry(trx: any, day: string, country: string): Promise<number> {
  const row = await trx('tid_counters').where({ day, country_code: country }).forUpdate().first();
  if (row) {
    const next = row.seq + 1;
    await trx('tid_counters').where({ day, country_code: country }).update({ seq: next });
    return next;
  } else {
    await trx('tid_counters').insert({ day, country_code: country, seq: 1 });
    return 1;
  }
}

function formatBaseTid(date: Date, country: string, seq: number, pad = 4) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const ymd = `${y}${m}${d}`;
  const seqStr = String(seq).padStart(pad, '0');
  return `T${ymd}${country}${seqStr}`;
}

function checksumFor(base: string) {
  const value = crc.crc16(Buffer.from(base)) & 0xffff;
  return value.toString(16).toUpperCase().padStart(4, '0');
}

export async function buildTidAndReserve(trx: any, date: Date, country: string): Promise<string> {
  const day = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const seq = await nextSeqForDayCountry(trx, day, country);
  const base = formatBaseTid(date, country, seq);
  const chk = checksumFor(base);
  return `${base}-${chk}`;
}

// Fallback helper used only in exceptional/debug cases
export function debugTidFromUuid(date = new Date(), country = 'XX') {
  return `TDEV${uuidv4()}`;
}