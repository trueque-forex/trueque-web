import React, { useState } from "react";
import KYCForm from "@/components/KYCForm";
import { useRouter } from "next/router";

export default function KYCPage() {
  const [kycStatus, setKycStatus] = useState<"pending" | "verified" | "flagged">("pending");
  const router = useRouter();

  async function handleSubmitted(submissionId: string | null | undefined) {
    // navigate to status page which polls backend
    router.push("/kyc/status");
  }

  return (
    <main className="min-h-screen px-6 py-10 bg-gray-50">
      {kycStatus === "verified" ? (
        <p className="text-lg font-medium text-green-700">✅ KYC Verified. You’re ready to match remittance needs.</p>
      ) : (
        <KYCForm onSubmitted={handleSubmitted} />
      )}
    </main>
  );
}
