// FILE: src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext<any>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshSession = async () => {
        // Bypass checks on public pages? NO. perform SOFT CHECK.
        // Added /verify-mfa to public paths to prevent circular logic if session fetch has issues
        const publicPaths = ['/signup', '/signin', '/login', '/', '/auth/mfa', '/verify-mfa', '/about', '/forgot-password', '/voucher', '/voucher-success', '/social-card', '/demo/retailer'];

        try {
            // Use specialized session endpoint that returns fresh DB counts (ignoring drafts)
            const res = await fetch('/api/auth/session', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.user) {
                    // NEW: ENFORCE PROFILE COMPLETENESS (The "Good Faith" Guard)
                    // If name is missing (e.g. user created during bug), treat as EMPTY to block swaps.
                    // Strict Check: Must rely on firstName because 'name' defaults to 'User'
                    const currentKycStatus = (data.user.kycStatus || data.user.kyc_status || 'NOT_STARTED').toUpperCase();
                    if (!data.user.firstName && currentKycStatus === 'NOT_STARTED') {
                        console.warn("[AUTH] User missing profile name. Forcing KYC status to NOT_STARTED.");
                        data.user.kycStatus = 'NOT_STARTED';
                    }
                    setUser(data.user); // Hydrate state
                }
            } else {
                console.warn(`[AUTH] Session refresh failed with status: ${res.status}`);
                setUser(null);
                // ONLY Redirect if we are NOT on a public path AND it is an explicit 401 (Unauthorized)
                if (!publicPaths.includes(router.pathname) && res.status === 401) {
                    console.log('[AUTH] Unauthorized. Redirecting to /login');
                    router.push('/login');
                }
            }
        } catch (e) {
            console.error('[AUTH] Refresh failed:', e);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => { refreshSession(); }, [router.pathname]);

    // Provide a stable logout function
    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed', e);
        }
        setUser(null);
        router.push('/');
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) return { loading: true, refreshSession: () => { } };
    return context;
};