// src/lib/TransmitterRegistry.ts

export type Transmitter = {
  id: string;
  name: string;
  country: string;
  licenseId: string;
  supportsModel: ('OM' | 'TBM')[];
  kycCompliant: boolean;
};

export const transmitters: Transmitter[] = [
  {
    id: 'tx-br-001',
    name: 'PagBrasil',
    country: 'Brazil',
    licenseId: 'BR-AML-2025-001',
    supportsModel: ['OM'],
    kycCompliant: true
  },
  {
    id: 'tx-pt-001',
    name: 'EurPay',
    country: 'Portugal',
    licenseId: 'PT-KYC-2025-002',
    supportsModel: ['OM'],
    kycCompliant: true
  },
  {
    id: 'tx-co-001',
    name: 'ColRemit',
    country: 'Colombia',
    licenseId: 'CO-AML-2025-003',
    supportsModel: ['TBM'],
    kycCompliant: true
  },
  {
    id: 'tx-ec-001',
    name: 'EcuTransfer',
    country: 'Ecuador',
    licenseId: 'EC-KYC-2025-004',
    supportsModel: ['TBM'],
    kycCompliant: true
  }
  // Add more transmitters as needed
];
