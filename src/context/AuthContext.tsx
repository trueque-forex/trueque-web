import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../lib/apiFetch';

interface User {
    id: string;
    email: string;
    name: string;
    kycStatus: string;
    txCount: number;
    userType?: 'PEER' | 'MERCHANT';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (userData: User) => void;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const refreshSession = async () => {
        // OPTIMIZED: Try to get token from localStorage to support Hybrid Auth (Cookie + Bearer)
        const stored = typeof window !== 'undefined' ? localStorage.getItem('trueque_session') : null;

        try {
            // Hydrate from local storage for instant UI (Degraded Mode support)
            let token = null;
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setUser({
                        id: parsed.user?.id || parsed.id, // Support new structure or legacy
                        email: parsed.user?.email || parsed.email,
                        name: parsed.user?.name || parsed.name,
                        kycStatus: parsed.user?.kycStatus || parsed.kycStatus,
                        txCount: 0, // Placeholder
                        userType: parsed.user?.userType || 'PEER'
                    });
                    token = parsed.token;
                } catch { }
            }

            // Native fetch to avoid apiFetch throwing on 401
            // HYBRID AUTH: Send both Cookie (credentials) and Bearer Token (header)
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`; // Critical fix for 401s
            }

            const res = await fetch('/api/profile', {
                method: 'GET',
                headers,
                credentials: 'include' // Important: Send cookies
            });

            if (res.ok) {
                const json = await res.json();
                if (json.id) {
                    setUser({
                        id: json.id,
                        email: json.email,
                        name: json.name,
                        kycStatus: json.kycStatus,
                        txCount: json.txCount,
                        userType: json.userType // Ensure backend sends this
                    });
                } else {
                    throw new Error('Invalid profile data');
                }
            } else if (res.status === 401 || res.status === 403) {
                // Silent Redirect for auth failures
                console.warn('Session check failed (401). Redirecting to login.');
                setUser(null);
                if (typeof window !== 'undefined') localStorage.removeItem('trueque_session');
                // Prevent loop: Only redirect if NOT already on home
                if (router.pathname !== '/') {
                    router.push('/');
                }
            } else {
                throw new Error(`Profile check failed: ${res.status}`);
            }
        } catch (e) {
            console.error('Auth check error', e);
            setUser(null);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSession();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await apiFetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout API failed', e);
        } finally {
            // SECURITY HARDENING: Wipe everything
            setUser(null);
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
                console.log('Session Wiped. Storage Keys Remaining:', localStorage.length);
            }
            router.push('/');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
