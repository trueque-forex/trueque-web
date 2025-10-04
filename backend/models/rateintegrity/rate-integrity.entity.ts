import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RateIntegrityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal') fx_rate_market: number;
  @Column('decimal') spread: number;

  @Column('decimal') bid_rate: number;
  @Column('decimal') ask_rate: number;

  @Column('decimal') effective_rate_user_A: number;
  @Column('decimal') effective_rate_user_B: number;

  @Column('decimal') trueque_fee_A: number;
  @Column('decimal') transmitter_fee_A: number;
  @Column('decimal') delivery_premium_A: number;
  @Column('decimal') total_fee_A: number;
  @Column('varchar') country_model_A: string;

  @Column('decimal') trueque_fee_B: number;
  @Column('decimal') transmitter_fee_B: number;
  @Column('decimal') delivery_premium_B: number;
  @Column('decimal') total_fee_B: number;
  @Column('varchar') country_model_B: string;

  @Column('text') fx_integrity_message: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}