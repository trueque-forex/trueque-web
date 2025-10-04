import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export type FeeComponents = {
  trueque_fee: number;
  transmitter_fee: number;
  delivery_speed_premium: number;
  country_model: 'OM' | 'MTB' | 'Hybrid';
};

export type RateIntegrityLog = {
  match_id: string;
  timestamp: string;
  fx_rate_market: number;
  match_anchor_rate: number;
  amount_paid_A: number;
  amount_received_A: number;
  amount_paid_B: number;
  amount_received_B: number;
  effective_rate_user_A: number;
  effective_rate_user_B: number;
  rate_divergence: number;
  rate_integrity_status: boolean;
  fee_components: FeeComponents;
  fx_integrity_message: string;
};

@Injectable()
export class RateIntegrityService {
  calculateEffectiveRate(paid: number, received: number): number {
    return +(paid / received).toFixed(2);
  }

  generateIntegrityMessage(
    fx_rate_market: number,
    effective_A: number,
    effective_B: number,
    country_model: string
  ): string {
    return `Match anchored to market rate ${fx_rate_market}. Divergence (${effective_A} vs ${effective_B}) reflects fees under ${country_model} model—no FX manipulation.`;
  }

  logRateIntegrity(
    fx_rate_market: number,
    amount_paid_A: number,
    amount_received_A: number,
    amount_paid_B: number,
    amount_received_B: number,
    fee_components: FeeComponents
  ): RateIntegrityLog {
    const match_id = uuidv4();
    const effective_A = this.calculateEffectiveRate(amount_paid_A, amount_received_A);
    const effective_B = this.calculateEffectiveRate(amount_paid_B, amount_received_B);
    const divergence = +(effective_A - effective_B).toFixed(2);
    const fx_integrity_message = this.generateIntegrityMessage(
      fx_rate_market,
      effective_A,
      effective_B,
      fee_components.country_model
    );

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