# Symmetri Backlog

## UI / UX Enhancements (Phase 2 - Currency Flow)
- [ ] **Beneficiary Screen Navigation**: Add 'Back' and 'Forward' buttons to the beneficiary screen.
- [ ] **Funding Method Display Bug**: In the "Select Funding Method" screen, selecting 'Zelle' incorrectly displays 'Card' in the summary box. Ensure the selected method correctly updates the summary display.
- [ ] **Fee Calculation & Final Amounts Display**: Update the summary screen to clearly show the final amount the beneficiary will receive (exact local currency amount swapped) and the final amount the user will pay (principal + fees). The user must bear the cost of the fees, resulting in an increased total cost for them, while the beneficiary receives the exact face value.

## Security & Infrastructure
- [ ] **Supabase Native Test OTP**: Implement Supabase's native Test OTP feature to replace the temporary environment-variable based MFA demo bypass. Connect to a real SMS/WhatsApp provider (like Twilio) for full production rollout.
