import { AuditPreview, validateAuditPreview } from '../schemas/AuditPreviewSchema';

const aliceToMexico: AuditPreview = {
  senderIntent: {
    name: 'Alice',
    originCurrency: 'USD',
    kycId: 'US-AL-2025-001',
    contact: 'alice@example.com',
  },
  receiverIntent: {
    name: 'Lucía',
    method: 'bank:Banorte:12345678',
    country: 'Mexico',
    kycId: 'MX-LC-2025-001',
  },
  corridor: 'USD→MXP',
  fallbackAcknowledged: false,
  compliance: {
    sanctionsScreened: true,
    transactionLimitOk: true,
    sourceOfFundsVerified: true,
  },
  timestamp: new Date().toISOString(),
};

const bobToUS: AuditPreview = {
  senderIntent: {
    name: 'Bob',
    originCurrency: 'MXP',
    kycId: 'MX-BO-2025-002',
    contact: 'bob@example.mx',
  },
  receiverIntent: {
    name: 'James',
    method: 'phone:+1-555-1234',
    country: 'United States',
    kycId: 'US-JM-2025-002',
  },
  corridor: 'MXP→USD',
  fallbackAcknowledged: false,
  compliance: {
    sanctionsScreened: true,
    transactionLimitOk: true,
    sourceOfFundsVerified: true,
  },
  timestamp: new Date().toISOString(),
};

console.log('🧪 Alice → Mexico:', validateAuditPreview(aliceToMexico));
console.log('🧪 Bob → U.S.:', validateAuditPreview(bobToUS));