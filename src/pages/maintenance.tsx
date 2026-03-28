
import React from 'react';
import brandConfig from '../config/brand_config.json';
import Head from 'next/head';

export default function MaintenancePage() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f7fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#2c3e50',
            textAlign: 'center',
            padding: '20px'
        }}>
            <Head>
                <title>Maintenance | {brandConfig.appName}</title>
            </Head>

            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛠️</div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px' }}>
                System Maintenance
            </h1>
            <p style={{ fontSize: '18px', maxWidth: '500px', lineHeight: '1.6', color: '#7f8c8d' }}>
                We are currently performing essential security updates.
                <br />
                Please check back shortly.
            </p>
            <div style={{ marginTop: '30px', padding: '15px', background: '#fff', border: '1px solid #e1e8ed', borderRadius: '8px', fontSize: '14px', color: '#95a5a6' }}>
                Error Code: SEC_MISSING_CONFIG
            </div>
        </div>
    );
}
