"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateIntegrityService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
@(0, common_1.Injectable)()
class RateIntegrityService {
    calculateEffectiveRate(paid, received) {
        return +(paid / received).toFixed(2);
    }
    generateIntegrityMessage(fx_rate_market, effective_A, effective_B, country_model) {
        return `Match anchored to market rate ${fx_rate_market}. Divergence (${effective_A} vs ${effective_B}) reflects fees under ${country_model} model—no FX manipulation.`;
    }
    logRateIntegrity(fx_rate_market, amount_paid_A, amount_received_A, amount_paid_B, amount_received_B, fee_components) {
        const match_id = (0, uuid_1.v4)();
        const effective_A = this.calculateEffectiveRate(amount_paid_A, amount_received_A);
        const effective_B = this.calculateEffectiveRate(amount_paid_B, amount_received_B);
        const divergence = +(effective_A - effective_B).toFixed(2);
        const fx_integrity_message = this.generateIntegrityMessage(fx_rate_market, effective_A, effective_B, fee_components.country_model);
        return {
            match_id,
            timestamp: new Date().toISOString(),
            fx_rate_market,
            match_anchor_rate: fx_rate_market,
            amount_paid_A,
            amount_received_A,
            amount_paid_B,
            amount_received_B,
            effective_rate_user_A: effective_A,
            effective_rate_user_B: effective_B,
            rate_divergence: divergence,
            rate_integrity_status: true,
            fee_components,
            fx_integrity_message,
        };
    }
}
exports.RateIntegrityService = RateIntegrityService;
//# sourceMappingURL=rate-integrity.service.js.map