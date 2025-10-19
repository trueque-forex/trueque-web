import React, { useState } from "react";

type KycFormProps = {
  onSubmitted?: (submissionId: string) => void;
};

export default function KYCForm({ onSubmitted }: KycFormProps) {
  const [form, setForm] = useState({
    fullName: "",
    country: "",
    idNumber: "",
    purpose: ""
  });
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFile(name: string, file: File | null) {
    if (name === "idFront") setIdFront(file);
    if (name === "idBack") setIdBack(file);
    if (name === "selfie") setSelfie(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fullName || !form.country || !form.idNumber || !form.purpose) {
      setError("All fields are required.");
      return;
    }
    if (!idFront || !selfie) {
      setError("Please upload ID front and a selfie.");
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append("fullName", form.fullName);
      body.append("country", form.country);
      body.append("idNumber", form.idNumber);
      body.append("purpose", form.purpose);
      body.append("id_front", idFront);
      if (idBack) body.append("id_back", idBack);
      body.append("selfie", selfie);

      const res = await fetch("/api/kyc/submit", { method: "POST", body });
      if (res.status === 202) {
        const json = await res.json().catch(() => ({ submission_id: null }));
        const submissionId = json.submission_id ?? null;
        onSubmitted?.(submissionId);
        return;
      }
      const payload = await res.json().catch(() => null);
      setError(payload?.message ?? "Submission failed");
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">KYC Verification</h2>

      <label className="block mb-2 text-sm font-medium text-gray-700">Full Name</label>
      <input name="fullName" value={form.fullName} onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4" placeholder="Legal name" required />

      <label className="block mb-2 text-sm font-medium text-gray-700">Country of Residence</label>
      <select name="country" value={form.country} onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4" required>
        <option value="">Select country</option>
        <option value="Brazil">Brazil</option>
        <option value="Portugal">Portugal</option>
        <option value="United States">United States</option>
      </select>

      <label className="block mb-2 text-sm font-medium text-gray-700">Government ID Number</label>
      <input name="idNumber" value={form.idNumber} onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4" placeholder="ID or passport number" required />

      <label className="block mb-2 text-sm font-medium text-gray-700">Purpose of Remittance</label>
      <input name="purpose" value={form.purpose} onChange={handleChange}
        className="border rounded px-3 py-2 w-full mb-4" placeholder="e.g., family support, education" required />

      <label className="block mb-2 text-sm font-medium text-gray-700">ID document (front)</label>
      <input type="file" accept="image/*,application/pdf" onChange={e => handleFile("idFront", e.target.files?.[0] ?? null)} required className="mb-4" />

      <label className="block mb-2 text-sm font-medium text-gray-700">ID document (back) — optional</label>
      <input type="file" accept="image/*,application/pdf" onChange={e => handleFile("idBack", e.target.files?.[0] ?? null)} className="mb-4" />

      <label className="block mb-2 text-sm font-medium text-gray-700">Selfie</label>
      <input type="file" accept="image/*" onChange={e => handleFile("selfie", e.target.files?.[0] ?? null)} required className="mb-4" />

      {error && <p className="text-red-500 text-sm mb-2" role="alert">{error}</p>}

      <button type="submit" disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        {loading ? "Submitting..." : "Submit KYC"}
      </button>

      <p className="mt-4 text-xs text-gray-500 italic">
        Trueque verifies identity to comply with regulations. Your documents are stored securely and access is restricted.
      </p>
    </form>
  );
}
