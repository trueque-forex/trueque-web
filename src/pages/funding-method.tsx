
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';
import { useRequireAuth } from '../hooks/useRequireAuth';

type PaymentType = 'RTP' | 'CARD';
type CardNetwork = 'visa' | 'mastercard' | 'amex';
type CardType = 'debit' | 'credit';

interface PaymentMethod {
    id: string;
    type: PaymentType;
    label: string;
    last4?: string;
    expiry?: string;
    network?: CardNetwork;
    isExpired?: boolean;
    cardType?: CardType;
}

const MOCK_STORED_METHODS: PaymentMethod[] = [
    { id: 'method_rtp', type: 'RTP', label: 'Bank Transfer (RTP/ACH)' },
    { id: 'card_1', type: 'CARD', label: 'Chase Sapphire', last4: '4242', expiry: '12/28', network: 'visa', cardType: 'credit' },
    { id: 'card_2', type: 'CARD', label: 'Citi Double Cash', last4: '8888', expiry: '10/24', network: 'mastercard', isExpired: true, cardType: 'credit' },
    { id: 'card_3', type: 'CARD', label: 'Bank Debit', last4: '1005', expiry: '05/26', network: 'visa', cardType: 'debit' },
];

export default function FundingMethodPage() {
    useRequireAuth();
    const router = useRouter();
    const { swapIntent } = useSwap();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_STORED_METHODS);
    const [selectedMethodId, setSelectedMethodId] = useState<string>('method_rtp');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newMethodType, setNewMethodType] = useState<'bank' | 'card'>('card');
    const [newForm, setNewForm] = useState({
        holderName: '', iban: '', cardNumber: '', expiry: '', cvv: '', cardType: 'debit' as CardType
    });

    const handleContinue = () => {
        const method = paymentMethods.find(m => m.id === selectedMethodId);
        if (!method) return;

        // Pass selected method ID to summary
        router.push({
            pathname: '/swap-summary',
            query: {
                ...router.query, // Preserve previous query params (amount, rate, etc)
                methodId: selectedMethodId,
                methodType: method.type,
                methodLabel: method.label,
                methodLast4: method.last4 || '',
                methodCardType: method.cardType || ''
            }
        });
    };

    const handleAddNewMethod = () => {
        const id = `new_${Date.now()}`;
        const newMethod: PaymentMethod = newMethodType === 'card'
            ? { id, type: 'CARD', label: `${newForm.cardType} •• ${newForm.cardNumber.slice(-4)}`, last4: newForm.cardNumber.slice(-4), expiry: newForm.expiry, cardType: newForm.cardType as CardType }
            : { id, type: 'RTP', label: 'Bank Account' };
        setPaymentMethods(prev => [...prev, newMethod]);
        setSelectedMethodId(id);
        setShowAddModal(false);
        setNewForm({ holderName: '', iban: '', cardNumber: '', expiry: '', cvv: '', cardType: 'debit' });
    };

    const renderMethodOption = (method: PaymentMethod) => {
        if (method.type === 'RTP') return <option key={method.id} value={method.id}>Bank Transfer (RTP) - Best Value</option>;
        return <option key={method.id} value={method.id} disabled={method.isExpired}>{method.label} {method.isExpired ? '(Expired)' : ''}</option>;
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
            <Header />
            <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>

                {/* BACK BUTTON */}
                <button
                    onClick={() => router.push('/beneficiary-list')}
                    style={{
                        background: 'none', border: 'none', color: '#333', fontSize: '14px', fontWeight: '600',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '20px'
                    }}
                >
                    ← Back to Beneficiaries
                </button>

                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '30px' }}>Select Funding Method</h2>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>Fund With</label>
                        <select
                            value={selectedMethodId}
                            onChange={(e) => e.target.value === 'add_new' ? setShowAddModal(true) : setSelectedMethodId(e.target.value)}
                            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white' }}
                        >
                            {paymentMethods.map(renderMethodOption)}
                            <option value="add_new">+ Add New Funding Method</option>
                        </select>
                    </div>

                    {/* VISUAL CARD REPRESENTATION */}
                    <div style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, #f6f8f9 0%, #e5ebee 100%)', border: '1px solid #dcdde1', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
                        <div style={{ fontSize: '32px' }}>{paymentMethods.find(m => m.id === selectedMethodId)?.type === 'RTP' ? '🏦' : '💳'}</div>
                        <div>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>{paymentMethods.find(m => m.id === selectedMethodId)?.label}</div>
                            <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '4px' }}>
                                {paymentMethods.find(m => m.id === selectedMethodId)?.type === 'RTP' ? 'Linked Bank Account' : `${(paymentMethods.find(m => m.id === selectedMethodId)?.cardType || 'debit').toUpperCase()} ending in ${paymentMethods.find(m => m.id === selectedMethodId)?.last4}`}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleContinue}
                        style={{
                            width: '100%', padding: '18px', fontSize: '18px', fontWeight: 'bold', color: 'white',
                            background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                            border: 'none', borderRadius: '12px', cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Continue to Summary →
                    </button>
                </div>

                {/* Add New Modal (Simplified) */}
                {showAddModal && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 400 }}>
                        <h3>Add Method (Mock)</h3>
                        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                            <button onClick={() => setShowAddModal(false)} style={{ padding: '10px', flex: 1 }}>Cancel</button>
                            <button onClick={handleAddNewMethod} style={{ padding: '10px', flex: 1, background: '#2c3e50', color: 'white' }}>Save Mock</button>
                        </div>
                    </div>
                </div>}

            </main>
        </div>
    );
}
