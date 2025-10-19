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
    }
  }

  return (
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
