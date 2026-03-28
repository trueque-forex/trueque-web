
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Types
interface FXData {
    consensus_rate: number;
    variance: number;
    is_unstable: boolean;
    sources: Record<string, number>;
}

interface AuditLog {
    id: number;
    alert_type: string;
    details: string;
    investigative_narrative?: string;
    timestamp: string;
}

interface Vitals {
    field_encryption: boolean;
    blind_indexing: boolean;
    audit_vault_connected: boolean;
    timestamp: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [fxData, setFxData] = useState<FXData | null>(null);
    const [auditFeed, setAuditFeed] = useState<AuditLog[]>([]);
    const [vitals, setVitals] = useState<Vitals | null>(null);
    const [subsidy, setSubsidy] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            // 1. FX
            const fxRes = await fetch('http://localhost:8000/api/admin/fx-live');
            const fxJson = await fxRes.json();
            if (fxJson.success) setFxData(fxJson.data);

            // 2. Audit
            const auditRes = await fetch('http://localhost:8000/api/admin/audit-feed');
            const auditJson = await auditRes.json();
            if (auditJson.success) setAuditFeed(auditJson.feed);

            // 3. Vitals
            const vitalsRes = await fetch('http://localhost:8000/api/admin/security-status');
            const vitalsJson = await vitalsRes.json();
            if (vitalsJson.success) setVitals(vitalsJson.vitals);

            // 4. Subsidy
            const subRes = await fetch('http://localhost:8000/api/admin/social-subsidy');
            const subJson = await subRes.json();
            if (subJson.success) setSubsidy(subJson.fund_total);

        } catch (e) {
            console.error("Dashboard fetch failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // 5s Refresh
        return () => clearInterval(interval);
    }, []);

    if (loading && !fxData) return <div className="p-10 text-white">Loading Admin Console...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                        Trueque Integrity Dashboard
                    </h1>
                    <p className="text-slate-400 text-sm">Glass Box Compliance & Integrity Monitoring</p>
                </div>
                <button
                    onClick={() => alert("Downloading JSON Report...")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-indigo-500/30"
                >
                    Download Investor DD
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* COL 1: FX Consensus */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="text-emerald-400">⚡</span> FX Market Truth
                        </h2>

                        {fxData && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {Object.entries(fxData.sources).map(([source, rate]) => (
                                    <div key={source} className="bg-slate-900/50 p-4 rounded-lg border border-slate-600 text-center">
                                        <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{source}</p>
                                        <p className="text-lg font-mono text-white">{rate.toFixed(4)}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`p-4 rounded-lg border flex justify-between items-center ${fxData?.is_unstable ? 'bg-red-900/20 border-red-500/50' : 'bg-emerald-900/20 border-emerald-500/50'}`}>
                            <div>
                                <p className="text-sm font-medium opacity-80">Consensus Median (Used for Quotes)</p>
                                <p className="text-3xl font-bold font-mono tracking-tight">{fxData?.consensus_rate.toFixed(6)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase text-slate-400">Variance</p>
                                <p className={`text-xl font-bold ${fxData?.is_unstable ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {(fxData?.variance! * 100).toFixed(4)}%
                                </p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${fxData?.is_unstable ? 'bg-red-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>
                                    {fxData?.is_unstable ? 'UNSTABLE' : 'STABLE'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Social Subsidy */}
                    <section className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="text-yellow-400">🤝</span> Social Subsidy Fund
                        </h2>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-white">${subsidy.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="text-slate-400 mb-1">collected (0.2% Premium)</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                            <div className="bg-yellow-400 h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Target: $5,000 for Community Grants</p>
                    </section>
                </div>

                {/* COL 2: Vitals & Audit */}
                <div className="space-y-6">

                    {/* Security Vitals */}
                    <section className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Security Vitals</h2>
                        <div className="space-y-3">
                            <VitalRow label="AES-256 Encryption" active={vitals?.field_encryption} />
                            <VitalRow label="Blind Indexing" active={vitals?.blind_indexing} />
                            <VitalRow label="Audit Vault Sealed" active={vitals?.audit_vault_connected} />
                        </div>
                    </section>

                    {/* Live Audit Feed */}
                    <section className="bg-slate-800 rounded-xl p-0 border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[500px]">
                        <div className="p-4 border-b border-slate-700 bg-slate-850">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Live Audit Stream
                            </h2>
                        </div>
                        <div className="overflow-y-auto p-0 flex-1 scrollbar-thin scrollbar-thumb-slate-600">
                            {auditFeed.map((log) => (
                                <div key={log.id} className="p-4 border-b border-slate-700/50 hover:bg-slate-750 transition text-sm">
                                    <p className="text-xs text-slate-500 mb-1 font-mono">{log.timestamp.split('T')[1].substring(0, 8)} | {log.alert_type}</p>
                                    <p className="text-slate-200 mb-1">{log.details}</p>
                                    {log.investigative_narrative && (
                                        <div className="mt-2 bg-indigo-900/30 border-l-2 border-indigo-500 p-2 text-xs text-indigo-200">
                                            {log.investigative_narrative}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}

function VitalRow({ label, active }: { label: string, active?: boolean }) {
    return (
        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-slate-300">{label}</span>
            {active ? (
                <span className="flex items-center gap-1 text-emerald-400 text-sm font-bold">
                    ✓ ACTIVE
                </span>
            ) : (
                <span className="flex items-center gap-1 text-red-400 text-sm font-bold">
                    ⚠ FAILED
                </span>
            )}
        </div>
    );
}
