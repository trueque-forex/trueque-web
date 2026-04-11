
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';

// Helper to split full name
const splitName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return {
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || ''
    };
};

export default function BeneficiaryList() {
    const router = useRouter();
    const { setBeneficiary } = useSwap();
    const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
    const [filteredBeneficiaries, setFilteredBeneficiaries] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch from DB
        const fetchBens = async () => {
            try {
                const res = await fetch('/api/beneficiaries');
                if (res.ok) {
                    const data = await res.json();
                    setBeneficiaries(data);
                    setFilteredBeneficiaries(data);
                }
            } catch (e) {
                console.error("Failed to fetch beneficiaries", e);
            } finally {
                setLoading(false);
            }
        };
        fetchBens();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!searchTerm) {
            setFilteredBeneficiaries(beneficiaries);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredBeneficiaries(beneficiaries.filter(b =>
                b.name?.toLowerCase().includes(lower) ||
                b.bank_name?.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, beneficiaries]);

    const handleSelect = (b: any) => {
        const { firstName, lastName } = splitName(b.name);

        // Map DB -> Context Shape
        const mapped = {
            personal: {
                firstName,
                lastName,
                email: b.email || '',
                phone: b.phone_number || ''
            },
            banking: {
                deliveryMethod: 'bank_rtp', // Default assumption or derive
                cbu: b.account_type === 'CBU' || b.account_type === 'CVU' ? b.account_number : '',
                alias: '',
                bankName: b.bank_name || '',
                accountType: b.account_type || 'checking',
                cardNumber: '',
                walletProvider: '',
                walletId: '',
                // Populate others based on heuristic if needed
                accountNumber: b.account_number
            }
        };

        setBeneficiary(prev => ({
            ...prev, // Keep defaults
            ...mapped,
            banking: { ...prev.banking, ...mapped.banking } // Deep merge banking
        }));

        // Proceed to Funding Method (Instruction 49)
        router.push('/funding-method');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
            <Header />
            <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
                {/* Back Button */}
                <button
                    onClick={() => router.push({ pathname: '/offers', query: router.query })} // Strict Flow Fix
                    style={{
                        background: 'none', border: 'none', color: '#333333', fontSize: '14px', fontWeight: '600',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px'
                    }}
                >
                    ← Back to Offers
                </button>

                <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Select Beneficiary</h1>

                {/* SEARCH BAR */}
                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid #bdc3c7',
                            fontSize: '16px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                        }}
                    />
                </div>

                {/* ADD NEW BUTTON */}
                <button
                    onClick={() => router.push('/beneficiary-details')}
                    style={{
                        width: '100%', padding: '15px', marginBottom: '30px',
                        backgroundColor: 'white', border: '2px dashed #3498db', borderRadius: '10px',
                        color: '#3498db', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                    + Add New Beneficiary
                </button>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>Loading beneficiaries...</div>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {filteredBeneficiaries.map(b => (
                            <div key={b.id} onClick={() => handleSelect(b)} style={{
                                backgroundColor: 'white', padding: '20px', borderRadius: '12px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                border: '1px solid #e1e8ed',
                                transition: 'transform 0.1s'
                            }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '45px', height: '45px', borderRadius: '50%',
                                        backgroundColor: '#eef6fc', color: '#4A90E2',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px'
                                    }}>
                                        {(b.name || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>{b.name}</div>
                                        <div style={{ color: '#7f8c8d', fontSize: '14px', marginTop: '2px' }}>
                                            {b.bank_name} • <span style={{ backgroundColor: '#f0f2f5', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{b.account_type || 'Bank'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ color: '#bdc3c7', fontSize: '24px' }}>→</div>
                            </div>
                        ))}

                        {filteredBeneficiaries.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6', backgroundColor: 'white', borderRadius: '12px' }}>
                                {searchTerm ? 'No matches found.' : 'No beneficiaries yet. Add your first one!'}
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );
}
