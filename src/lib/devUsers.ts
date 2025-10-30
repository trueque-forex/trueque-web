// lib/devUsers.ts
// In-memory dev users for local testing only. Load in development server runtime.

export const DEV_USERS = {
  'test@example.com': {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    full_name: 'Test User',
    // Correct bcrypt hash for 'YourPassword123'
    passwordHash: '$2b$12$68aSmSSlTmAxk9WLh1pPYelQ1gflAmOCxD6eIPK5Z85JMpQQmbHTK',
    mfa_enabled: true,
    tid: '00000000-0000-0000-0000-000000000100',
    created_at: new Date().toISOString()
  }
};

if (typeof global !== 'undefined') {
  (global as any).__DEV_USERS = (global as any).__DEV_USERS || DEV_USERS;
}
export default DEV_USERS;