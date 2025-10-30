// src/pages/kyc/certificate.tsx
import React from 'react';
import { useRouter } from 'next/router';

export default function KycCertificatePage() {
  const router = useRouter();

  return (
    <main style={{ padding: 20 }}>
      <h1>KYC certificate</h1>
      <p>If your KYC is approved, a downloadable certificate will appear here.</p>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => router.push('/kyc/status')}>Back to KYC status</button>
      </div>
    </main>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
