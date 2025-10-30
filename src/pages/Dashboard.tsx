<<<<<<< HEAD
import { useState } from 'react';

export default function Dashboard({ user }) {
  const [beneficiaries, setBeneficiaries] = useState(user.initialBeneficiaries || []);
  const [newBeneficiary, setNewBeneficiary] = useState({
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    name: '',
    method: '',
    country: user.destinationCountry,
    kycId: '',
  });
<<<<<<< HEAD
  const [submissionStatus, setSubmissionStatus] = useState(null);
=======

  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>(null);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

  const handleAdd = () => {
    if (!newBeneficiary.name || !newBeneficiary.method) {
      alert('Please complete beneficiary name and method.');
      return;
    }

<<<<<<< HEAD
    setBeneficiaries([...beneficiaries, newBeneficiary]);
=======
    setBeneficiaries((prev) => [...prev, { ...(newBeneficiary as UIBeneficiary) }]);
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    setNewBeneficiary({ name: '', method: '', country: user.destinationCountry, kycId: '' });
  };

  const handleSubmitAuditPreview = async () => {
<<<<<<< HEAD
=======
    const first = beneficiaries[0] ?? {};
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    const payload = {
      senderIntent: {
        name: user.userName,
        originCurrency: user.originCurrency,
        kycId: user.kycId,
        contact: user.contact,
      },
      receiverIntent: {
<<<<<<< HEAD
        name: beneficiaries[0]?.name || '',
        method: beneficiaries[0]?.method || '',
        country: user.destinationCountry,
        kycId: beneficiaries[0]?.kycId || '',
=======
        name: first.name ?? '',
        method: first.method ?? '',
        country: first.country ?? user.destinationCountry,
        kycId: first.kycId ?? '',
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
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
<<<<<<< HEAD
      setSubmissionStatus(result);
    } catch (error) {
      console.error('Audit preview submission failed:', error);
      setSubmissionStatus({ success: false, message: 'Submission error. Please try again.' });
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    }
  };

  return (
    <div>
      <h2>Welcome, {user.userName}</h2>
<<<<<<< HEAD
      <p>You’ve registered to send <strong>{user.originCurrency}</strong> to a beneficiary in <strong>{user.destinationCountry}</strong>.</p>
=======
      <p>
        You’ve registered to send <strong>{user.originCurrency}</strong> to a beneficiary in{' '}
        <strong>{user.destinationCountry}</strong>.
      </p>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

      <h3>Your Reflected Beneficiaries</h3>
      <ul>
        {beneficiaries.map((b, i) => (
          <li key={i}>
<<<<<<< HEAD
            {b.name} — {b.method} ({b.country})
=======
            {b.name ?? '—'} — {b.method ?? '—'} ({b.country ?? user.destinationCountry})
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          </li>
        ))}
      </ul>

      <h4>Add a New Beneficiary</h4>
<<<<<<< HEAD
      <label>
        Name:
        <input value={newBeneficiary.name} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })} />
      </label>
      <label>
        Method:
        <input value={newBeneficiary.method} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, method: e.target.value })} />
      </label>
      <label>
        KYC ID:
        <input value={newBeneficiary.kycId} onChange={(e) => setNewBeneficiary({ ...newBeneficiary, kycId: e.target.value })} />
      </label>
      <button onClick={handleAdd}>Add Beneficiary</button>

      <h3>Audit Preview</h3>
      <pre>
        {JSON.stringify({
          senderIntent: user.userName,
          receiverIntent: beneficiaries[0]?.name || '—',
          corridor: user.originCurrency === 'USD' ? 'USD→MXP' : 'MXP→USD',
          fallbackAcknowledged: !!user.fallbackPreference,
        }, null, 2)}
      </pre>

      <button onClick={handleSubmitAuditPreview}>
=======

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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        Submit Audit Preview
      </button>

      {submissionStatus && (
<<<<<<< HEAD
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          border: `2px solid ${submissionStatus.success ? 'green' : 'red'}`,
          borderRadius: '8px',
          backgroundColor: submissionStatus.success ? '#e6ffe6' : '#ffe6e6'
        }}>
          <h4>{submissionStatus.success ? '✅ Valid Audit Preview' : '❌ Validation Failed'}</h4>
          <p>{submissionStatus.message}</p>
          {submissionStatus.timestamp && (
            <p><strong>Timestamp:</strong> {new Date(submissionStatus.timestamp).toLocaleString()}</p>
=======
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
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
          )}
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
