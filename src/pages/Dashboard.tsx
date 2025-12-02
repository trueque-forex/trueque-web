import React, { useState } from 'react';
import type { Beneficiary } from '@/types.ts';

type UIBeneficiary = Partial<Beneficiary> & {
  method?: string;
  country?: string;
  kycId?: string;
};

type UserProp = {
  userId?: string;
  userName: string;
  originCurrency: string;
  destinationCountry: string;
  kycId?: string;
  contact?: string;
  initialBeneficiaries?: UIBeneficiary[];
  fallbackPreference?: boolean | null;
};

type SubmissionStatus = {
  success: boolean;
  message: string;
  timestamp?: string;
  [k: string]: any;
} | null;

type Props = {
  user: UserProp;
};

export default function Dashboard({ user }: Props) {
  const [beneficiaries, setBeneficiaries] = useState<UIBeneficiary[]>(
    (user.initialBeneficiaries ?? []) as UIBeneficiary[]
  );

  const [newBeneficiary, setNewBeneficiary] = useState<UIBeneficiary>({
    name: '',
    method: '',
    country: user.destinationCountry,
    kycId: '',
  });

  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>(null);

  const handleAdd = () => {
    if (!newBeneficiary.name || !newBeneficiary.method) {
      alert('Please complete beneficiary name and method.');
      return;
    }

    setBeneficiaries((prev) => [...prev, { ...(newBeneficiary as UIBeneficiary) }]);
    setNewBeneficiary({ name: '', method: '', country: user.destinationCountry, kycId: '' });
  };

  const handleSubmitAuditPreview = async () => {
    const first = beneficiaries[0] ?? {};
    const payload = {
      senderIntent: {
        name: user.userName,
        originCurrency: user.originCurrency,
        kycId: user.kycId,
        contact: user.contact,
      },
      receiverIntent: {
        name: first.name ?? '',
        method: first.method ?? '',
        country: first.country ?? user.destinationCountry,
        kycId: first.kycId ?? '',
      },
      corridor: user.originCurrency === 'USD' ? 'USD→MXP' : 'MXP→USD',
      fallbackAcknowledged: !!user.fallbackPreference,
      compliance: {
        sanctionsScreened: true,
        transactionLimitOk: true,
        sourceOfFundsVerified: true,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/audit-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      const status: SubmissionStatus = {
        success: result.success === true,
        message: result.message ?? (result.error ? String(result.error) : 'No message returned'),
        timestamp: result.timestamp ?? result.createdAt ?? undefined,
        ...result,
      };
      setSubmissionStatus(status);
    } catch (error) {
      console.error('Audit preview submission failed:', error);
      setSubmissionStatus({
        success: false,
        message: 'Submission error. Please try again.',
      });
    }
  };

  return (
    <div>
      <h2>Welcome, {user.userName}</h2>
      <p>
        You’ve registered to send <strong>{user.originCurrency}</strong> to a beneficiary in{' '}
        <strong>{user.destinationCountry}</strong>.
      </p>

      <h3>Your Reflected Beneficiaries</h3>
      <ul>
        {beneficiaries.map((b, i) => (
          <li key={i}>
            {b.name ?? '—'} — {b.method ?? '—'} ({b.country ?? user.destinationCountry})
          </li>
        ))}
      </ul>

      <h4>Add a New Beneficiary</h4>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Name:
        <input
          value={newBeneficiary.name ?? ''}
          onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
          style={{ marginLeft: 8 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        Method:
        <input
          value={newBeneficiary.method ?? ''}
          onChange={(e) => setNewBeneficiary({ ...newBeneficiary, method: e.target.value })}
          style={{ marginLeft: 8 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 8 }}>
        KYC ID:
        <input
          value={newBeneficiary.kycId ?? ''}
          onChange={(e) => setNewBeneficiary({ ...newBeneficiary, kycId: e.target.value })}
          style={{ marginLeft: 8 }}
        />
      </label>

      <button onClick={handleAdd} style={{ marginTop: 8 }}>
        Add Beneficiary
      </button>

      <h3 style={{ marginTop: 20 }}>Audit Preview</h3>
      <pre style={{ background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
        {JSON.stringify(
          {
            senderIntent: user.userName,
            receiverIntent: beneficiaries[0]?.name ?? '—',
            corridor: user.originCurrency === 'USD' ? 'USD→MXP' : 'MXP→USD',
            fallbackAcknowledged: !!user.fallbackPreference,
          },
          null,
          2
        )}
      </pre>

      <button onClick={handleSubmitAuditPreview} style={{ marginTop: 8 }}>
        Submit Audit Preview
      </button>

      {submissionStatus && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            border: `2px solid ${submissionStatus.success ? 'green' : 'red'}`,
            borderRadius: '8px',
            backgroundColor: submissionStatus.success ? '#e6ffe6' : '#ffe6e6',
          }}
        >
          <h4>{submissionStatus.success ? 'Valid Audit Preview' : 'Validation Failed'}</h4>
          <p>{submissionStatus.message}</p>
          {submissionStatus.timestamp && (
            <p>
              <strong>Timestamp:</strong> {new Date(submissionStatus.timestamp).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
