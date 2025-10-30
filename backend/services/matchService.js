var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
let MatchService = class MatchService {
    rateSpreadService;
    rateIntegrityService;
    notificationService;
    integrityRepo;
    matchRepo;
    constructor(rateSpreadService, rateIntegrityService, notificationService, integrityRepo, matchRepo) {
        this.rateSpreadService = rateSpreadService;
        this.rateIntegrityService = rateIntegrityService;
        this.notificationService = notificationService;
        this.integrityRepo = integrityRepo;
        this.matchRepo = matchRepo;
    }
    async confirmMatch(matchData) {
        const deliveryOptions = {
            instant: { speed: '1hr', premium: 0.6, sla: 60 * 60 * 1000 },
            same_day: { speed: '6hr', premium: 0.3, sla: 6 * 60 * 60 * 1000 },
            next_day: { speed: '24hr', premium: 0.1, sla: 24 * 60 * 60 * 1000 },
            batch: { speed: '48hr+', premium: 0.0, sla: 48 * 60 * 60 * 1000 }
        };
        const { bidRate, askRate, spread, fxRateMarket } = this.rateSpreadService.getSpreadForCorridor(matchData.senderCountry, matchData.receiverCountry);
        const senderSLA = deliveryOptions[matchData.sender_delivery_choice].sla;
        const receiverSLA = deliveryOptions[matchData.receiver_delivery_choice].sla;
        const deliveryPremium = Math.max(deliveryOptions[matchData.sender_delivery_choice].premium, deliveryOptions[matchData.receiver_delivery_choice].premium);
        const deliveryPremiumPerUser = deliveryPremium / 2;
        const matchSLA = Math.max(senderSLA, receiverSLA);
        const matchDeadline = new Date(Date.now() + matchSLA);
        const totalFee = matchData.fee_components.trueque_fee +
            matchData.fee_components.transmitter_fee +
            deliveryPremium;
        const feePerUser = totalFee / 2;
        const senderView = {
            fx_rate_market: fxRateMarket,
            bid_rate: bidRate,
            spread,
            effective_rate: matchData.amount_paid_A / matchData.amount_received_A,
            fee_breakdown: {
                trueque_fee: matchData.fee_components.trueque_fee / 2,
                transmitter_fee: matchData.fee_components.transmitter_fee / 2,
                delivery_premium: deliveryPremiumPerUser,
                total: feePerUser,
                country_model: matchData.fee_components.country_model,
                delivery_choice: matchData.sender_delivery_choice
            }
        };
        const receiverView = {
            fx_rate_market: fxRateMarket,
            ask_rate: askRate,
            spread,
            effective_rate: matchData.amount_paid_B / matchData.amount_received_B,
            fee_breakdown: {
                trueque_fee: matchData.fee_components.trueque_fee / 2,
                transmitter_fee: matchData.fee_components.transmitter_fee / 2,
                delivery_premium: deliveryPremiumPerUser,
                total: feePerUser,
                country_model: matchData.fee_components.country_model,
                delivery_choice: matchData.receiver_delivery_choice
            }
        };
        const integrityLog = this.rateIntegrityService.logRateIntegritySplit(senderView, receiverView);
        await this.integrityRepo.save(integrityLog);
        await this.matchRepo.save({
            senderId: matchData.senderId,
            receiverId: matchData.receiverId,
            matchDeadline,
            delivered: false,
            integrityLog
        });
        await this.notificationService.scheduleNotification({
            userId: matchData.senderId,
            type: 'delivery_update',
            message: `Your match is confirmed. Funds will be delivered within ${deliveryOptions[matchData.sender_delivery_choice].speed}.`,
            deadline: matchDeadline
        });
        await this.notificationService.scheduleNotification({
            userId: matchData.receiverId,
            type: 'delivery_update',
            message: `You’ll receive funds within ${deliveryOptions[matchData.receiver_delivery_choice].speed}.`,
            deadline: matchDeadline
        });
    }
};
MatchService = __decorate([
    Injectable(),
    __param(3, InjectRepository(RateIntegrityLog)),
    __param(4, InjectRepository(Match)),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], MatchService);
export { MatchService };
