import React, { useState } from 'react';
import { FeeAttribution } from '../protocol/fees/FeeAttribution';
import { simulateDelivery } from '../protocol/delivery/DeliverySimulator';
import { generateFallbackMessage } from '../protocol/delivery/FallbackUX';

type SenderProps = {
  senderId: string;
  corridorId: string;
  deliverySpeed: 'instant' | 'same-day' | 'next-day';
};

export default function SenderDashboard({ senderId, corridorId, deliverySpeed }: SenderProps) {
  const [fee, setFee] = useState<FeeAttribution | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'reassuring' | 'neutral' | 'urgent' | null>(null);

  const mockFee: FeeAttribution = {
    matchId: 'MATCH-' + Date.now(),
    corridorId,
    senderId,
    senderCurrency: corridorId.startsWith('US') ? 'USD' : 'ARS',
    recipientCountry: corridorId.split('-')[1],
    deliverySpeed,
    feeAmount: 3.75,
    feeBreakdown: {
      baseFee: 2.00,
      speedMultiplier: deliverySpeed === 'instant' ? 1.25 : deliverySpeed === 'same-day' ? 1.10 : 1.00,
      corridorAdjustment: corridorId === 'AR-ES' ? 0.50 : 0.25
    },
    timestamp: new Date().toISOString(),
    slaSeconds: deliverySpeed === 'instant' ? 60 : deliverySpeed === 'same-day' ? 86400 : 172800,
    bufferSeconds: 180,
    fallbackTriggered: false
  };

  const handleSimulate = () => {
    const simulated = simulateDelivery(mockFee);
    const fallback = generateFallbackMessage(simulated);
    setFee(simulated);
    setMessage(fallback.message);
    setTone(fallback.tone);
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Sender Dashboard</h2>
      <p><strong>Sender ID:</strong> {senderId}</p>
      <p><strong>Corridor:</strong> {corridorId}</p>
      <p><strong>Delivery Speed:</strong> {deliverySpeed}</p>
      <button onClick={handleSimulate}>Simulate Delivery</button>

      {fee && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Fee Attribution</h3>
          <p><strong>Fee:</strong> ${fee.feeAmount.toFixed(2)}</p>
          <p><strong>SLA:</strong> {fee.slaSeconds}s + {fee.bufferSeconds}s buffer</p>
          <p><strong>Fallback Triggered:</strong> {fee.fallbackTriggered ? 'Yes' : 'No'}</p>
        </div>
      )}

      {message && (
        <div style={{ marginTop: '1rem', color: tone === 'urgent' ? 'red' : tone === 'reassuring' ? 'green' : 'black' }}>
          <h3>Delivery Status</h3>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}