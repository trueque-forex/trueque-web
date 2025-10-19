import React from 'react';
import { useRouter } from 'next/router';

export default function KycGuide() {
  const router = useRouter();
  return (
    <main style={{ padding: 20 }}>
      <h1>What you need for KYC</h1>
      <p>Typical documents:</p>
      <ul>
        <li>Government-issued ID (passport, national ID, driver’s license)</li>
        <li>Selfie for liveness verification</li>
        <li>Proof of address (utility bill, bank statement less than 3 months old)</li>
      </ul>

      <p>Tips:</p>
      <ul>
        <li>Upload clear photos; ensure all corners of the document are visible.</li>
        <li>Use supported file types: JPG, PNG, PDF.</li>
        <li>If you encounter issues, contact support.</li>
      </ul>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => router.push('/kyc/upload')}>Start KYC</button>
        <button onClick={() => router.push('/kyc/status')} style={{ marginLeft: 8 }}>Back to status</button>
      </div>
    </main>
  );
}
