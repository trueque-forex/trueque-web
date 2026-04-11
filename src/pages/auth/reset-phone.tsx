import React, { useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../../lib/apiFetch';

export default function ResetPhonePage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Mock API call
        setTimeout(() => {
            alert('Phone number updated! You will now receive a new MFA code.');
            router.push('/auth/mfa?is_reset=true');
        }, 1500);
    };

    return (
        <div style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1>Update Phone Number</h1>
            <p>Your identity has been verified. Please enter your new mobile number.</p>
            <form onSubmit={handleUpdate}>
                <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    style={{ width: '100%', padding: '10px', margin: '20px 0', fontSize: '16px' }}
                    required
                />
                <button
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {loading ? 'Updating...' : 'Send Verification Code'}
                </button>
            </form>
        </div>
    );
}
