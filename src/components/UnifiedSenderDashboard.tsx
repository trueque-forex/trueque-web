import React, { useState } from 'react';
import { FeeAttribution } from '../protocol/fees/FeeAttribution';
import { simulateDelivery } from '../protocol/delivery/DeliverySimulator';
import { generateFallbackMessage } from '../protocol/delivery/FallbackUX';
import { exportAuditLog } from '../protocol/audit/AuditLogger';

const corridors = ['US-CL', 'AR-ES', 'MX-GT'];

export default function UnifiedSenderDashboard() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>('US-CL');
  const [results, setResults] = useState<
    { fee: FeeAttribution; message: string; tone: string }[]
  >([]);
  const [auditJson, setAuditJson] = useState<string | null>(null);

  const senderConfigs = [
    { senderId: 'A123', deliverySpeed: 'instant' },
    { senderId: 'B456', deliverySpeed: 'same-day' },
    { senderId: 'C789', deliverySpeed: 'next-day' }
  ];

  const handleSimulate = () => {
    const simulatedResults = senderConfigs.map(config => {
      const fee: FeeAttribution = {
        matchId: 'MATCH-' + Date.now() + '-' + config.senderId,
        corridorId: selectedCorridor,
        senderId: config.senderId,
        senderCurrency: selectedCorridor.startsWith('US') ? 'USD' :
                        selectedCorridor.startsWith('AR') ? 'ARS' : 'MXN',
        recipientCountry: selectedCorridor.split('-')[1],
        deliverySpeed: config.deliverySpeed as 'instant' | 'same-day' | 'next-day',
        feeAmount: 3.75,
        feeBreakdown: {
          baseFee: 2.00,
          speedMultiplier: config.deliverySpeed === 'instant' ? 1.25 :
                           config.deliverySpeed === 'same-day' ? 1.10 : 1.00,
          corridorAdjustment: selectedCorridor === 'AR-ES' ? 0.50 : 0.25
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

  const handleExportAudit = () => {
    const audit = exportAuditLog();
    setAuditJson(audit);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Unified Sender Dashboard</h2>

      <label>
        Select Corridor:{' '}
        <select value={selectedCorridor} onChange={e => setSelectedCorridor(e.target.value)}>
          {corridors.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>

      <button onClick={handleSimulate} style={{ marginLeft: '1rem' }}>Simulate Deliveries</button>
      <button onClick={handleExportAudit} style={{ marginLeft: '1rem' }}>Export Audit Log</button>

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

      {auditJson && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Audit Log Export</h3>
          <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f4f4f4', padding: '1rem' }}>
            {auditJson}
          </pre>
        </div>
      )}
    </div>
  );
}