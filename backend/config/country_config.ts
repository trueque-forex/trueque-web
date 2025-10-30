export type CountryConfig = {
  country_code: string;
  country_name: string;
  model_type: 'OM' | 'MTB' | 'Hybrid';
  currency: string;
  language: 'es' | 'pt' | 'en';
  default_transmitter: string;
  fee_structure: {
    trueque_fee: 'flat' | 'percentage';
    transmitter_fee: 'flat' | 'percentage';
    delivery_speed_options: string[];
  };
  compliance_notes: string;
  kyc_level_required: number;
};

export const COUNTRY_CONFIGS: CountryConfig[] = [
  {
    country_code: 'AR',
    country_name: 'Argentina',
    model_type: 'OM',
    currency: 'ARS',
    language: 'es',
    default_transmitter: 'PartnerX',
    fee_structure: {
      trueque_fee: 'percentage',
      transmitter_fee: 'flat',
      delivery_speed_options: ['instant', 'same_day']
    },
    compliance_notes: 'Requires CUIT validation for outbound',
    kyc_level_required: 2
  },
  {
    country_code: 'CO',
    country_name: 'Colombia',
    model_type: 'Hybrid',
    currency: 'COP',
    language: 'es',
    default_transmitter: 'Transmisiones S.A.',
    fee_structure: {
      trueque_fee: 'flat',
      transmitter_fee: 'percentage',
      delivery_speed_options: ['instant', 'next_day']
    },
    compliance_notes: 'Requires KYC level 2 for outbound',
    kyc_level_required: 2
  },
  {
    country_code: 'MX',
    country_name: 'Mexico',
    model_type: 'MTB',
    currency: 'MXN',
    language: 'es',
    default_transmitter: 'Trueque Direct',
    fee_structure: {
      trueque_fee: 'percentage',
      transmitter_fee: 'percentage',
      delivery_speed_options: ['instant', 'same_day', 'next_day']
    },
    compliance_notes: 'Trueque operates as transmitter',
    kyc_level_required: 1
  }
];
