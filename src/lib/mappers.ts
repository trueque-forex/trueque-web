/**
 * src/lib/mappers.ts
 * "No Noise" Version: Maps Legacy DB -> Symmetri UI
 */

// --- 1. USER MAPPER ---
export interface UserDB {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  symmetri_id: string | null; 
  country: string;
  status: string;           // DB Truth: 'status' (legacy)
  phone_number: string;
  created_at: string;
  user_type: string;
  symmetriId?: string;
  tid?: string;
}

export function mapUserToUI(row: UserDB) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    symmetriId: row.symmetri_id || row.symmetriId || "NOT_ISSUED",
    tradeMaskSid: row.tid || "NOT_ISSUED",
    countryCode: row.country || "US",
    // UI expects 'kycStatus', mapped from DB 'status'
    kycStatus: (row.status || "incomplete").toUpperCase(), 
    userType: (row.user_type || 'PEER') as 'PEER' | 'MERCHANT' | 'ADMIN',
    phone: row.phone_number || "",
    joinedAt: new Date(row.created_at).toISOString(),
  };
}

// --- 2. TRANSACTION MAPPER ---
export interface TransactionDB {
  id: string;
  owner_id: string;         // DB Truth: 'owner_id' (legacy)
  amount: number;
  currency: string;
  status: string;           // DB Truth: 'status' (legacy)
  type: string;
  vendor_id?: string;       // New Symmetri Slot
  payout_rail?: string;     // New Symmetri Slot
  created_at: string;
  handshake_expires_at: string; // New Symmetri Slot
  beneficiary_id: string;
}

export function mapTransactionToUI(row: TransactionDB) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.owner_id,     // Map 'owner_id' -> 'userId'
    amountSend: Number(row.amount),
    currency: row.currency,
    status: (row.status || "pending").toLowerCase(), 
    type: row.type,
    isSynthetic: row.type === 'SYNTHETIC',
    vendorId: row.vendor_id,
    payoutRail: row.payout_rail || "BANK_RTP",
    // The UI needs this to start the countdown:
    expiresAt: row.handshake_expires_at, 
    date: new Date(row.created_at).toISOString(),
    beneficiaryId: row.beneficiary_id,
  };
}

// --- 3. BENEFICIARY MAPPER ---
export interface BeneficiaryDB {
  id: string;
  first_name: string;
  last_name: string;
  bank_name: string;
  account_number: string;
  currency: string;
  is_active: boolean;
}

export function mapBeneficiaryToUI(row: BeneficiaryDB) {
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    currency: row.currency,
    isActive: row.is_active,
    fullName: `${row.first_name} ${row.last_name}`.trim(),
  };
}