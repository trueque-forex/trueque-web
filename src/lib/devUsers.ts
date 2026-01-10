// lib/devUsers.ts
// In-memory dev users for local testing only. Load in development server runtime.

export const DEV_USERS = {
  'test@example.com': {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    full_name: 'Test User',
    passwordHash: '$2b$12$Ox2TASo9p/JhW2qAt7JDf.ZHQQZh4Ow6ST/5TWYAQh6p/.G0Sr5cy',
    mfa_enabled: true,
    tid: '00000000-0000-0000-0000-000000000100',
    created_at: new Date().toISOString(),
    is_test: true
  },

  'joao.teste@trueque.dev': {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'joao.teste@trueque.dev',
    full_name: 'Joao Teste',
    // bcrypt hash for plaintext 'jt123456'
    passwordHash: '$2b$12$HQC8V.RY/YXZ2HG/mL0IoeA1oP6RaUqSonBfZWQqUfsU7poVC6e2G',
    mfa_enabled: true,
    tid: 'TDEV000111',
    created_at: new Date().toISOString(),
    kyc_status: 'approved',
    // Mock profile data for auto-fill
    address: 'Av. Paulista 1000',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-100',
    dob: '1990-01-01', // Mock DOB for recovery
    country: 'Brazil',
    phone: '+55 11 99999-9999',
    document_number: '123456789', // Last 4: 6789
    is_test: true
  }
};

if (typeof global !== 'undefined') {
  (global as any).__DEV_USERS = (global as any).__DEV_USERS || DEV_USERS;
}
export default DEV_USERS;