import React, { useState } from 'react';
import { FeeAttribution } from '../protocol/fees/FeeAttribution';
import { simulateDelivery } from '../protocol/delivery/DeliverySimulator';
import { generateFallbackMessage } from '../protocol/delivery/FallbackUX';

type SenderConfig = {
  senderId: string;
  corridorId: string;
  deliverySpeed: 'instant' | 'same-day' | 'next-day';
};

const senderConfigs: SenderConfig[] = [
  { senderId: 'A123', corridorId: 'US-CL', deliverySpeed: 'instant' },
  { senderId: 'B456', corridorId: 'AR-ES', deliverySpeed: 'same-day' },
  { senderId: 'C789', corridorId: 'MX-GT', deliverySpeed: 'next-day' }
];

export default function MultiSenderDashboard() {
  const [results, setResults] = useState<
    { fee: FeeAttribution; message: string; tone: string }[]
  >([]);

  const handleSimulateAll = () => {
    const simulatedResults = senderConfigs.map(config => {
      const fee: FeeAttribution = {
        matchId: 'MATCH-' + Date.now() + '-' + config.senderId,
        corridorId: config.corridorId,
        senderId: config.senderId,
        senderCurrency: config.corridorId.startsWith('US') ? 'USD' :
                        config.corridorId.startsWith('AR') ? 'ARS' : 'MXN',
        recipientCountry: config.corridorId.split('-')[1],
        deliverySpeed: config.deliverySpeed,
        feeAmount: 3.75,
        feeBreakdown: {
          baseFee: 2.00,
          speedMultiplier: config.deliverySpeed === 'instant' ? 1.25 :
                           config.deliverySpeed === 'same-day' ? 1.10 : 1.00,
          corridorAdjustment: config.corridorId === 'AR-ES' ? 0.50 : 0.25
        },
        timestamp: new Date().toISOString(),
        slaSeconds: config.deliverySpeed === 'instant' ? 60 :
                    config.deliverySpeed === 'same-day' ? 86400 : 172800,
        bufferSeconds: 180,
        fallbackTriggered: false
      };

      const simulated = simulateDelivery(fee);
      const fallback = generateFallbackMessage(simulated);

      return {
        fee: simulated,
        message: fallback.message,
        tone: fallback.tone
      };
    });

    setResults(simulatedResults);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Multi-Sender Dashboard</h2>
      <button onClick={handleSimulateAll}>Simulate All Deliveries</button>

      {results.map(({ fee, message, tone }, index) => (
        <div key={index} style={{
          marginTop: '1rem',
          padding: '1rem',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: tone === 'urgent' ? '#ffe5e5' :
                           tone === 'reassuring' ? '#e5ffe5' : '#f9f9f9'
        }}>
          <h3>Sender: {fee.senderId}</h3>
          <p><strong>Corridor:</strong> {fee.corridorId}</p>
          <p><strong>Delivery Speed:</strong> {fee.deliverySpeed}</p>
          <p><strong>Fee:</strong> ${fee.feeAmount.toFixed(2)}</p>
          <p><strong>Fallback Triggered:</strong> {fee.fallbackTriggered ? 'Yes' : 'No'}</p>
          <p><strong>Message:</strong> {message}</p>
          <p><strong>Tone:</strong> {tone}</p>
        </div>
      ))}
    </div>
  );
}