import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';

interface Transaction {
    id: string;
    amount: number;
    currencyFrom: string;
    currencyTo: string;
    status: string;
    date: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/history')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setTransactions(data);
                }
            })
            .catch(err => console.error("Failed to fetch history", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
            <Header />

            <main style={{ maxWidth: 800, margin: '40px auto', padding: '0 20px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '30px' }}>My Swaps</h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📝</div>
                            <div style={{ marginTop: '20px', color: '#95a5a6' }}>
                                No past transactions found.
                            </div>

                            <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    style={{
                                        padding: '12px 24px',
                                        border: '1px solid #bdc3c7',
                                        backgroundColor: 'white',
                                        color: '#7f8c8d',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    ← Back to Dashboard
                                </button>

                                <button
                                    onClick={() => router.push('/amount-selection')}
                                    style={{
                                        padding: '12px 24px',
                                        border: 'none',
                                        backgroundColor: '#4A90E2',
                                        color: 'white',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
                                    }}
                                >
                                    Start New Swap →
                                </button>
                            </div>          </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {transactions.map((tx) => (
                                <div key={tx.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '20px', borderRadius: '12px', border: '1px solid #e1e8ed', backgroundColor: '#fff'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%',
                                            backgroundColor: '#eafaf1', color: '#27ae60', fontSize: '20px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            💸
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>
                                                Sent {tx.amount.toFixed(2)} {tx.currencyFrom}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                                                {new Date(tx.date).toLocaleDateString()} • {tx.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50' }}>
                                            → {tx.currencyTo}
                                        </div>
                                        <span style={{
                                            fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px',
                                            backgroundColor: tx.status === 'confirmed' || tx.status === 'SETTLED' ? '#d4efdf' : '#fcf3cf',
                                            color: tx.status === 'confirmed' || tx.status === 'SETTLED' ? '#196f3d' : '#f1c40f',
                                            textTransform: 'uppercase'
                                        }}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
