// src/pages/kyc/submission.tsx
import React from 'react';
import { useRouter } from 'next/router';

export default function KycSubmissionPage() {
  const router = useRouter();

  return (
    <main style={{ padding: 20 }}>
      <h1>KYC submission</h1>
      <p>We received your documents and are reviewing them. This is a placeholder page that can show uploaded files and status.</p>
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
