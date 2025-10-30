var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let RateSpreadService = class RateSpreadService {
    getSpreadForCorridor(senderCountry, receiverCountry) {
        const senderConfig = getCountryConfig(senderCountry);
        const receiverConfig = getCountryConfig(receiverCountry);
        // Pull FX anchor rate from trusted source (mocked here)
        const fxRateMarket = this.getMarketRate(senderCountry, receiverCountry);
        // Determine corridor asymmetry
        const corridorAsymmetry = senderConfig.model_type !== receiverConfig.model_type ||
            senderConfig.partner_spread > 1.2 ||
            senderConfig.delivery_cost > 1.5 ||
            senderConfig.fx_volatility > 3;
        // Spread logic
        const spread = corridorAsymmetry ? 0.006 : 0.003;
        const bidRate = fxRateMarket * (1 - spread);
        const askRate = fxRateMarket * (1 + spread);
        return {
            bidRate,
            askRate,
            spread,
            fxRateMarket
        };
    }
    getMarketRate(sender, receiver) {
        // TODO: Replace with real FX source
        if (sender === 'AR' && receiver === 'CL')
            return 8.5;
        if (sender === 'VE' && receiver === 'CO')
            return 35;
        if (sender === 'PE' && receiver === 'BR')
            return 1.35;
        return 1;
    }
};
RateSpreadService = __decorate([
    Injectable()
], RateSpreadService);
export { RateSpreadService };
