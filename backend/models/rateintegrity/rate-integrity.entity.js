var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
let RateIntegrityLog = class RateIntegrityLog {
    id;
    fx_rate_market;
    spread;
    bid_rate;
    ask_rate;
    effective_rate_user_A;
    effective_rate_user_B;
    trueque_fee_A;
    transmitter_fee_A;
    delivery_premium_A;
    total_fee_A;
    country_model_A;
    trueque_fee_B;
    transmitter_fee_B;
    delivery_premium_B;
    total_fee_B;
    country_model_B;
    fx_integrity_message;
    created_at;
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "id", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "fx_rate_market", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "spread", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "bid_rate", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "ask_rate", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "effective_rate_user_A", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "effective_rate_user_B", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "trueque_fee_A", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "transmitter_fee_A", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "delivery_premium_A", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "total_fee_A", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], RateIntegrityLog.prototype, "country_model_A", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "trueque_fee_B", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "transmitter_fee_B", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "delivery_premium_B", void 0);
__decorate([
    Column('decimal'),
    __metadata("design:type", Number)
], RateIntegrityLog.prototype, "total_fee_B", void 0);
__decorate([
    Column('varchar'),
    __metadata("design:type", String)
], RateIntegrityLog.prototype, "country_model_B", void 0);
__decorate([
    Column('text'),
    __metadata("design:type", String)
], RateIntegrityLog.prototype, "fx_integrity_message", void 0);
__decorate([
    Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], RateIntegrityLog.prototype, "created_at", void 0);
RateIntegrityLog = __decorate([
    Entity()
], RateIntegrityLog);
export { RateIntegrityLog };
