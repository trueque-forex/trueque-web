import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getSession } from '@/lib/session';
import { withAuth } from '@/lib/withAuth';

type Props = {
  session?: any;
};

export const getServerSideProps = withAuth(async (ctx: any) => {
  const session = await getSession(ctx.req);
  return { props: { session } };
});

export default function KycForm({ session }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [addressFile, setAddressFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('dob', dob);
    formData.append('country', country);
    if (idFile) formData.append('idFile', idFile);
    if (selfieFile) formData.append('selfieFile', selfieFile);
    if (addressFile) formData.append('addressFile', addressFile);

    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json && (json.error || json.message)) || 'KYC submission failed');
      }

      await router.push('/kyc/status');
    } catch (err: any) {
      setError(err?.message ?? 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>KYC Verification</h1>
      <p>Please enter your information and upload the required documents to verify your identity.</p>

      <form onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label>Date of Birth</label>
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />

        <label>Country of Residence</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} required />

        <label>Upload ID Document</label>
        <input type="file" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} required />

        <label>Upload Selfie</label>
        <input type="file" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} required />

        <label>Proof of Address</label>
        <input type="file" accept="image/*,.pdf" onChange={(e) => setAddressFile(e.target.files?.[0] || null)} required />

        {error && <div role="alert" style={{ color: 'crimson' }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit KYC'}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => router.push('/kyc/status')}>Back to KYC status</button>
      </div>
    </main>
  );
}