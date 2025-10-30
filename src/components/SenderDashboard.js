import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { simulateDelivery } from '../protocol/delivery/DeliverySimulator';
import { generateFallbackMessage } from '../protocol/delivery/FallbackUX';
export default function SenderDashboard({ senderId, corridorId, deliverySpeed }) {
    const [fee, setFee] = useState(null);
    const [message, setMessage] = useState(null);
    const [tone, setTone] = useState(null);
    const mockFee = {
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
    return (_jsxs("div", { style: { padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }, children: [_jsx("h2", { children: "Sender Dashboard" }), _jsxs("p", { children: [_jsx("strong", { children: "Sender ID:" }), " ", senderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Corridor:" }), " ", corridorId] }), _jsxs("p", { children: [_jsx("strong", { children: "Delivery Speed:" }), " ", deliverySpeed] }), _jsx("button", { onClick: handleSimulate, children: "Simulate Delivery" }), fee && (_jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h3", { children: "Fee Attribution" }), _jsxs("p", { children: [_jsx("strong", { children: "Fee:" }), " $", fee.feeAmount.toFixed(2)] }), _jsxs("p", { children: [_jsx("strong", { children: "SLA:" }), " ", fee.slaSeconds, "s + ", fee.bufferSeconds, "s buffer"] }), _jsxs("p", { children: [_jsx("strong", { children: "Fallback Triggered:" }), " ", fee.fallbackTriggered ? 'Yes' : 'No'] })] })), message && (_jsxs("div", { style: { marginTop: '1rem', color: tone === 'urgent' ? 'red' : tone === 'reassuring' ? 'green' : 'black' }, children: [_jsx("h3", { children: "Delivery Status" }), _jsx("p", { children: message })] }))] }));
}
