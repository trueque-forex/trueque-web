// src/components/KYCForm.tsx

import { useState } from 'react';

export default function KYCForm({ onVerify }: { onVerify: (kycData: any) => void }) {
  const [form, setForm] = useState({
    fullName: '',
    country: '',
    idNumber: '',
    purpose: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.country || !form.idNumber || !form.purpose) {
      setError('All fields are required.');
      return;
    }
    setError('');
    onVerify(form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">KYC Verification</h2>

      <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
      <input
        name="fullName"
        value={form.fullName}
        onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="Legal name"
      />

      <label className="block mb-2 text-sm font-medium text-gray-700">Country of Residence</label>
      <select
        name="country"
        value={form.country}
        onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4"
      >
        <option value="">Select country</option>
        <option value="Brazil">Brazil</option>
        <option value="Portugal">Portugal</option>
        <option value="United States">United States</option>
        {/* Add more countries as needed */}
      </select>

      <label className="block mb-2 text-sm font-medium text-gray-700">Government ID Number</label>
      <input
        name="idNumber"
        value={form.idNumber}
        onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="ID or passport number"
      />

      <label className="block mb-2 text-sm font-medium text-gray-700">Purpose of Remittance</label>
      <input
        name="purpose"
        value={form.purpose}
        onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4"
        placeholder="e.g., family support, education"
      />

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Submit KYC
      </button>

      <p className="mt-4 text-xs text-gray-500 italic">
        Trueque complies with U.S. KYC/AML regulations. Your data is verified by licensed transmitters and never stored by Trueque.
      </p>
    </form>
  );
}