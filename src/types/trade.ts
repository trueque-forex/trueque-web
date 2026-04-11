
export interface PaymentInstructions {
    rail: string;
    bank_name: string;
    account_identifier: string;
    beneficiary: string;
    concept_code: string;
    step_by_step: string;
    voucher_code?: string;
}

export interface TradeDetails {
    id: string;
    type: 'DIRECT' | 'SYNTHETIC';
    status: string;

    // Viewer's outbound leg
    amount: string;
    sent_currency: string;
    total_fees: string;
    total_to_pay: string;

    // Viewer's inbound leg
    received_amount: string;
    received_currency: string;

    // Confirmation state
    inbound_confirmed: boolean;
    peer_confirmed: boolean;

    // Payment instructions for the funding step
    payment_instructions: PaymentInstructions;

    // Optional metadata
    beneficiary_name?: string;
    payout_method?: string;
    fee_details?: Record<string, number>;
    exchange_rate?: string;

    // Legacy aliases (kept for backwards compat)
    source_currency?: string;
    target_currency?: string;
    amount_received?: string;
    fee_total?: string;
}

