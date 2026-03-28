import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import { useRequireAuth } from '../hooks/useRequireAuth';

export default function ReceiptPage() {
    useRequireAuth(); // Auth Guard
    const router = useRouter();
    const {
        transactionId,
        amountSend,
        amountReceive,
        currencyFrom,
        currencyTo,
        totalPaid,
        beneficiary,
        timeFrame
    } = router.query;

    const [userName, setUserName] = useState('User');
    const [beneficiaryName, setBeneficiaryName] = useState('Recipient');

    useEffect(() => {
        const sessionData = localStorage.getItem('trueque_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                setUserName(session.firstName || 'User');
            } catch (e) {
                console.error('Error loading session:', e);
            }
        }

        // Parse beneficiary data
        if (beneficiary) {
            try {
                const benData = JSON.parse(Array.isArray(beneficiary) ? beneficiary[0] : beneficiary);
                // Handle both flat (legacy) and nested (new) structures
                const personal = benData.personal || benData;
                const fullName = personal.fullLegalName || `${personal.firstName || ''} ${personal.middleName || ''} ${personal.lastName || ''}`.trim();
                setBeneficiaryName(fullName || 'Recipient');
            } catch (e) {
                console.error('Error parsing beneficiary:', e);
            }
        }
    }, [beneficiary]);

    // Format currency with commas
    const formatCurrency = (amount: string | string[] | undefined): string => {
        if (!amount) return '0.00';
        const num = parseFloat(Array.isArray(amount) ? amount[0] : amount);
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Calculate values
    const principal = amountSend ? parseFloat(Array.isArray(amountSend) ? amountSend[0] : amountSend) : 0;
    const paid = totalPaid ? parseFloat(Array.isArray(totalPaid) ? totalPaid[0] : totalPaid) : 0;
    const received = amountReceive ? parseFloat(Array.isArray(amountReceive) ? amountReceive[0] : amountReceive) : 0;
    const surcharge = paid - principal;
    const eer = paid > 0 ? (received / paid) : 0;
    const currencyToStr = Array.isArray(currencyTo) ? currencyTo[0] : currencyTo;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'white',
                padding: '20px 40px',
                borderBottom: '1px solid #e1e8ed',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <div style={{
                    maxWidth: 800,
                    margin: '0 auto',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: '#2c3e50' }}>
                        Transaction Receipt
                    </h1>
                    <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        {new Date().toLocaleDateString()}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 40px' }}>

                {/* Transaction Details Card */}
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '40px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    marginBottom: '30px',
                    border: '1px solid #e1e8ed'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '1px' }}>Document Type</div>
                            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#2c3e50', margin: 0 }}>
                                Official Tax Receipt
                            </h2>
                        </div>
                        <button
                            onClick={() => alert("Downloading PDF for " + (currencyToStr === 'ARS' ? 'CUIT' : 'Tax ID') + "...")}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px',
                                backgroundColor: '#2c3e50', border: 'none',
                                borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: '500'
                            }}>
                            <span>📄</span> Download PDF
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '20px' }}>
                        {/* Transaction ID */}
                        <div style={{
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '10px',
                            border: '1px solid #e1e8ed',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>Gateway Reference / ID</div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50', fontFamily: 'monospace' }}>
                                {transactionId || 'N/A'}
                            </div>
                        </div>

                        {/* Beneficiary Info */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '4px' }}>Beneficiary (Sender declared)</div>
                            <div style={{ fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>{beneficiaryName}</div>
                        </div>

                        {/* MIRRORED FINANCIAL BREAKDOWN (5-POINT FEE OBJECT) */}
                        <div style={{ backgroundColor: '#fcfdfe', borderRadius: '12px', border: '1px solid #e1e8ed', overflow: 'hidden' }}>

                            {/* 1. Principal */}
                            <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f2f6' }}>
                                <div style={{ color: '#7f8c8d' }}>Principal Amount (Sacred)</div>
                                <div style={{ fontWeight: '600', color: '#2c3e50' }}>{formatCurrency(principal.toString())} {currencyFrom}</div>
                            </div>

                            {/* 2. FEES (Swapper Pays) */}
                            <div style={{ padding: '15px 20px', backgroundColor: '#fffbf2', borderBottom: '1px solid #f1f2f6' }}>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#e67e22', textTransform: 'uppercase' }}>+ Transaction Fees</h4>
                                <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>

                                    {/* Dynamic Fee Engine (Open Door Policy) */}
                                    {(() => {
                                        const fees = [];

                                        // 1. Core Fees
                                        fees.push({ label: 'Inbound', amount: principal * 0.015 + 0.30 });
                                        fees.push({ label: 'Card Liquidity', amount: principal * 0.005 });
                                        fees.push({ label: 'Symmetri Service', amount: principal * 0.005 });
                                        fees.push({ label: 'Gateway', amount: 2.50 });
                                        fees.push({ label: 'Premium Delivery', amount: principal * 0.015 });

                                        // 2. Regional Taxes (Dynamic)
                                        if (currencyToStr === 'ARS') {
                                            fees.push({ label: 'Argentine Bank Tax (0.6%)', amount: principal * 0.006 });
                                        }
                                        // Potential Future Expansion:
                                        // if (currencyToStr === 'DOP') fees.push({ label: 'DR Withholding', amount: ... });

                                        return fees.map((f, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#7f8c8d' }}>{f.label}</span>
                                                <span style={{ color: '#2c3e50' }}>+ {formatCurrency(f.amount.toString())} {currencyFrom}</span>
                                            </div>
                                        ));
                                    })()}

                                </div>
                            </div>

                            {/* 3. Total Paid */}
                            <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e1e8ed' }}>
                                <div style={{ fontWeight: '600', color: '#2c3e50' }}>Total Paid</div>
                                <div style={{ fontWeight: '700', color: '#2c3e50', fontSize: '18px' }}>{formatCurrency(paid.toString())} {currencyFrom}</div>
                            </div>

                            {/* 4. BENCHMARKING (Side-by-Side) */}
                            <div style={{ padding: '15px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#e8f8f5' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold', textTransform: 'uppercase' }}>Market Rate</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#2c3e50' }}>
                                        {(received / principal).toFixed(2)} {Array.isArray(currencyTo) ? currencyTo[0] : currencyTo}/EUR
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold', textTransform: 'uppercase' }}>Effective Rate</div>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#2c3e50' }}>
                                        {(received / paid).toFixed(2)} {Array.isArray(currencyTo) ? currencyTo[0] : currencyTo}/EUR
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '10px' }}>
                            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>Beneficiary Receives (Guaranteed)</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#27ae60' }}>
                                {formatCurrency(received.toString())} {currencyTo}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button
                        onClick={() => router.push('/swap')}
                        style={{
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#7f8c8d',
                            background: 'white',
                            border: '2px solid #e1e8ed',
                            borderRadius: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        Close
                    </button>
                </div>

                {/* Regulatory Notice */}
                <div style={{
                    marginTop: '40px',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '1px solid #e1e8ed'
                }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#7f8c8d', lineHeight: '1.6', textAlign: 'center' }}>
                        🔒 Legally compliant receipt for tax purposes. {currencyToStr === 'ARS' ? 'Includes CUIT validation.' : 'Includes DNI/NIE validation.'}
                    </p>
                </div>
            </main>
        </div>
    );
}
