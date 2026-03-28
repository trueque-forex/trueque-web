
export interface PaymentInstructions {
    rail: string;             // e.g., "BIZUM", "TRANSFIYA"
    bank_name: string;        // e.g., "BBVA"
    account_identifier: string; // The Phone Number or IBAN
    beneficiary: string;      // Who is receiving the money
    concept_code: string;     // The Reference Code
    step_by_step: string;     // Full instructions
    voucher_code?: string;    // Optional code for Retailer/Voucher rails
}

export interface TradeDetails {
    id: string;
    type: "DIRECT" | "SYNTHETIC";
    status: string;
    amount: string;
    currency: string;
    payment_instructions: PaymentInstructions;
    inbound_confirmed: boolean;
    sent_currency?: string;
    total_fees?: string;
    total_to_pay?: string;
    received_amount?: string;
    received_currency?: string;
    amount_received?: string;
    currency_received?: string;
    beneficiary_name?: string;
    payout_method?: string;
}
