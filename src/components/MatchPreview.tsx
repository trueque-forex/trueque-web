// src/components/MatchPreview.tsx

import React from 'react';

type MatchPreviewProps = {
  corridor: string;
  senderCountry: string;
  receiverCountry: string;
  senderCurrency: string;
  receiverCurrency: string;
  senderBeneficiary: string;
  receiverBeneficiary: string;
  executionModel: 'OM' | 'TBM';
  frictionLevel: 'high' | 'low';
};

export default function MatchPreview({
  corridor,
  senderCountry,
  receiverCountry,
  senderCurrency,
  receiverCurrency,
  senderBeneficiary,
  receiverBeneficiary,
  executionModel,
  frictionLevel
}: MatchPreviewProps) {
  return (
    <section className="border rounded-lg p-6 bg-white shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">Match Preview</h2>
      <ul className="text-sm text-gray-700 space-y-2">
        <li><strong>Corridor:</strong> {corridor}</li>
        <li><strong>Execution Model:</strong> {executionModel} ({frictionLevel} friction)</li>
        <li><strong>Sender:</strong> {senderCountry} ({senderCurrency}) → {receiverBeneficiary} in {receiverCountry}</li>
        <li><strong>Receiver:</strong> {receiverCountry} ({receiverCurrency}) → {senderBeneficiary} in {senderCountry}</li>
      </ul>
      <div className="mt-4 text-xs text-gray-500 italic">
        Funds are transferred domestically via licensed transmitters. No money crosses borders. Trueque does not touch funds.
      </div>
    </section>
  );
}