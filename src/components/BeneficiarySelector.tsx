import React from 'react';

type Beneficiary = {
  id: string;
  name: string;
  country: string;
  status: 'pending_screening' | 'approved' | 'review_required' | 'blocked' | 'archived';
  accountType: 'wallet' | 'card' | 'bank' | string;
};

type Props = {
  corridor: string; // e.g. "BR-PT"
  beneficiaries: Beneficiary[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpenRetry: (b: Beneficiary) => void;
};

export default function BeneficiarySelector({
  corridor,
  beneficiaries,
  selectedId,
  onSelect,
  onOpenRetry,
}: Props) {
  const destinationCountry = corridor.split('-')[1];

  const filtered = beneficiaries.filter(b => b.country === destinationCountry);

  return (
    <div className="space-y-1">
      <label className="block font-medium">Select Beneficiary in {destinationCountry}</label>
      <select
        className="w-full border rounded px-3 py-2"
        value={selectedId}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">Choose recipient</option>
        {filtered.map((b) => {
          const selectable = b.status === 'approved';
          const label = `${b.name} — ${b.accountType} ${!selectable ? `(${b.status})` : ''}`;
          return (
            <option key={b.id} value={b.id} disabled={!selectable}>
              {label}
            </option>
          );
        })}
      </select>

      {filtered.length === 0 && (
        <p className="text-xs text-gray-500 italic mt-1">
          No beneficiaries for {destinationCountry}.
        </p>
      )}

      {filtered.some(b => b.status !== 'approved') && (
        <div className="mt-2 text-sm text-gray-600">
          <p>Some beneficiaries require review:</p>
          <ul className="list-disc pl-5">
            {filtered.filter(b => b.status !== 'approved').map(b => (
              <li key={b.id} className="flex items-center justify-between">
                <span>{b.name} — {b.status}</span>
                {['pending_screening','review_required'].includes(b.status) && (
                  <button
                    onClick={() => onOpenRetry(b)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Retry screening
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
