export interface AuditPreview {
  senderIntent: {
    name: string;
    originCurrency: 'USD' | 'MXP';
    kycId: string;
    contact: string;
  };
  receiverIntent: {
    name: string;
    method: string; // e.g. phone:+52-555-1234, bank:Banorte:12345678
    country: 'Mexico' | 'United States';
    kycId?: string;
  };
  corridor: 'USD→MXP' | 'MXP→USD';
  fallbackAcknowledged: boolean;
  compliance: {
    sanctionsScreened: boolean;
    transactionLimitOk: boolean;
    sourceOfFundsVerified: boolean;
  };
  timestamp: string; // ISO format
}

export function validateAuditPreview(data: AuditPreview): boolean {
  const { senderIntent, receiverIntent, compliance } = data;

  const validCorridor =
    (senderIntent.originCurrency === 'USD' && receiverIntent.country === 'Mexico') ||
    (senderIntent.originCurrency === 'MXP' && receiverIntent.country === 'United States');

  const validMethod = /^phone:\+\d{1,3}-\d{4,}$|^wallet:0x[a-fA-F0-9]{8,}$|^bank:[A-Za-z]+:\d{6,}$|^card:[A-Za-z]+:\d{12,19}$/.test(
    receiverIntent.method
  );

  const complianceOk =
    compliance.sanctionsScreened &&
    compliance.transactionLimitOk &&
    compliance.sourceOfFundsVerified;

  return validCorridor && validMethod && complianceOk;
}
