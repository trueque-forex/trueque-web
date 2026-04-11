import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import brandConfig from '../config/brand_config.json';
import { useSwap } from '../context/SwapContext';

// Timeline States
type TxStatus = 'Awaiting_Funding' | 'Funding_Verified' | 'Liquidity_Lock' | 'Outbound_Initiated' | 'Completed';

// Mock Holidays
const HOLIDAY_COUNTRIES = ['AR', 'CO', 'US']; // Countries with "Banking Holidays" today

export default function TransactionStatusPage() {
    const router = useRouter();
    const { saveCurrentBeneficiary } = useSwap();

    const {
        transactionId,
        amountSend,
        amountReceive,
        currencyFrom,
        currencyTo,
        beneficiary,
        timeFrame
    } = router.query;

    const [status, setStatus] = useState<TxStatus>('Awaiting_Funding');
    const [progress, setProgress] = useState(10);
    const [holidayWarning, setHolidayWarning] = useState<string | null>(null);
    const [counterpartyId, setCounterpartyId] = useState<string>('T20251226XX0000X'); // Placeholder
    const [beneficiaryName, setBeneficiaryName] = useState('Recipient'); // Fallback, but we want ID

    // 1. Simulate Progress & SAVE BENEFICIARY
    useEffect(() => {
        // Save Beneficiary Persistence
        if (router.isReady) {
            saveCurrentBeneficiary();
        }

        // Timeline Simulation
        const timers: NodeJS.Timeout[] = [];

        timers.push(setTimeout(() => {
            setStatus('Funding_Verified');
            setProgress(35);
        }, 2500));

        timers.push(setTimeout(() => {
            setStatus('Liquidity_Lock');
            setProgress(65);
        }, 5000));

        timers.push(setTimeout(() => {
            setStatus('Outbound_Initiated');
            setProgress(90);
        }, 8000));

        timers.push(setTimeout(() => {
            setStatus('Completed');
            setProgress(100);
        }, 11000));

        return () => timers.forEach(clearTimeout);
    }, [router.isReady]); // Added dependency

    // 2. Parse Context & Privacy
    useEffect(() => {
        if (!router.isReady) return;

        // Determine Country from Currency for Holiday Logic
        const destCountry = (currencyTo as string)?.substring(0, 2) || 'US';
        if (HOLIDAY_COUNTRIES.includes(destCountry)) {
            setHolidayWarning(`Status: Instant RTP active. Note: Banking support in ${destCountry} is reduced today due to a public holiday.`);
        }

        // Generate/Parse Counterparty ID
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const mockId = `T${date}${destCountry}4829X`;
        setCounterpartyId(mockId);

        if (beneficiary) {
            try {
                const benData = JSON.parse(Array.isArray(beneficiary) ? beneficiary[0] : beneficiary);
                const personal = benData.personal || benData;
                const fullName = `${personal.firstName} ${personal.lastName}`;
                setBeneficiaryName(fullName);
            } catch (e) {
                // Fallback if parsing fails
                setBeneficiaryName('Recipient');
            }
        }

    }, [router.isReady, currencyTo, beneficiary]);


    // Formatting
    const formatCurrency = (amount: string | string[] | undefined) => {
        if (!amount) return '0.00';
        return parseFloat(Array.isArray(amount) ? amount[0] : amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    };

    // UI Components
    const Step = ({ active, completed, label, icon }: { active: boolean, completed: boolean, label: string, icon: string }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: (active || completed) ? 1 : 0.4, transition: 'all 0.5s' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: completed ? '#000000' : (active ? '#000000' : '#ecf0f1'),
                color: (active || completed) ? 'white' : '#bdc3c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '18px', zIndex: 2,
                boxShadow: active ? '0 0 0 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}>
                {completed ? '✓' : icon}
            </div>
            <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: '600', color: (active || completed) ? '#2c3e50' : '#bdc3c7', textAlign: 'center' }}>
                {label}
            </div>
        </div>
    );

    const ProgressBar = () => (
        <div style={{ position: 'relative', margin: '40px 0', padding: '0 20px' }}>
            {/* Track Background */}
            <div style={{ position: 'absolute', top: '20px', left: '40px', right: '40px', height: '4px', backgroundColor: '#ecf0f1', zIndex: 0 }} />
            {/* Track Fill */}
            <div style={{
                position: 'absolute', top: '20px', left: '40px', height: '4px',
                backgroundColor: '#27ae60', zIndex: 0, width: `${progress}%`, transition: 'width 1s ease'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <Step
                    active={status === 'Awaiting_Funding'}
                    completed={['Funding_Verified', 'Liquidity_Lock', 'Outbound_Initiated', 'Completed'].includes(status)}
                    label="Awaiting Funding" icon="1"
                />
                <Step
                    active={status === 'Funding_Verified'}
                    completed={['Liquidity_Lock', 'Outbound_Initiated', 'Completed'].includes(status)}
                    label="Verified" icon="2"
                />
                <Step
                    active={status === 'Liquidity_Lock'}
                    completed={['Outbound_Initiated', 'Completed'].includes(status)}
                    label="Liquidity Lock" icon="🔒"
                />
                <Step
                    active={status === 'Outbound_Initiated' || status === 'Completed'}
                    completed={status === 'Completed'}
                    label="Outbound Sent" icon="🚀"
                />
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
            {/* Centered Brand Header for Success Screen */}
            <header style={{
                background: 'white',
                padding: '20px 40px',
                borderBottom: '1px solid #e1e8ed',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: brandConfig.theme.fontWeight,
                    margin: 0,
                    fontFamily: brandConfig.theme.fontFamily,
                    letterSpacing: brandConfig.theme.letterSpacing,
                    color: brandConfig.theme.primaryColor,
                    cursor: 'pointer'
                }} onClick={() => router.push('/dashboard')}>
                    {brandConfig.appName}
                </h1>
            </header>

            <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>

                {/* Status Card */}
                <div style={{
                    backgroundColor: 'white', borderRadius: '16px', padding: '40px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '30px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '28px', color: '#2c3e50', margin: '0 0 10px 0' }}>Transaction Tracking</h1>
                        <p style={{ color: '#7f8c8d' }}>ID: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{String(transactionId || 'PENDING')}</span></p>
                    </div>

                    {/* Timeline */}
                    <ProgressBar />

                    {/* Holiday Alert */}
                    {holidayWarning && (
                        <div style={{
                            margin: '30px 0', padding: '15px', borderRadius: '8px',
                            backgroundColor: '#fff3cd', border: '1px solid #ffeeba', color: '#856404',
                            display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
                        }}>
                            <span style={{ fontSize: '20px' }}>⚠️</span>
                            <div>{holidayWarning}</div>
                        </div>
                    )}

                    {/* Current State Message */}
                    <div style={{ textAlign: 'center', margin: '30px 0', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '12px' }}>
                        <h3 style={{ margin: '0 0 5px 0', color: '#4A90E2' }}>
                            {status === 'Awaiting_Funding' && 'Waiting for your payment...'}
                            {status === 'Funding_Verified' && 'Payment Received. Verifying...'}
                            {status === 'Liquidity_Lock' && 'Securing Instant Liquidity...'}
                            {status === 'Outbound_Initiated' && 'Transfer initiated to Beneficiary!'}
                            {status === 'Completed' && 'Transaction Complete'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d' }}>
                            {status === 'Completed' ? 'Funds have been delivered.' : 'Updates automatically'}
                        </p>
                    </div>
                </div>

                {/* Details Summary */}
                <div style={{
                    backgroundColor: 'white', borderRadius: '16px', padding: '30px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                }}>
                    <h3 style={{ fontSize: '18px', margin: '0 0 20px 0', color: '#2c3e50', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        Metadata
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '14px' }}>
                        <div>
                            <div style={{ color: '#7f8c8d', marginBottom: '5px' }}>Swapped Amount</div>
                            <div style={{ fontWeight: '600' }}>{formatCurrency(amountSend)} {currencyFrom}</div>
                        </div>
                        <div>
                            <div style={{ color: '#7f8c8d', marginBottom: '5px' }}>Beneficiary Receives</div>
                            <div style={{ fontWeight: '600', color: '#27ae60' }}>{formatCurrency(amountReceive)} {currencyTo}</div>
                        </div>

                        <div>
                            <div style={{ color: '#7f8c8d', marginBottom: '5px' }}>Swapped To</div>
                            <div style={{ fontWeight: '600' }}>{beneficiaryName}</div>
                        </div>
                        <div>
                            <div style={{ color: '#7f8c8d', marginBottom: '5px' }}>Liquidity Provider</div>
                            {/* PRIVACY: SHOW ID ONLY */}
                            <div style={{ fontFamily: 'monospace', color: '#2c3e50', backgroundColor: '#f0f2f5', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                                {counterpartyId}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <button
                            onClick={() => router.push(status === 'Completed' ? '/swap' : '/dashboard')}
                            disabled={status !== 'Completed'}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: status === 'Completed' ? '#000000' : '#bdc3c7',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: status === 'Completed' ? 'pointer' : 'not-allowed',
                                fontWeight: '600',
                                opacity: status === 'Completed' ? 1 : 0.6
                            }}
                        >
                            {status === 'Completed' ? 'Start New Swap' : 'Tracking in Progress...'}
                        </button>
                    </div>

                </div>

            </main>
        </div>
    );
}
