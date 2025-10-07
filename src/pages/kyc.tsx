// src/pages/kyc.tsx

import { useState } from 'react';
import KYCForm from '@/components/KYCForm';

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<'pending' | 'verified' | 'flagged'>('pending');

  const handleVerify = (kycData: any) => {
    console.log('KYC submitted:', kycData);
    // Simulate verification logic
    setKycStatus('verified');
  };

  return (
    <main className="min-h-screen px-6 py-10 bg-gray-50">
      {kycStatus === 'verified' ? (
        <p className="text-lg font-medium text-green-700">
          ✅ KYC Verified. You’re ready to match remittance needs.
        </p>
      ) : (
        <KYCForm onVerify={handleVerify} />
      )}
    </main>
  );
}