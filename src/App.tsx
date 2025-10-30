// src/App.tsx
import React from 'react';

export default function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Trueque Web</h1>
        <p className="text-sm text-gray-600">Placeholder App component — replace with your real web root component.</p>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <section className="rounded border p-4 bg-white shadow-sm">
          <h2 className="text-lg font-medium">Welcome</h2>
          <p className="mt-2 text-sm">
            Your web app root is set. Replace this file with your actual App implementation or
            compose your real routes/components here.
          </p>
        </section>
      </main>
    </div>
  );
}