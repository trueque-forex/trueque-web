import React from 'react';
import Header from '../../components/Header';
import brandConfig from '../../config/brand_config.json';

export default function AboutPage() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            fontFamily: brandConfig.theme.fontFamily,
            color: '#000000'
        }}>
            <Header />

            <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>

                {/* 1. Mission Statement */}
                <section style={{ marginBottom: '60px', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        marginBottom: '20px',
                        letterSpacing: '-0.02em'
                    }}>
                        Mission Statement
                    </h1>
                    <p style={{
                        fontSize: '20px',
                        lineHeight: '1.6',
                        fontWeight: '400',
                        color: '#333333'
                    }}>
                        To streamline the path to global financial balance by providing technical symmetry and absolute parity, in a highly efficient, profitable platform.
                    </p>
                </section>

                <hr style={{ border: 'none', borderTop: '1px solid #eeeeee', margin: '40px 0' }} />

                {/* 2. The Technology */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '15px' }}>The Technology</h2>
                    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#444444' }}>
                        {brandConfig.appName} operates as a technology-first matching engine and technical intermediary. We do not act as a bank or hold funds; instead, we provide the infrastructure for corridor-based reconciliation, enabling direct peer-to-peer settlement verification.
                    </p>
                </section>

                {/* 3. Transparency Pledge */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '15px' }}>Transparency Pledge</h2>
                    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#444444' }}>
                        We believe in absolute truth in pricing. All market exchange rates displayed on our platform are aggregated from external, independent sources. {brandConfig.appName} has no commercial interest in the fluctuation of these rates and provides them strictly as a reference for fair value.
                    </p>
                </section>

                {/* 4. Zero-Profit Clause */}
                <section style={{
                    backgroundColor: '#f9f9f9',
                    padding: '30px',
                    borderRadius: '8px',
                    border: '1px solid #eeeeee'
                }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '15px', color: '#000000' }}>Zero-Profit Clause</h2>
                    <p style={{ fontSize: '16px', lineHeight: '1.8', color: '#444444', marginBottom: 0 }}>
                        {brandConfig.appName} explicitly states that it does not profit from the exchange rate itself. We do not add a spread, margin, or hidden markup to the market rates. Our platform connects users at parity, ensuring that the value sent is the value calculated at the true market midpoint.
                    </p>
                </section>

            </main>
        </div>
    );
}
