<<<<<<< HEAD
import React from 'react'
import { Beneficiary } from '../types'

type Props = {
  beneficiaries: Beneficiary[]
  selected: string
  onSelect: (id: string) => void
}

export default function SelectBeneficiary({ beneficiaries, selected, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Beneficiary</h3>
      <select
        value={selected}
        onChange={e => onSelect(e.target.value)}
        className="block w-full border rounded px-2 py-1"
      >
        <option value="">-- Choose a beneficiary --</option>
        {beneficiaries.map(b => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  )
}
=======
// src/components/SelectBeneficiary.tsx
import React from 'react';
import type { Beneficiary } from '../types';

type Option = { id?: string; name: string };

type Props = {
  beneficiaries: Option[]; // items produced by SendFlow mock normalizer
  value?: { id?: string; name?: string } | null;
  onSelect?: (b: { id?: string; name?: string } | null) => void;
  placeholder?: string;
};

export default function SelectBeneficiary({ beneficiaries, value = null, onSelect, placeholder = 'Select beneficiary' }: Props) {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return beneficiaries;
    return beneficiaries.filter((b) => (b.name ?? '').toLowerCase().includes(q) || (b.id ?? '').toLowerCase().includes(q));
  }, [beneficiaries, query]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{placeholder}</label>
      <div className="flex gap-2">
        <input
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search beneficiary name or id"
          aria-label="Search beneficiary"
        />
      </div>

      <ul className="mt-2 max-h-40 overflow-auto space-y-1">
        {filtered.length === 0 ? (
          <li className="text-sm text-gray-500">No beneficiaries</li>
        ) : (
          filtered.map((b) => {
            const isSelected = Boolean(value?.id && b.id && value.id === b.id);
            return (
              <li key={b.id ?? b.name} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <div className="text-sm font-medium">{b.name}</div>
                  {b.id ? <div className="text-xs text-gray-500">id: {b.id}</div> : null}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onSelect?.({ id: b.id, name: b.name })}
                    className={`px-3 py-1 text-sm rounded ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
