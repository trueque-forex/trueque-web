import { Injectable } from '@nestjs/common';
import { getCountryConfig } from '../../config/country_config';

@Injectable()
export class RateSpreadService {
  getSpreadForCorridor(senderCountry: string, receiverCountry: string): {
    bidRate: number;
    askRate: number;
    spread: number;
    fxRateMarket: number;
  } {
    const senderConfig = getCountryConfig(senderCountry);
    const receiverConfig = getCountryConfig(receiverCountry);

    // Pull FX anchor rate from trusted source (mocked here)
    const fxRateMarket = this.getMarketRate(senderCountry, receiverCountry);

    // Determine corridor asymmetry
    const corridorAsymmetry =
      senderConfig.model_type !== receiverConfig.model_type ||
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

  private getMarketRate(sender: string, receiver: string): number {
    // TODO: Replace with real FX source
    if (sender === 'AR' && receiver === 'CL') return 8.5;
    if (sender === 'VE' && receiver === 'CO') return 35;
    if (sender === 'PE' && receiver === 'BR') return 1.35;
    return 1;
  }
}