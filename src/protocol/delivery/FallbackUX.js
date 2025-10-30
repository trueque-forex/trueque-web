import { FeeAttribution } from '../FeeAttribution';
export function simulateFallbackUX() {
    const fee = FeeAttribution.calculate();
    if (fee.fallbackTriggered) {
        return {
            message: 'Fallback triggered due to SLA breach. User rerouted.',
            tone: 'urgent'
        };
    }
    return {
        message: 'Delivery within SLA. No fallback needed.',
        tone: 'reassuring'
    };
}
