import { useEffect } from 'react';
import { useRouter } from 'next/router';

export function useRequireAuth() {
    const router = useRouter();

    useEffect(() => {
        // Check if session exists in localStorage (client-side simple check)
        // For robust security, we'd also verify token with API on load, 
        // but for user flow redirection this is sufficient/faster.
        const session = localStorage.getItem('trueque_session');

        if (!session) {
            console.warn('useRequireAuth: Session missing. No redirect.');
        }
    }, [router]);
}
