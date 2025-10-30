export type FeeComponents = {
    trueque_fee: number;
    transmitter_fee: number;
    delivery_speed_premium: number;
    country_model: 'OM' | 'MTB' | 'Hybrid';
};
export type RateIntegrityLog = {
    match_id: string;
    timestamp: string;
    fx_rate_market: number;
    match_anchor_rate: number;
    amount_paid_A: number;
    amount_received_A: number;
    amount_paid_B: number;
    amount_received_B: number;
    effective_rate_user_A: number;
    effective_rate_user_B: number;
    rate_divergence: number;
    rate_integrity_status: boolean;
    fee_components: FeeComponents;
    fx_integrity_message: string;
};
export declare class RateIntegrityService {
    calculateEffectiveRate(paid: number, received: number): number;
    generateIntegrityMessage(fx_rate_market: number, effective_A: number, effective_B: number, country_model: string): string;
    logRateIntegrity(fx_rate_market: number, amount_paid_A: number, amount_received_A: number, amount_paid_B: number, amount_received_B: number, fee_components: FeeComponents): RateIntegrityLog;
}
//# sourceMappingURL=rate-integrity.service.d.ts.map
