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


};

if (typeof global !== 'undefined') {
  (global as any).__DEV_USERS = (global as any).__DEV_USERS || DEV_USERS;
}
export default DEV_USERS;