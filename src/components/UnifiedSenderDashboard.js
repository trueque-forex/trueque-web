import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { simulateDelivery } from '../protocol/delivery/DeliverySimulator';
import { generateFallbackMessage } from '../protocol/delivery/FallbackUX';
import { exportAuditLog } from '../protocol/audit/AuditLogger';
const corridors = ['US-CL', 'AR-ES', 'MX-GT'];
export default function UnifiedSenderDashboard() {
    const [selectedCorridor, setSelectedCorridor] = useState('US-CL');
    const [results, setResults] = useState([]);
    const [auditJson, setAuditJson] = useState(null);
    const senderConfigs = [
        { senderId: 'A123', deliverySpeed: 'instant' },
        { senderId: 'B456', deliverySpeed: 'same-day' },
        { senderId: 'C789', deliverySpeed: 'next-day' }
    ];
    const handleSimulate = () => {
        const simulatedResults = senderConfigs.map(config => {
            const fee = {
                matchId: 'MATCH-' + Date.now() + '-' + config.senderId,
                corridorId: selectedCorridor,
                senderId: config.senderId,
                senderCurrency: selectedCorridor.startsWith('US') ? 'USD' :
                    selectedCorridor.startsWith('AR') ? 'ARS' : 'MXN',
                recipientCountry: selectedCorridor.split('-')[1],
                deliverySpeed: config.deliverySpeed,
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
    return (_jsxs("div", { style: { padding: '1rem' }, children: [_jsx("h2", { children: "Unified Sender Dashboard" }), _jsxs("label", { children: ["Select Corridor:", ' ', _jsx("select", { value: selectedCorridor, onChange: e => setSelectedCorridor(e.target.value), children: corridors.map(c => (_jsx("option", { value: c, children: c }, c))) })] }), _jsx("button", { onClick: handleSimulate, style: { marginLeft: '1rem' }, children: "Simulate Deliveries" }), _jsx("button", { onClick: handleExportAudit, style: { marginLeft: '1rem' }, children: "Export Audit Log" }), results.map(({ fee, message, tone }, index) => (_jsxs("div", { style: {
                    marginTop: '1rem',
                    padding: '1rem',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: tone === 'urgent' ? '#ffe5e5' :
                        tone === 'reassuring' ? '#e5ffe5' : '#f9f9f9'
                }, children: [_jsxs("h3", { children: ["Sender: ", fee.senderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Corridor:" }), " ", fee.corridorId] }), _jsxs("p", { children: [_jsx("strong", { children: "Delivery Speed:" }), " ", fee.deliverySpeed] }), _jsxs("p", { children: [_jsx("strong", { children: "Fee:" }), " $", fee.feeAmount.toFixed(2)] }), _jsxs("p", { children: [_jsx("strong", { children: "Fallback Triggered:" }), " ", fee.fallbackTriggered ? 'Yes' : 'No'] }), _jsxs("p", { children: [_jsx("strong", { children: "Message:" }), " ", message] }), _jsxs("p", { children: [_jsx("strong", { children: "Tone:" }), " ", tone] })] }, index))), auditJson && (_jsxs("div", { style: { marginTop: '2rem' }, children: [_jsx("h3", { children: "Audit Log Export" }), _jsx("pre", { style: { whiteSpace: 'pre-wrap', backgroundColor: '#f4f4f4', padding: '1rem' }, children: auditJson })] }))] }));
}
