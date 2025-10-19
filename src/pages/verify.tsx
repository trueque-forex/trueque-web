import { useState } from 'react';
import { useRouter } from 'next/router';

export default function VerifyPage() {
  const router = useRouter();
  const { userId, email, phone, isPEP } = router.query;

  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [formError, setFormError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    setSelfieFile(files?.[0] || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selfieFile) {
      setFormError('❌ Please upload a selfie for verification.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('truequeUsers') || '{}');
    const emailKey = (email as string).trim().toLowerCase();
    const user = users[emailKey];

    if (!user) {
      setFormError('❌ User not found. Please sign up again.');
      return;
    }

    user.verified = true;
    user.verificationDate = new Date().toISOString();
    users[emailKey] = user;
    localStorage.setItem('truequeUsers', JSON.stringify(users));
    localStorage.setItem('currentUserEmail', emailKey);

    router.push('/send');
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔐 Verify Identity</h1>
      <p><strong>Trueque ID:</strong> {userId}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Phone:</strong> {phone}</p>
      <p><strong>PEP:</strong> {isPEP === 'true' ? 'Yes' : 'No'}</p>

      {formError && <p className="text-red-600 text-sm font-semibold">{formError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="file" accept="image/*" onChange={handleChange} className="w-full border px-3 py-2 rounded" />
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Verify & Continue
        </button>
      </form>
    </main>
  );
}
