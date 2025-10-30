// src/server/kyc/generateTruequeId.ts
// Minimal development implementation of generateTruequeId
// Keeps a predictable format and is safe for dev harness runs.
// TODO: Replace with production-grade Trueque ID generator

export function generateTruequeId(): string {
  const now = Date.now();
  const random = Math.floor(Math.random() * 1e6).toString(36).padStart(4, '0');
  return `TQ-${now.toString(36)}-${random}`.toUpperCase();
}	
