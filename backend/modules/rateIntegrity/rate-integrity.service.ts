import { Injectable } from '@nestjs/common';
import { RateIntegrityLog } from './rate_integrity.entity';

@Injectable()
export class RateIntegrityService {
  logRateIntegritySplit(
    senderView: {
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
    },
    receiverView: {
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
    }
  ): RateIntegrityLog {
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
}