"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateIntegrityLog = void 0;
const typeorm_1 = require("typeorm");
@(0, typeorm_1.Entity)()
class RateIntegrityLog {
    @(0, typeorm_1.PrimaryGeneratedColumn)()
    id;
    @(0, typeorm_1.Column)('decimal')
    fx_rate_market;
    @(0, typeorm_1.Column)('decimal')
    spread;
    @(0, typeorm_1.Column)('decimal')
    bid_rate;
    @(0, typeorm_1.Column)('decimal')
    ask_rate;
    @(0, typeorm_1.Column)('decimal')
    effective_rate_user_A;
    @(0, typeorm_1.Column)('decimal')
    effective_rate_user_B;
    @(0, typeorm_1.Column)('decimal')
    trueque_fee_A;
    @(0, typeorm_1.Column)('decimal')
    transmitter_fee_A;
    @(0, typeorm_1.Column)('decimal')
    delivery_premium_A;
    @(0, typeorm_1.Column)('decimal')
    total_fee_A;
    @(0, typeorm_1.Column)('varchar')
    country_model_A;
    @(0, typeorm_1.Column)('decimal')
    trueque_fee_B;
    @(0, typeorm_1.Column)('decimal')
    transmitter_fee_B;
    @(0, typeorm_1.Column)('decimal')
    delivery_premium_B;
    @(0, typeorm_1.Column)('decimal')
    total_fee_B;
    @(0, typeorm_1.Column)('varchar')
    country_model_B;
    @(0, typeorm_1.Column)('text')
    fx_integrity_message;
    @(0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at;
}
exports.RateIntegrityLog = RateIntegrityLog;
//# sourceMappingURL=rate-integrity.entity.js.map