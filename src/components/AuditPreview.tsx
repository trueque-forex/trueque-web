<<<<<<< HEAD
import React, { useMemo } from 'react'
import { Beneficiary } from '../types'

type Props = {
  corridor: string
  amount: string
  rate: number // USD per BRL
  sendCurrency: string
  receiveCurrency: string
  beneficiary: Beneficiary
  deliverySpeed: string
  onBack: () => void
  onContinue: () => void
}

export default function AuditPreview({
  corridor,
  amount,
  rate,
  sendCurrency,
  receiveCurrency,
  beneficiary,
  deliverySpeed,
  onBack,
  onContinue,
}: Props) {
  const sendAmount = parseFloat(amount)

  const estimatedReceive = useMemo(() => {
    return sendAmount / rate
  }, [sendAmount, rate])

  const formattedRate = `$${rate.toFixed(2)}/${receiveCurrency}`
=======
import React, { useMemo } from 'react';
import type { Beneficiary } from '../types';

type Props = {
  corridor?: string;
  amount: string;
  rate: number;
  sendCurrency?: string;
  receiveCurrency?: string;
  beneficiary?: Partial<Beneficiary>;
  deliverySpeed?: string;
  sender?: string;
  recipient?: string;
  onBack?: () => void;
  onContinue?: () => void;
};

export default function AuditPreview({
  corridor = 'USD-MXP',
  amount,
  rate,
  sendCurrency = 'USD',
  receiveCurrency = 'MXN',
  beneficiary = {},
  deliverySpeed,
  sender = 'unknown',
  recipient = 'unknown',
  onBack,
  onContinue,
}: Props) {
  const sendAmount = Number.parseFloat(amount || '0') || 0;

  const estimatedReceive = useMemo(() => {
    return rate !== 0 ? sendAmount / rate : 0;
  }, [sendAmount, rate]);

  const formattedRate = `${rate.toFixed(2)}/${receiveCurrency}`;
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Audit Preview</h3>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-2">
        <p className="text-sm text-gray-600">📍 Corridor: <strong>{corridor}</strong></p>
        <p className="text-sm text-gray-600">💱 Market Rate: <strong>{formattedRate}</strong></p>
<<<<<<< HEAD
        <p className="text-sm text-gray-600">👤 Beneficiary: <strong>{beneficiary.name.replace(/\s*\(.*?\)/, '')}</strong></p>
=======
        <p className="text-sm text-gray-600">👤 Beneficiary: <strong>{(beneficiary.name ?? '').replace(/\s*\(.*?\)/, '') || '—'}</strong></p>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
        <p className="text-sm text-gray-600">💰 Amount Sent: <strong>{sendCurrency}{sendAmount.toFixed(2)}</strong></p>
        <p className="text-sm text-gray-600">🚚 Delivery Speed: <strong>{deliverySpeed || 'Not specified'}</strong></p>
        <p className="text-sm text-gray-600">
          💱 Estimated Receive: <strong>{receiveCurrency}{estimatedReceive.toFixed(2)}</strong>
          <span className="text-xs italic text-gray-500 ml-2">At market exchange rate. Amount could vary after fees</span>
        </p>
<<<<<<< HEAD
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
=======
        <p className="text-sm text-gray-600"><strong>Sender</strong>: {sender}</p>
        <p className="text-sm text-gray-600"><strong>Recipient</strong>: {recipient}</p>
      </div>

      <div className="flex space-x-4">
        <button onClick={onBack} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-100" type="button">Back</button>
        <button onClick={onContinue} className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700" type="button">Continue</button>
      </div>
    </div>
  );
}
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
