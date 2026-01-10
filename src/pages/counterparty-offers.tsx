import { useRouter } from 'next/router';
import { useSwap } from '../context/SwapContext';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

type Offer = {
    id: string;
    provider: string;
    amount: number;
    rate: number;
    min: number;
    max: number;
    speed: string;
    trust: number;
    offerAmount: number;
    currencyFrom: string;
    currencyTo: string;
    marketRate: number;
    isRound?: boolean;
};

export default function CounterpartyOffers() {
    const router = useRouter();
    const { swapIntent, setSwapIntent } = useSwap();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    // KYC State for Sandbox
    const [kycStatus, setKycStatus] = useState<string>('');
    const [txCount, setTxCount] = useState<number>(0);

    useEffect(() => {
        // Check Session & KYC
        const sessionStr = localStorage.getItem('trueque_session');
        if (sessionStr) {
            try {
                const s = JSON.parse(sessionStr);
                setKycStatus(s.kycStatus || s.kyc_status || '');
                setTxCount(s.txCount || 0);
            } catch { }
        } else {
            router.push('/signin');
        }
    }, [router]);

    const isSandbox = (kycStatus || '').toUpperCase() === 'PENDING';
    const SANDBOX_LIMIT = 190; // Approx $200 USD

    // Fetch Offers
    useEffect(() => {
        if (!router.isReady) return;

        // Use SwapIntent or defaults
        const amount = swapIntent?.amount || 100000;
        const cFrom = swapIntent?.currencyFrom || 'EUR';
        const cTo = swapIntent?.currencyTo || 'ARS';

        const fetchOffers = async () => {
            try {
                const res = await fetch(`/api/offers?amount=${amount}&currencyFrom=${cFrom}&currencyTo=${cTo}`);
                if (res.ok) {
                    const data = await res.json();
                    setOffers(data);
                }
            } catch (e) {
                console.error("Failed to fetch offers", e);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, [router.isReady, swapIntent]);

    const handleSelectOffer = (offer: Offer) => {
        // Sandbox Logic
        const eurEquivalent = offer.offerAmount / 1050;
        const isOverLimit = isSandbox && eurEquivalent > SANDBOX_LIMIT;
        const isTrialExhausted = isSandbox && txCount >= 1;

        if (isOverLimit || isTrialExhausted) {
            alert("Trial Limit Reached: This swap exceeds your $200 limit. Please complete KYC for full access.");
            return;
        }

        // Update Intent with Provider
        setSwapIntent(prev => ({
            ...prev!,
            provider: offer.provider,
            rate: offer.marketRate,
            amount: offer.offerAmount // Lock to offer amount if slightly different
        }));

        router.push('/review');
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Header />
            <main style={{ padding: '0 40px', maxWidth: '1000px', margin: '40px auto' }}>
                <div style={{
                    backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    {/* Back Button */}
                    <button
                        onClick={() => router.push('/beneficiary-selection')} // Back to Beneficiary List as requested
                        style={{
                            background: 'none', border: 'none', color: '#7f8c8d', fontSize: '14px', fontWeight: '600',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '15px'
                        }}
                    >
                        ← Back to Beneficiary List
                    </button>

                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px', color: '#2c3e50' }}>
                        Select a Counterparty
                    </h2>

                    {isSandbox && (
                        <div style={{
                            backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '10px', padding: '15px', marginBottom: '25px', display: 'flex', gap: '12px', alignItems: 'start'
                        }}>
                            <span style={{ fontSize: '20px' }}>🚧</span>
                            <div>
                                <strong style={{ display: 'block', color: '#856404', marginBottom: '4px' }}>
                                    Account Verification in Progress
                                </strong>
                                <span style={{ fontSize: '14px', color: '#856404' }}>
                                    You are eligible for <strong>one trial swap of up to €{SANDBOX_LIMIT}</strong>.
                                </span>
                            </div>
                        </div>
                    )}

                    <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
                        Choose a match to proceed. Transaction speed is <strong>Instant</strong>.
                    </p>

                    {loading ? (
                        <div>Loading offers...</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {offers.map((offer) => {
                                const eurEquivalent = offer.offerAmount / 1050;
                                const costInEur = offer.offerAmount / offer.marketRate;

                                const hasUsedTrial = isSandbox && txCount >= 1;
                                const isOverLimit = isSandbox && eurEquivalent > SANDBOX_LIMIT;
                                const isDisabled = hasUsedTrial || isOverLimit;

                                return (
                                    <div
                                        key={offer.id}
                                        onClick={() => !isDisabled && handleSelectOffer(offer)}
                                        style={{
                                            border: '1px solid #e1e8ed', borderRadius: '12px', padding: '20px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                                            backgroundColor: isDisabled ? '#f9f9f9' : 'white',
                                            opacity: isDisabled ? 0.4 : 1,
                                            transition: 'transform 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isDisabled) e.currentTarget.style.transform = 'translateY(-2px)';
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isDisabled) e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        {/* Provider Info */}
                                        <div style={{ flex: '0 0 25%' }}>
                                            <div style={{ fontWeight: '700', fontSize: '18px', color: '#2c3e50' }}>
                                                {offer.provider}
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '4px' }}>
                                                Trust: {offer.trust} ⭐
                                            </div>
                                        </div>

                                        {/* Match Amount in ARS */}
                                        <div style={{ flex: '0 0 20%', textAlign: 'left' }}>
                                            <div style={{ fontSize: '12px', color: '#95a5a6' }}>YOU GET</div>
                                            <div style={{ fontWeight: '700', fontSize: '20px', color: '#27ae60' }}>
                                                {offer.offerAmount.toLocaleString()} {offer.currencyTo}
                                            </div>
                                        </div>

                                        {/* Rate */}
                                        <div style={{ flex: '0 0 15%', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: '#95a5a6' }}>RATE</div>
                                            <div style={{ fontWeight: '600', backgroundColor: '#ecf0f1', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                                {offer.marketRate.toFixed(2)}
                                            </div>
                                        </div>

                                        {/* Swap Cost EUR */}
                                        <div style={{ flex: '0 0 20%', textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: '#95a5a6' }}>YOU SWAP</div>
                                            <div style={{ fontWeight: '700', fontSize: '18px', color: '#2c3e50' }}>
                                                €{costInEur.toFixed(2)}
                                            </div>
                                            {isOverLimit && <div style={{ color: '#e74c3c', fontSize: '11px', fontWeight: 'bold' }}>Limit Exceeded</div>}
                                        </div>

                                        {/* Arrow */}
                                        <div style={{ flex: '0 0 10%', textAlign: 'right', color: '#4A90E2', fontSize: '24px', fontWeight: 'bold' }}>
                                            &rarr;
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
