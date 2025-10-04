import React, { useState } from 'react';
import { simulateDelivery } from '../protocol/delivery/DeliverySimulator';
import { generateFallbackMessage } from '../protocol/delivery/FallbackUX';
import { FeeAttribution } from '../protocol/fees/FeeAttribution';

const mockFee: FeeAttribution = {
  matchId: 'MATCH-001',
  corridorId: 'US-CL',
  senderId: 'A123',
  senderCurrency: 'USD',
  recipientCountry: 'CL',
  deliverySpeed: 'instant',
  feeAmount: 3.75,
  feeBreakdown: {
    baseFee: 2.00,
    speedMultiplier: 1.25,
    corridorAdjustment: 0.50
  },
  timestamp: new Date().toISOString(),
  slaSeconds: 60,
  bufferSeconds: 180,
  fallbackTriggered: false
};

export default function FallbackTester() {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'reassuring' | 'neutral' | 'urgent' | null>(null);

  const handleSimulate = () => {
    const simulatedFee = simulateDelivery(mockFee);
    const fallback = generateFallbackMessage(simulatedFee);
    setMessage(fallback.message);
    setTone(fallback.tone);
  };

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Fallback Simulation Tester</h2>
      <button onClick={handleSimulate}>Simulate Delivery</button>
      {message && (
        <div style={{ marginTop: '1rem', color: tone === 'urgent' ? 'red' : tone === 'reassuring' ? 'green' : 'black' }}>
          <strong>Message:</strong> {message}
          <br />
          <strong>Tone:</strong> {tone}
        </div>
      )}
    </div>
  );
}