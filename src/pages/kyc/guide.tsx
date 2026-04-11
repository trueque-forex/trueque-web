// src/pages/kyc/guide.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { withAuth } from '@/lib/withAuth';
import { getSession } from '@/lib/session';

type Props = {
  session: any;
  baseUrl: string;
};

export default function KycGuide({ session, baseUrl }: Props) {
  const router = useRouter();
  return (
    <main style={{ padding: 20 }}>
      <h1>What you need for KYC</h1>
      {session?.user?.id && <p className="text-sm text-gray-500 mb-4">Signed in as: {session.user.id}</p>}

      <p>Typical documents:</p>
      <ul>
        <li>Government-issued ID (passport, national ID, driver’s license)</li>
        <li>Selfie for liveness verification</li>
        <li>Proof of address (utility bill, bank statement less than 3 months old)</li>
      </ul>

      <p>Tips:</p>
      <ul>
        <li>Upload clear photos; ensure all corners of the document are visible.</li>
        <li>Use supported file types: JPG, PNG, PDF.</li>
        <li>If you encounter issues, contact support.</li>
      </ul>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => router.push('/kyc/upload')}>Start KYC</button>
        <button onClick={() => router.push('/kyc/status')} style={{ marginLeft: 8 }}>Back to status</button>
      </div>
    </main>
  );
}

export const getServerSideProps: any = withAuth(async (ctx: any) => {
  const session = await getSession(ctx.req as unknown as import('http').IncomingMessage);
  const host = ctx.req?.headers?.host ?? 'localhost';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://${host}`;

  return {
    props: {
      session,
      baseUrl,
    },
  };
});
