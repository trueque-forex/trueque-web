
import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getSession } from '../lib/session';
import Header from '../components/Header';

interface ProfileProps {
    user: {
        userId: string;
        email: string;
        name: string;
        kycStatus: string;
        trustScore?: number;
        kycLevel?: string;
    };
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getSession(context.req);

    if (!session) {
        return {
            redirect: {
                destination: '/signin',
                permanent: false,
            },
        };
    }

    // Normalize User Data
    const user = {
        userId: session.userId || session.truequeId || 'UNKNOWN_ID',
        email: session.email || 'unknown@example.com',
        name: session.name || session.firstName || 'Trueque User',
        kycStatus: (session.kycStatus || 'PENDING').toUpperCase(),
        // Mock Trust Score/Level if not in session, as standard
        trustScore: session.trustScore || 85,
        kycLevel: session.kycLevel || 'Tier 1'
    };

    return {
        props: { user },
    };
};

export default function ProfilePage({ user }: ProfileProps) {
    const router = useRouter();

    // State for MFA Toggle
    const [mfaEnabled, setMfaEnabled] = useState(false); // Default to false for now

    // State for Password Form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        // TODO: Wire to API
        alert("Password update functionality coming soon.");
    };

    const handleMfaToggle = () => {
        // TODO: Wire to API
        setMfaEnabled(!mfaEnabled);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
            <Header />

            <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>

                {/* Page Title */}
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '30px' }}>
                    Profile & Settings
                </h1>

                {/* Top Grid: User Info & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginBottom: '40px' }}>

                    {/* User Info Card */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <div style={{
                                width: '70px', height: '70px', borderRadius: '50%',
                                backgroundColor: '#3498db', color: 'white', fontSize: '28px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                            }}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px', color: '#2c3e50' }}>{user.name}</h2>
                                <div style={{ color: '#7f8c8d', fontSize: '15px' }}>{user.email}</div>
                            </div>
                            <div style={{
                                marginLeft: 'auto', padding: '6px 12px', borderRadius: '20px',
                                backgroundColor: user.kycStatus === 'APPROVED' ? '#dbfabb' : '#ffeebb',
                                color: user.kycStatus === 'APPROVED' ? '#27ae60' : '#f39c12',
                                fontWeight: 'bold', fontSize: '14px', border: user.kycStatus === 'APPROVED' ? '1px solid #27ae60' : '1px solid #f39c12'
                            }}>
                                {user.kycStatus}
                            </div>
                        </div>
                        <div style={{ fontSize: '14px', color: '#95a5a6', fontFamily: 'monospace' }}>
                            Trueque ID: {user.userId}
                        </div>
                    </div>

                    {/* Verification Status Card */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Trust Level
                        </h3>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', color: '#95a5a6', marginBottom: '5px' }}>KYC Tier</div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>{user.kycLevel}</div>
                        </div>

                        <div>
                            <div style={{ fontSize: '14px', color: '#95a5a6', marginBottom: '5px' }}>Trust Score</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                                <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#3498db' }}>{user.trustScore}</span>
                                <span style={{ fontSize: '14px', color: '#95a5a6' }}>/ 100</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Grid: Account Settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                    {/* Password Change */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 25px 0', fontSize: '20px', color: '#2c3e50', borderBottom: '1px solid #ecf0f1', paddingBottom: '15px' }}>
                            Change Password
                        </h3>
                        <form onSubmit={handlePasswordUpdate}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#34495e', marginBottom: '8px' }}>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '16px' }}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#34495e', marginBottom: '8px' }}>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '16px' }}
                                    placeholder="New password"
                                />
                            </div>
                            <div style={{ marginBottom: '25px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#34495e', marginBottom: '8px' }}>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{ width: '100%', padding: '12px', border: '1px solid #bdc3c7', borderRadius: '8px', fontSize: '16px' }}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#3498db', color: 'white', border: 'none', padding: '12px 25px',
                                    borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', width: '100%'
                                }}
                            >
                                Update Password
                            </button>
                        </form>
                    </div>

                    {/* Security & MFA */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 25px 0', fontSize: '20px', color: '#2c3e50', borderBottom: '1px solid #ecf0f1', paddingBottom: '15px' }}>
                            Security
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' }}>Two-Factor Authentication (MFA)</div>
                                <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>Add an extra layer of security to your account.</div>
                            </div>

                            {/* Toggle Switch */}
                            <div
                                onClick={handleMfaToggle}
                                style={{
                                    width: '50px', height: '28px', backgroundColor: mfaEnabled ? '#2ecc71' : '#bdc3c7',
                                    borderRadius: '14px', position: 'relative', cursor: 'pointer', transition: 'background-color 0.3s'
                                }}
                            >
                                <div style={{
                                    width: '24px', height: '24px', backgroundColor: 'white', borderRadius: '50%',
                                    position: 'absolute', top: '2px', left: mfaEnabled ? '24px' : '2px',
                                    transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }} />
                            </div>
                        </div>

                        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ecf0f1' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e67e22', marginBottom: '5px' }}>⚠️ Flow B Requirement</div>
                            <div style={{ fontSize: '13px', color: '#7f8c8d', lineHeight: '1.4' }}>
                                Institutional accounts and high-volume traders required MFA enabled for all withdrawals and beneficiary updates.
                            </div>
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}
