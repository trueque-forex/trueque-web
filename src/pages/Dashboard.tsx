import { useState } from 'react';

export default function Dashboard({ user }) {
  const [beneficiaries, setBeneficiaries] = useState(user.initialBeneficiaries || []);
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    method: '',
    country: user.destinationCountry,
    kycId: '',
  });
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const handleAdd = () => {
    if (!newBeneficiary.name || !newBeneficiary.method) {
      alert('Please complete beneficiary name and method.');
      return;
    }

    setBeneficiaries([...beneficiaries, newBeneficiary]);
    setNewBeneficiary({ name: '', method: '', country: user.destinationCountry, kycId: '' });
  };

  const handleSubmitAuditPreview = async () => {
    const payload = {
      senderIntent: {
        name: user.userName,
        originCurrency: user.originCurrency,
        kycId: user.kycId,
        contact: user.contact,
      },
      receiverIntent: {
        name: beneficiaries[0]?.name || '',
        method: beneficiaries[0]?.method || '',
        country: user.destinationCountry,
        kycId: beneficiaries[0]?.kycId || '',
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
      setSubmissionStatus(result);
    } catch (error) {
      console.error('Audit preview submission failed:', error);
      setSubmissionStatus({ success: false, message: 'Submission error. Please try again.' });
    }
  };

  return (
    <div>
      <h2>Welcome, {user.userName}</h2>
      <p>You’ve registered to send <strong>{user.originCurrency}</strong> to a beneficiary in <strong>{user.destinationCountry}</strong>.</p>

      <h3>Your Reflected Beneficiaries</h3>
      <ul>
        {beneficiaries.map((b, i) => (
          <li key={i}>
            {b.name} — {b.method} ({b.country})
          </li>
        ))}
      </ul>

      <h4>Add a New Beneficiary</h4>
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
        Submit Audit Preview
      </button>

      {submissionStatus && (
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
          )}
        </div>
      )}
    </div>
  );
}
