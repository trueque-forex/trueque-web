"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateSpreadService = void 0;
const common_1 = require("@nestjs/common");
const country_config_1 = require("../../config/country_config");
@(0, common_1.Injectable)()
class RateSpreadService {
    getSpreadForCorridor(senderCountry, receiverCountry) {
        const senderConfig = (0, country_config_1.getCountryConfig)(senderCountry);
        const receiverConfig = (0, country_config_1.getCountryConfig)(receiverCountry);
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
}
exports.RateSpreadService = RateSpreadService;
//# sourceMappingURL=rateSpread.service.js.map