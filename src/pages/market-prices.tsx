import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchExchangeRate } from '../lib/exchangeRate';
import Header from '../components/Header';

const CURRENCIES = [
    { country: 'Argentina', code: 'ARS', symbol: '$', flag: '🇦🇷' },
    { country: 'Bolivia', code: 'BOB', symbol: 'Bs', flag: '🇧🇴' },
    { country: 'Brazil', code: 'BRL', symbol: 'R$', flag: '🇧🇷' },
    { country: 'Colombia', code: 'COP', symbol: '$', flag: '🇨🇴' },
    { country: 'El Salvador', code: 'USD', symbol: '$', flag: '🇸🇻' },
    { country: 'Guatemala', code: 'GTQ', symbol: 'Q', flag: '🇬🇹' },
    { country: 'Mexico', code: 'MXN', symbol: '$', flag: '🇲🇽' },
    { country: 'Portugal', code: 'EUR', symbol: '€', flag: '🇵🇹' },
    { country: 'Spain', code: 'EUR', symbol: '€', flag: '🇪🇸' },
    { country: 'United States', code: 'USD', symbol: '$', flag: '🇺🇸' },
    { country: 'Venezuela', code: 'VES', symbol: 'Bs.S', flag: '🇻🇪' },
];

export default function MarketPricesPage() {
    const router = useRouter();
    const [rates, setRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllRates = async () => {
            const newRates: Record<string, number> = {};
            // Base currency is USD for comparison
            const baseCode = 'USD';

            for (const curr of CURRENCIES) {
                if (curr.code === baseCode) continue;
                try {
                    const rate = await fetchExchangeRate(baseCode, curr.code);
                    newRates[curr.code] = rate;
                } catch (e) {
                    console.error(`Failed to fetch rate for ${curr.code}`, e);
                }
            }
            setRates(newRates);
            setLoading(false);
        };

        fetchAllRates();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('trueque_session');
        router.push('/signin');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
            <Header />

            {/* Main Content */}
            <main style={{ maxWidth: 1000, margin: '40px auto', padding: '0 40px' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    padding: '40px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                    <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '30px' }}>
                        Current Exchange Rates (Base: USD)
                    </h2>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
                            Loading rates...
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                            {CURRENCIES.filter(c => c.code !== 'USD').map((curr) => (
                                <div key={curr.country} style={{
                                    padding: '20px',
                                    border: '1px solid #e1e8ed',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span style={{ fontSize: '32px' }}>{curr.flag}</span>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#2c3e50' }}>{curr.country}</div>
                                            <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{curr.code}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#27ae60' }}>
                                        {rates[curr.code] ? rates[curr.code].toFixed(2) : '---'}
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
