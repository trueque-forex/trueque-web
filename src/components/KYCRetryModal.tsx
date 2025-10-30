<<<<<<< HEAD
import React, { useState } from "react";

type Props = {
  onClose: () => void;
  onRetryComplete: (result: { verified: boolean; failureReason?: string | null }) => void;
};

export default function KYCRetryModal({ onClose, onRetryComplete }: Props) {
  const [fullName, setFullName] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!fullName || !idFile || !selfieFile) {
      setError("Full name, ID document and selfie are required.");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("fullName", fullName);
      form.append("id_document", idFile);
      form.append("selfie", selfieFile);
      form.append("reason", reason);

      const res = await fetch("/api/kyc/retry", { method: "POST", body: form });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({ message: "Submission failed" }));
        setError(payload.message ?? "Submission failed");
        setLoading(false);
        return;
      }
      const payload = await res.json().catch(() => ({ verified: false, failureReason: null }));
      onRetryComplete({ verified: !!payload.verified, failureReason: payload.failureReason ?? null });
      onClose();
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
=======
// src/components/KYCRetryModal.tsx
import React, { useState } from 'react'

type RetryResult = { verified: boolean; failureReason?: string | null }

type Props = {
  userId: string
  onClose: () => void
  onRetryComplete: (result: RetryResult) => void
}

export default function KYCRetryModal({ userId, onClose, onRetryComplete }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runRetry() {
    setLoading(true)
    setError(null)
    try {
      // Minimal stub for retry action: replace with real API call later
      // Simulate success for now
      await new Promise((resolve) => setTimeout(resolve, 500))
      onRetryComplete({ verified: true })
      onClose()
    } catch (err: any) {
      setError(err?.message ?? 'Retry failed')
      onRetryComplete({ verified: false, failureReason: err?.message ?? 'unknown' })
    } finally {
      setLoading(false)
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    }
  }

  return (
<<<<<<< HEAD
    <div role="dialog" aria-modal="true" aria-label="Retry KYC" className="modal">
      <h2 className="text-lg font-semibold mb-3">Retry Sender KYC</h2>

      <label className="block mb-2">Full name</label>
      <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="border p-2 mb-3 w-full" />

      <label className="block mb-2">ID document (front)</label>
      <input type="file" accept="image/*,application/pdf" onChange={e => setIdFile(e.target.files?.[0] ?? null)} className="mb-3" />

      <label className="block mb-2">Selfie</label>
      <input type="file" accept="image/*" onChange={e => setSelfieFile(e.target.files?.[0] ?? null)} className="mb-3" />

      <label className="block mb-2">Reason for retry (optional)</label>
      <textarea value={reason} onChange={e => setReason(e.target.value)} className="border p-2 mb-3 w-full" />

      {error && <div role="alert" className="text-red-600 mb-3">{error}</div>}

      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? "Submitting..." : "Submit Retry"}
        </button>
        <button onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
      </div>
    </div>
  );
}
=======
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded shadow p-4 w-96">
        <h3 className="font-semibold mb-2">Retry KYC</h3>
        <p className="text-sm mb-3">Retry KYC for user <strong>{userId}</strong>.</p>

        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button
            onClick={runRetry}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
          >
            {loading ? 'Retrying...' : 'Retry KYC'}
          </button>
        </div>
      </div>
    </div>
  )
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
