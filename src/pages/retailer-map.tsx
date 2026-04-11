import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import retailers from '../config/retailers.json';

/**
 * /retailer-map
 *
 * Shows a Leaflet map of where vouchers have been redeemed in Mexico.
 * Access is controlled by VOUCHER_MAP_ACCESS in /api/vouchers/redemption-map.ts:
 *   - 'sender' → sender sees only their own redeemed vouchers
 *   - 'admin'  → all redemptions across all users
 * To flip: change that one constant in the API file.
 *
 * Uses Leaflet via CDN — no npm install required.
 */

type Pin = {
    retailer_id: string;
    retailer_name: string;
    logo: string;
    lat: number;
    lng: number;
    city: string;
    count: number;
    total_local: number;
    local_currency: string;
    last_redeemed: string;
    redemptions: { code: string; beneficiary_name: string; amount_local: number; redeemed_at: string }[];
};

const RETAILER_COLORS: Record<string, string> = {
    walmart_mx: '#0071ce',
    oxxo_mx: '#e30613',
    soriana_mx: '#00923f',
    farmacias_similares_mx: '#008000',
    coppel_mx: '#003087',
};

export default function RetailerMap() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [pins, setPins] = useState<Pin[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [totalRedeemed, setTotalRedeemed] = useState(0);
    const [totalValue, setTotalValue] = useState(0);
    const [leafletReady, setLeafletReady] = useState(false);

    // MERCHANT-ONLY: redirect regular users back to dashboard
    useEffect(() => {
        if (!authLoading && (user as any)?.userType !== 'MERCHANT') {
            router.replace('/dashboard');
        }
    }, [user, authLoading, router]);

    // Load Leaflet CSS + JS from CDN (no npm install needed)
    useEffect(() => {
        if (document.getElementById('leaflet-css')) { setLeafletReady(true); return; }
        const css = document.createElement('link');
        css.id = 'leaflet-css';
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setLeafletReady(true);
        document.head.appendChild(script);
    }, []);

    // Fetch redemption data — session cookie carries identity via withAuth
    useEffect(() => {
        fetch('/api/vouchers/redemption-map')
            .then(r => r.json())
            .then(data => {
                setPins(data.pins || []);
                setTotalRedeemed(data.total_redeemed || 0);
                setTotalValue(data.total_value || 0);
            })
            .catch(() => {
                setPins([]);
            })
            .finally(() => setLoading(false));
    }, []);

    // Init Leaflet map once ready + pins loaded
    useEffect(() => {
        if (!leafletReady || !mapRef.current || mapInstance.current) return;
        const L = (window as any).L;
        if (!L) return;

        const map = L.map(mapRef.current).setView([23.6, -102.5], 5); // Mexico center
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(map);
        mapInstance.current = map;
    }, [leafletReady]);

    // Add/update markers when pins or filter changes
    useEffect(() => {
        if (!leafletReady || !mapInstance.current) return;
        const L = (window as any).L;
        if (!L) return;
        const map = mapInstance.current;

        // Clear existing markers
        map.eachLayer((layer: any) => { if (layer instanceof L.Marker) map.removeLayer(layer); });

        const filtered = filter === 'all' ? pins : pins.filter(p => p.retailer_id === filter);

        filtered.forEach(pin => {
            const color = RETAILER_COLORS[pin.retailer_id] || '#7c3aed';
            const icon = L.divIcon({
                html: `<div style="background:${color};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white">${pin.logo}</div>`,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });
            const popup = `
                <div style="font-family:Inter,sans-serif;min-width:160px">
                    <div style="font-weight:800;font-size:15px;margin-bottom:4px">${pin.logo} ${pin.retailer_name}</div>
                    <div style="color:#7c3aed;font-weight:700;font-size:18px">${pin.count} redemption${pin.count !== 1 ? 's' : ''}</div>
                    <div style="color:#64748b;font-size:13px">${pin.city || 'Mexico'}</div>
                    <div style="font-size:13px;margin-top:6px;color:#1e293b">
                        Total: <strong>${pin.total_local.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${pin.local_currency}</strong>
                    </div>
                    ${pin.redemptions.slice(0, 2).map(r =>
                        `<div style="font-size:11px;color:#94a3b8;margin-top:4px">• ${r.beneficiary_name} · ${new Date(r.redeemed_at).toLocaleDateString()}</div>`
                    ).join('')}
                </div>`;
            L.marker([pin.lat, pin.lng], { icon }).bindPopup(popup).addTo(map);
        });

        // Also add seed locations for retailers with no redemptions (greyed out)
        if (filter === 'all' && pins.length === 0) {
            (retailers as any[]).forEach(r => {
                (r.locations || []).forEach((loc: any) => {
                    const icon = L.divIcon({
                        html: `<div style="background:#e2e8f0;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;opacity:0.5">${r.logo}</div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16],
                    });
                    L.marker([loc.lat, loc.lng], { icon })
                        .bindPopup(`<div style="font-family:Inter,sans-serif"><strong>${r.logo} ${r.name}</strong><br/><span style="color:#94a3b8;font-size:12px">${loc.city} · No redemptions yet</span></div>`)
                        .addTo(mapInstance.current);
                });
            });
        }
    }, [pins, filter, leafletReady]);

    const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', fontFamily: "'Inter', sans-serif" }}>
            <Head>
                <title>Symmetri | Retailer Analytics</title>
                <meta name="description" content="Retailer dashboard: see where your vouchers are being redeemed across Mexico." />
                <meta name="robots" content="noindex" />
            </Head>
            <Header />
            <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px' }}>

                {/* Page Header */}
                <div style={{ marginBottom: '28px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#7c3aed', letterSpacing: '0.1em', marginBottom: '6px' }}>
                        Phase 1 · Retailer Analytics
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '0 0 8px' }}>Redemption Map</h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Voucher redemptions at your stores across Mexico.</p>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    {[
                        { label: 'Vouchers Redeemed', value: totalRedeemed, icon: '✅' },
                        { label: 'Total Value (MXN)', value: totalValue > 0 ? `$${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—', icon: '💰' },
                        { label: 'Retailers Active', value: new Set(pins.map(p => p.retailer_id)).size, icon: '🏪' },
                    ].map(s => (
                        <div key={s.label} style={{ background: '#1e293b', borderRadius: '14px', padding: '20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{s.icon}</div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: 'white' }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Filter Row */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <button onClick={() => setFilter('all')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filter === 'all' ? '#7c3aed' : '#1e293b', color: filter === 'all' ? 'white' : '#94a3b8', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                        All Retailers
                    </button>
                    {(retailers as any[]).map(r => (
                        <button key={r.id} onClick={() => setFilter(r.id)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filter === r.id ? RETAILER_COLORS[r.id] || '#7c3aed' : '#1e293b', color: filter === r.id ? 'white' : '#94a3b8', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
                            {r.logo} {r.name}
                        </button>
                    ))}
                </div>

                {/* Map Container */}
                <div style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.4)', marginBottom: '28px' }}>
                    {(!leafletReady || loading) && (
                        <div style={{ position: 'absolute', inset: 0, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '20px' }}>
                            <div style={{ color: '#7c3aed', fontSize: '16px', fontWeight: '700' }}>
                                {loading ? 'Loading redemption data…' : 'Initializing map…'}
                            </div>
                        </div>
                    )}
                    <div ref={mapRef} style={{ height: '480px', width: '100%' }} />
                </div>

                {/* Redemption List */}
                {pins.length > 0 && (
                    <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px' }}>
                        <div style={{ fontWeight: '700', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Recent Redemptions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {pins.flatMap(p => p.redemptions.map(r => ({ ...r, retailer_name: p.retailer_name, logo: p.logo, city: p.city, currency: p.currency })))
                                .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
                                .slice(0, 6)
                                .map((r, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#0f172a', borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '20px' }}>{r.logo}</span>
                                            <div>
                                                <div style={{ fontWeight: '700', color: 'white', fontSize: '14px' }}>{r.beneficiary_name}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{r.retailer_name} · {r.city}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '700', color: '#22c55e', fontSize: '15px' }}>
                                                {r.amount_local.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {(r as any).local_currency}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#475569' }}>{fmt(r.redeemed_at)}</div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {pins.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '60px', background: '#1e293b', borderRadius: '16px', color: '#475569' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
                        <div style={{ fontWeight: '700', color: '#64748b', fontSize: '18px', marginBottom: '8px' }}>No redemptions yet</div>
                        <p style={{ fontSize: '14px', margin: '0 0 20px' }}>The map will populate once your beneficiaries redeem their vouchers.</p>
                        <button onClick={() => router.push('/voucher')} style={{ padding: '12px 24px', background: '#7c3aed', color: 'white', fontWeight: '700', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
                            Send a Voucher
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
