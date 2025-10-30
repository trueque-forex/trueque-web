// src/types.ts
export type Beneficiary = {
  id?: string;
  userId?: string;
  name: string;
  phone?: string;
  accountType?: string;
  accountIdentifier?: string;
  email?: string;
  createdAt?: string;
};

export type AuditEntry = {
  id: string;
  corridor: string;
  executionModel: 'OM' | 'TBM';
  senderCountry: string;
  receiverCountry: string;
  senderBeneficiary: string;
  receiverBeneficiary: string;
  timestamp: string;
};

// harmless default for any default imports
const _default = {};
export default _default;