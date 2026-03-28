// src/lib/mfaToken.ts

// 1. IN-MEMORY STORAGE (The "Vault")
// We use a global Map so codes survive "hot-reloads" while you are coding.
// This acts as our temporary Redis.
const globalMfaStore = global as unknown as { mfaStore: Map<string, { code: string; expires: number }> };
if (!globalMfaStore.mfaStore) {
  globalMfaStore.mfaStore = new Map();
}

/**
 * GENERATE TOKEN
 * Creates a 6-digit code and stores it for 10 minutes.
 */
export async function generateMfaToken(email: string): Promise<string> {
  // Generate random 6-digit string
  const token = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiration (10 minutes from now)
  const expires = Date.now() + 10 * 60 * 1000;

  // Store it in memory
  globalMfaStore.mfaStore.set(email, { code: token, expires });

  // === CRITICAL FOR DEV ===
  // This prints the code to your terminal so you can see it!
  console.log(`\n=============================================`);
  console.log(`🔐 MFA CODE FOR ${email}: ${token}`);
  console.log(`=============================================\n`);

  return token;
}

/**
 * VERIFY TOKEN
 * Checks if the code matches and is valid.
 */
export async function verifyMfaToken(email: string, code: string): Promise<boolean> {
  // Check against the stored record

  const record = globalMfaStore.mfaStore.get(email);

  // 1. Check if record exists
  if (!record) return false;

  // 2. Check for expiration
  if (Date.now() > record.expires) {
    globalMfaStore.mfaStore.delete(email); // Cleanup expired tokens
    return false;
  }

  // 3. Check for match
  if (record.code !== code) {
    return false;
  }

  // 4. Success! Delete the code so it can't be used again (Security)
  globalMfaStore.mfaStore.delete(email);
  return true;
}