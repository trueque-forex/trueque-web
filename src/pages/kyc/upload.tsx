// src/pages/kyc/upload.tsx
import React from 'react';
import { useRouter } from 'next/router';

export default function KycUploadPage() {
  const router = useRouter();

  return (
    <main style={{ padding: 20 }}>
      <h1>Upload KYC documents</h1>
      <p>This is a minimal upload placeholder. Implement document upload and submission here.</p>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => router.push('/kyc/status')}>Back to KYC status</button>
      </div>
    </main>
  );
}