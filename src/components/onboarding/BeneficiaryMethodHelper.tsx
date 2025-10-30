import React, { useState } from 'react';

type Beneficiary = {
  id: string;
  status: 'pending_screening' | 'approved' | 'review_required' | 'blocked' | 'archived';
  name?: string;
  country?: string;
  method?: string;
  identifiers?: Record<string,string>;
};

type Props = {
  onMethodChange: (value: string) => void; // keeps existing contract
  onCreated?: (b: Beneficiary) => void;     // optional callback returning created+screened beneficiary
};

export default function BeneficiaryMethodHelper({ onMethodChange, onCreated }: Props) {
  const [methodType, setMethodType] = useState('');
  const [details, setDetails] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setMethodType(e.target.value);
    setDetails({});
    onMethodChange(''); // Clear parent value
  }

  function handleDetailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    const updated = { ...details, [name]: value };
    setDetails(updated);

    const formatted = formatMethod(methodType, updated);
    onMethodChange(formatted);
  }

  function formatMethod(type: string, data: Record<string,string>) {
    switch (type) {
      case 'phone':
        return `phone:${data.countryCode || ''}-${data.number || ''}`;
      case 'wallet':
        return `wallet:${data.address || ''}`;
      case 'bank':
        return `bank:${data.bankName || ''}:${data.accountNumber || ''}`;
      case 'card':
        return `card:${data.issuer || ''}:${data.cardNumber || ''}`;
      default:
        return '';
    }
  }

  async function submitAndScreen() {
    setError(null);
    const minimalValidation = (() => {
      if (methodType === 'phone' && !details.number) return 'Phone number required';
      if (methodType === 'wallet' && !details.address) return 'Wallet address required';
      if (methodType === 'bank' && !details.accountNumber) return 'Account number required';
      if (methodType === 'card' && !details.cardNumber) return 'Card number required';
      return null;
    })();

    if (minimalValidation) {
      setError(minimalValidation);
      return;
    }

    setLoading(true);
    try {
      // Create beneficiary
      const createRes = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: details.name || '',
          country: details.country || '',
          method: methodType,
          identifiers: details,
        }),
      });
      if (!createRes.ok) throw new Error(`Create failed: ${createRes.status}`);
      const created = await createRes.json();

      // Trigger screening (sync). Optionally you can let backend queue this.
      const screenRes = await fetch(`/api/beneficiaries/${created.id}/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!screenRes.ok) throw new Error(`Screening failed: ${screenRes.status}`);
      const screened = await screenRes.json();

      if (onCreated) onCreated(screened);
      // keep parent method string for form storage
      onMethodChange(formatMethod(methodType, details));
    } catch (e: any) {
      setError(e.message || 'Error creating beneficiary');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label>
        How will your beneficiary receive funds?
        <select value={methodType} onChange={handleTypeChange} required>
          <option value="">Select Method</option>
          <option value="phone">Phone (SMS or mobile money)</option>
          <option value="wallet">Wallet (crypto or digital)</option>
          <option value="bank">Bank Account</option>
          <option value="card">Card (prepaid or debit)</option>
        </select>
      </label>

      {methodType === 'phone' && (
        <>
          <label>
            Country Code:
            <input name="country" placeholder="Country (ISO2)" onChange={handleDetailChange} />
          </label>
          <label>
            Phone Number:
            <input name="number" onChange={handleDetailChange} />
          </label>
        </>
      )}

      {methodType === 'wallet' && (
        <label>
          Wallet Address:
          <input name="address" onChange={handleDetailChange} />
        </label>
      )}

      {methodType === 'bank' && (
        <>
          <label>
            Bank Name:
            <input name="bankName" onChange={handleDetailChange} />
          </label>
          <label>
            Account Number:
            <input name="accountNumber" onChange={handleDetailChange} />
          </label>
        </>
      )}

      {methodType === 'card' && (
        <>
          <label>
            Card Issuer:
            <input name="issuer" onChange={handleDetailChange} />
          </label>
          <label>
            Card Number:
            <input name="cardNumber" onChange={handleDetailChange} />
          </label>
        </>
      )}

      {error && <p className="text-red-600">{error}</p>}
      <div className="mt-2">
        <button onClick={submitAndScreen} disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded">
          {loading ? 'Adding…' : 'Add beneficiary and screen'}
        </button>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
