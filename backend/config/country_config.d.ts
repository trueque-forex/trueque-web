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
export declare const COUNTRY_CONFIGS: CountryConfig[];
//# sourceMappingURL=country_config.d.ts.map
