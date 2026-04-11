import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import apiFetch from '../../lib/apiFetch';

// Types
type TxStatus = 'initiated' | 'screening' | 'processing' | 'completed' | 'failed';
type Transaction = {
    id: string;
    status: TxStatus;
    amount: number;
    currency_to: string;
    description: string;
    created_at: string;
};

// Mock Gateway Messages
const GATEWAY_LOGS = [
    { status: 'initiated', msg: 'Transaction initiated by user.' },
    { status: 'screening', msg: 'Performing AML/KYC checks...' },
    { status: 'processing', msg: 'Liquidity secured. Routing to local rails.' },
    { status: 'completed', msg: 'Funds delivered to beneficiary bank account.' },
];

export default function TrackTransactionPage() {
    const router = useRouter();
    const { txid } = router.query;
    const [tx, setTx] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!txid) return;

        let pollInterval: NodeJS.Timeout;

        const fetchStatus = async () => {
            try {
                // In real app: GET /api/transactions/[txid]
                // For demo, we might need to mock if API returns static 'completed'
                const { json } = await apiFetch<Transaction>(`/api/transactions/${txid}`);

                // MOCK override for demo visualization (Simulate progression)
                // If created < 10s ago -> screening. < 20s -> processing. > 20s -> completed.
                // For now, let's just use the API response if it supports status.
                // If API allows, we'd use json.status. 
                // Since API mock is static 'completed', let's simulate "Live Ops" for the user 
                // based on client-side time for the "WOW" effect requested.

                // Simulate "Live" Loading state
                const now = Date.now();
                // We'll fake a status based on how long user has been on this page for the demo?
                // Or just show Completed if it is completed.

                if (!json) return;
                setTx(json);

                // Build logs based on status
                const currentStatusIdx = ['initiated', 'screening', 'processing', 'completed'].indexOf(json.status || 'completed');
                setLogs(GATEWAY_LOGS.filter((_, i) => i <= currentStatusIdx));

            } catch (e) {
                console.error("Failed to track tx", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        pollInterval = setInterval(fetchStatus, 5000); // Poll every 5s

        return () => clearInterval(pollInterval);
    }, [txid]);

    const getStatusStep = () => {
        if (!tx) return 0;
        const map: Record<string, number> = { 'initiated': 0, 'screening': 1, 'processing': 2, 'completed': 3 };
        return map[tx.status] ?? 0;
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Connecting to Gateway...</div>;
    if (!tx) return <div style={{ padding: 40, textAlign: 'center' }}>Transaction not found</div>;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <header style={{
                background: 'white', padding: '20px 40px', borderBottom: '1px solid #e1e8ed',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>Tracking {String(txid).substring(0, 8)}...</div>
                <button onClick={() => router.push('/beneficiary-selection')} style={{ border: 'none', background: 'none', color: '#4A90E2', cursor: 'pointer' }}>Close</button>
            </header>

            <main style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>

                {/* Status Card */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                        {tx.status === 'completed' ? '✅' : tx.status === 'failed' ? '❌' : '⏱️'}
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px', textTransform: 'capitalize' }}>
                        {tx.status}
                    </h1>
                    <p style={{ color: '#7f8c8d' }}>
                        {tx.amount} {tx.currency_to} to Beneficiary
                    </p>
                </div>

                {/* Timeline */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#2c3e50' }}>Live Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        <TimelineItem active={getStatusStep() >= 0} done={getStatusStep() > 0} title="Received" date={tx.created_at} last={false} />
                        <TimelineItem active={getStatusStep() >= 1} done={getStatusStep() > 1} title="Compliance Checks" desc="verifying source of funds" last={false} />
                        <TimelineItem active={getStatusStep() >= 2} done={getStatusStep() > 2} title="Processing" desc="routing to local partner" last={false} />
                        <TimelineItem active={getStatusStep() >= 3} done={getStatusStep() >= 3} title="Delivered" desc="funds available in account" last={true} />
                    </div>
                </div>

                {/* Gateway Logs */}
                <div style={{ marginTop: '30px', padding: '20px', background: '#2c3e50', borderRadius: '12px', color: '#ecf0f1', fontFamily: 'monospace', fontSize: '13px' }}>
                    <div style={{ marginBottom: '10px', color: '#bdc3c7', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Gateway Stream</div>
                    {logs.map((l, i) => (
                        <div key={i} style={{ marginBottom: '5px' }}>
                            <span style={{ color: '#f1c40f' }}>➜</span> [{l.status}] {l.msg}
                        </div>
                    ))}
                    {tx.status !== 'completed' && (
                        <div style={{ animation: 'blink 1s infinite' }}>_</div>
                    )}
                </div>

            </main>
        </div>
    );
}

function TimelineItem({ active, done, title, desc, date, last }: any) {
    return (
        <div style={{ display: 'flex', gap: '15px', minHeight: '60px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: done ? '#27ae60' : active ? '#3498db' : '#ecf0f1',
                    border: '2px solid white', boxShadow: '0 0 0 2px ' + (done ? '#27ae60' : active ? '#3498db' : '#ecf0f1'),
                    zIndex: 1
                }} />
                {!last && <div style={{ flex: 1, width: '2px', backgroundColor: done ? '#27ae60' : '#ecf0f1', margin: '5px 0' }} />}
            </div>
            <div style={{ paddingBottom: '20px', opacity: active ? 1 : 0.5 }}>
                <div style={{ fontWeight: '600', color: '#2c3e50' }}>{title}</div>
                {(desc || date) && <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{desc || new Date(date).toLocaleTimeString()}</div>}
            </div>
        </div>
    );
}
