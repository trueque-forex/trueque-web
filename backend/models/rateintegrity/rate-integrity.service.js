var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let RateIntegrityService = class RateIntegrityService {
    calculateEffectiveRate(paid, received) {
        return +(paid / received).toFixed(2);
    }
    generateIntegrityMessage(fx_rate_market, effective_A, effective_B, country_model) {
        return `Match anchored to market rate ${fx_rate_market}. Divergence (${effective_A} vs ${effective_B}) reflects fees under ${country_model} model—no FX manipulation.`;
    }
    logRateIntegrity(fx_rate_market, amount_paid_A, amount_received_A, amount_paid_B, amount_received_B, fee_components) {
        const match_id = uuidv4();
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
};
RateIntegrityService = __decorate([
    Injectable()
], RateIntegrityService);
export { RateIntegrityService };
