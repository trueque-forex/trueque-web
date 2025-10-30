var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let RateIntegrityService = class RateIntegrityService {
    logRateIntegritySplit(senderView, receiverView) {
        const log = new RateIntegrityLog();
        log.fx_rate_market = senderView.fx_rate_market;
        log.spread = senderView.spread;
        log.bid_rate = senderView.bid_rate;
        log.ask_rate = receiverView.ask_rate;
        log.effective_rate_user_A = senderView.effective_rate;
        log.effective_rate_user_B = receiverView.effective_rate;
        log.trueque_fee_A = senderView.fee_breakdown.trueque_fee;
        log.transmitter_fee_A = senderView.fee_breakdown.transmitter_fee;
        log.delivery_premium_A = senderView.fee_breakdown.delivery_premium;
        log.total_fee_A = senderView.fee_breakdown.total;
        log.country_model_A = senderView.fee_breakdown.country_model;
        log.trueque_fee_B = receiverView.fee_breakdown.trueque_fee;
        log.transmitter_fee_B = receiverView.fee_breakdown.transmitter_fee;
        log.delivery_premium_B = receiverView.fee_breakdown.delivery_premium;
        log.total_fee_B = receiverView.fee_breakdown.total;
        log.country_model_B = receiverView.fee_breakdown.country_model;
        log.fx_integrity_message = `Market rate anchored at ${senderView.fx_rate_market}. Spread ±${(senderView.spread * 100).toFixed(2)}%. Fees split fairly.`;
        return log;
    }
};
RateIntegrityService = __decorate([
    Injectable()
], RateIntegrityService);
export { RateIntegrityService };
