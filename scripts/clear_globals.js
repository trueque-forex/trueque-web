
// Diagnose and clear global maps
const g = global;
if (g.__DEV_MFA_PENDING) {
    console.log(`[CLEAR] Clearing __DEV_MFA_PENDING (Size: ${g.__DEV_MFA_PENDING.size})`);
    g.__DEV_MFA_PENDING.clear();
} else {
    console.log('[CLEAR] __DEV_MFA_PENDING was empty or undefined.');
}

if (g.__TRUEQUE_SESSION_STORE__) {
    console.log(`[CLEAR] Clearing __TRUEQUE_SESSION_STORE__ (Size: ${g.__TRUEQUE_SESSION_STORE__.size})`);
    g.__TRUEQUE_SESSION_STORE__.clear();
}
