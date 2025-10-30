import React, { useState } from "react";

type Beneficiary = {
  id: string;
  status: 'pending_screening' | 'approved' | 'review_required' | 'blocked' | 'archived';
  last_screened_at?: string | null;
  risk_tier?: 'low' | 'medium' | 'high';
};

type Props = {
  beneficiary: Beneficiary;
  onClose: () => void;
  onRetryComplete: (updated: Beneficiary) => void;
};

export default function BeneficiaryRetryModal({ beneficiary, onClose, onRetryComplete }: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRetry = ['pending_screening', 'review_required'].includes(beneficiary.status);

  async function handleSubmit() {
    if (!canRetry) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/beneficiaries/${beneficiary.id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error(`Retry failed: ${res.status}`);
      const updated = await res.json();
      onRetryComplete(updated);
      onClose();
    } catch (e: any) {
      setError(e.message || "Retry failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal p-4 border rounded bg-white shadow-md">
      <h2 className="text-lg font-semibold text-indigo-700 mb-2">Retry Beneficiary Validation</h2>
      <p className="text-sm text-gray-600 mb-2">
        Current status: <strong>{beneficiary.status}</strong>
        {beneficiary.last_screened_at && (
          <> — last screened: {new Date(beneficiary.last_screened_at).toLocaleString()}</>
        )}
      </p>

      <textarea
        className="w-full border rounded px-2 py-1 mb-3"
        placeholder="Reason for retry (e.g. name mismatch, recent account update)"
        value={reason}
        onChange={e => setReason(e.target.value)}
      />
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <div className="flex space-x-2">
        <button
          onClick={handleSubmit}
          disabled={!canRetry || loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Retrying…" : "Submit Retry"}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
