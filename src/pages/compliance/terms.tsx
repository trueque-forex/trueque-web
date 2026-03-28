import React from 'react';
import Header from '../../components/Header';
import brandConfig from '../../config/brand_config.json';

export default function TermsPage() {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            fontFamily: brandConfig.theme.fontFamily,
            color: '#000000'
        }}>
            <Header />

            <main style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px' }}>

                <section style={{ marginBottom: '40px', textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '700',
                        marginBottom: '10px',
                        letterSpacing: '-0.02em'
                    }}>
                        Terms of Service
                    </h1>
                    <p style={{ color: '#666666' }}>Last Updated: January 2026</p>
                </section>

                <hr style={{ border: 'none', borderTop: '1px solid #eeeeee', margin: '40px 0' }} />

                {/* 1. Nature of Services (Class 42/36 Support) */}
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>1. Nature of Services</h2>
                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#444444' }}>
                        {brandConfig.appName} is a software service provider designated for peer-to-peer reconciliation and corridor-based matching. Our platform functions strictly as a technical intermediary, providing the digital infrastructure necessary for users to identify, match, and verify reciprocal settlement obligations within supported global corridors.
                    </p>
                </section>

                {/* 2. No Handling of Funds (Critical) */}
                <section style={{
                    marginBottom: '50px',
                    backgroundColor: '#fff0f0', // Very light red/alert tint for legal emphasis
                    padding: '25px',
                    borderRadius: '8px',
                    border: '1px solid #ffcccc'
                }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px', color: '#cc0000' }}>2. No Handling of Funds</h2>
                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#444444', fontWeight: 'bold' }}>
                        {brandConfig.appName} does not receive, hold, transmit, or set aside custody of user funds at any time. All monetary values matched on the platform are executed, settled, and delivered directly between counterparties via external, regulated financial institutions or authorized payment service providers. {brandConfig.appName} never touches the principal amount.
                    </p>
                </section>

                {/* 3. Global Corridors (Agnostic) */}
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>3. Supported Global Corridors</h2>
                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#444444' }}>
                        The Platform facilitates matching across various supported global corridors. Availability of specific corridors is subject to local regulatory frameworks and banking rail interoperability. {brandConfig.appName} reserves the right to modify, suspend, or discontinue support for any specific corridor without prior notice.
                    </p>
                </section>

                {/* 4. User Responsibilities */}
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>4. User Verification</h2>
                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#444444' }}>
                        To ensure the integrity of the peer-to-peer network, all users must undergo mandatory identity verification. {brandConfig.appName} utilizes third-party providers to validate user identity documents and screen against global sanctions lists before enabling access to the matching engine.
                    </p>
                </section>

                {/* 5. Rate Integrity & Fees */}
                <section style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>5. Rate Integrity & Fees</h2>

                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#2c3e50' }}>Market Rate Parity</h3>
                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#444444', marginBottom: '20px' }}>
                        {brandConfig.appName} provides exchange rates aggregated from external, independent sources. We have no commercial interest in the fluctuation of these rates and do not apply any spread or margin to the mid-market rate.
                    </p>

                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#2c3e50' }}>Platform Service Fee</h3>
                    <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#444444' }}>
                        To sustain the efficiency and security of the network, {brandConfig.appName} charges a transparent Platform Service Fee. This fee is the sole source of revenue for the platform, ensuring our incentives are aligned with providing a highly efficient, profitable service without compromising rate parity.
                    </p>
                </section>

            </main>
        </div>
    );
}
