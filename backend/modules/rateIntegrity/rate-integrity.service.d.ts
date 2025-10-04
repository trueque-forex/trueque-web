import { RateIntegrityLog } from './rate_integrity.entity';
export declare class RateIntegrityService {
    logRateIntegritySplit(senderView: {
        fx_rate_market: number;
        bid_rate: number;
        spread: number;
        effective_rate: number;
        fee_breakdown: {
            trueque_fee: number;
            transmitter_fee: number;
            delivery_premium: number;
            total: number;
            country_model: string;
        };
    }, receiverView: {
        fx_rate_market: number;
        ask_rate: number;
        spread: number;
        effective_rate: number;
        fee_breakdown: {
            trueque_fee: number;
            transmitter_fee: number;
            delivery_premium: number;
            total: number;
            country_model: string;
        };
    }): RateIntegrityLog;
}
//# sourceMappingURL=rate-integrity.service.d.ts.map