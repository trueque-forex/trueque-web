// src/components/onboarding/RegisterUser.tsx
import React, { useState } from 'react';
import BeneficiaryMethodHelper from './BeneficiaryMethodHelper';

type FormData = {
  beneficiaryMethod?: string;
  beneficiary?: any;
};

export default function RegisterUser() {
  const [formData, setFormData] = useState<FormData>({});

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Register beneficiary</h2>

      <BeneficiaryMethodHelper
        onMethodChange={(value) => setFormData((prev: any) => ({ ...prev, beneficiaryMethod: value }))}
        onCreated={(b) => setFormData((prev: any) => ({ ...prev, beneficiary: b }))}
      />

      <div className="mt-4 text-sm">
        <strong>Current form state</strong>
        <pre className="bg-gray-50 p-2 rounded text-xs">{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </section>
  );
}