import re

with open("c:/Users/werne/Trueque/trueque_web/src/pages/review.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Imports
imports = """import TransactionSummary from '@/components/shared/TransactionSummary';
import PaymentMethodForm, { PaymentData } from '@/components/shared/PaymentMethodForm';"""
if "TransactionSummary" not in content:
    content = content.replace("import Header from '../components/Header';", "import Header from '../components/Header';\n" + imports)

# 2. Add State
state_vars = """  const [holidayModeCountry, setHolidayModeCountry] = useState<string | null>(null);

  const [useNewMethod, setUseNewMethod] = useState(false);
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);"""
content = re.sub(r"const \[holidayModeCountry, setHolidayModeCountry\] = useState<string \| null>\(null\);", state_vars, content)

# 3. Update processSwap adyen token
content = content.replace(
    'adyen_stored_payment_id: "mock_adyen_token_taker_999", // Mock funding',
    'adyen_stored_payment_id: (useNewMethod && paymentData) ? paymentData.token : "mock_adyen_token_taker_999",'
)

content = content.replace(
    "payoutMethod: paymentMethods.find(m => m.id === selectedMethodId)?.type || 'RTP',",
    "payoutMethod: useNewMethod ? (paymentData?.methodId || 'card') : (paymentMethods.find(m => m.id === selectedMethodId)?.type || 'RTP'),"
)

# 4. Replace LEFT: PAYMENT
left_payment_pattern = r"\{/\* LEFT: PAYMENT \*/\}.*?\{/\* RIGHT: BREAKDOWN \*/\}"
left_payment_replacement = """{/* LEFT: PAYMENT */}
          <div>
            <h2 style={{ fontSize: '22px', color: '#2c3e50', marginBottom: '20px' }}>Select Funding Method</h2>
            
            <PaymentMethodForm 
               gateways={[
                 { id: 'rtp', label: 'Instant Bank (RTP)', pct: 0, fixed: 0.50 },
                 { id: 'card', label: 'Debit / Credit Card', pct: 0.029, fixed: 0.30 },
                 { id: 'zelle', label: 'Zelle', pct: 0, fixed: 0 }
               ]}
               selectedMethodId={useNewMethod ? (paymentData?.methodId || 'card') : null}
               onMethodSelect={(id) => {
                 setUseNewMethod(true);
                 if (paymentData) {
                   setPaymentData({ ...paymentData, methodId: id as any });
                 } else {
                   setPaymentData({ methodId: id as any } as any);
                 }
               }}
               onDataChange={(valid, data) => {
                 setIsPaymentValid(valid);
                 setPaymentData(data);
               }}
            />

            {!useNewMethod && (
               <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>Saved Funding Methods</label>
                  <select value={selectedMethodId} onChange={(e) => setSelectedMethodId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white' }}>
                    {paymentMethods.map(renderMethodOption)}
                  </select>
               </div>
            )}
            
            <div style={{ marginTop: '25px', textAlign: 'center' }}>
               <button onClick={() => setUseNewMethod(!useNewMethod)} style={{ background: 'none', border: 'none', color: brandConfig.theme.actionColor, textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
                 {useNewMethod ? 'Use a saved method instead' : '+ Add new payment method'}
               </button>
            </div>

            <div style={{ marginTop: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>Delivery Method (Pay-Out Rail)</label>
              <select value={payOutRail} onChange={(e) => setPayOutRail(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white' }}>
                <option value="RTP">Bank Transfer (RTP) - $0.50</option>
                <option value="SPEI">SPEI (Mexico Transfer) - $0.05</option>
                <option value="PUSH_TO_CARD">Push-to-Card - 1.5%</option>
              </select>
            </div>
          </div>

          {/* RIGHT: BREAKDOWN */}"""
content = re.sub(left_payment_pattern, left_payment_replacement, content, flags=re.DOTALL)

# 5. Replace RIGHT: BREAKDOWN
right_breakdown_pattern = r"\{/\* RIGHT: BREAKDOWN \*/\}.*?\{/\* FOOTER ACTIONS - EXACT HARMONY WITH BENEFICIARY.TSX \*/\}"
right_breakdown_replacement = """{/* RIGHT: BREAKDOWN */}
          <div>
            <TransactionSummary
              title="Transaction Breakdown"
              subtitle=""
              hideHeader={true}
              amount={currencyFmt(breakdown.principalSource)}
              sourceCurrency={fromCurr}
              amountReceived={currencyFmt(breakdown.grossReceive)}
              targetCurrency={targetCurr}
              beneficiaryName={effectiveBeneficiary?.first_name ? `${effectiveBeneficiary.first_name} ${effectiveBeneficiary.last_name || ''}` : (effectiveBeneficiary?.name || '-')}
              fundingMethodName={useNewMethod ? (paymentData?.methodId === 'rtp' ? 'Bank (RTP)' : 'Card') : (paymentMethods.find(m => m.id === selectedMethodId)?.label || '-')}
              symmetriFee={currencyFmt(breakdown.platformFee)}
              inboundFee={currencyFmt((breakdown as any).inboundFee + ((breakdown as any).cardFixedFee || 0))}
              outboundFee={currencyFmt(breakdown.outboundFee)}
              additionalFees={[
                ...(breakdown.gatewayFee > 0 ? [{ label: 'Gateway Processing', amount: currencyFmt(breakdown.gatewayFee) }] : []),
                ...(breakdown.liquidityFee > 0 ? [{ label: 'Instant Liquidity', amount: currencyFmt(breakdown.liquidityFee) }] : []),
                ...breakdown.appliedTaxes.map(tax => ({ label: tax.label, amount: currencyFmt(tax.amountSource) }))
              ]}
              totalFees={currencyFmt(breakdown.totalFeesSource)}
              effectiveRate={effectiveRate.toFixed(4)}
            />

            {/* FOOTER ACTIONS - EXACT HARMONY WITH BENEFICIARY.TSX */}"""
content = re.sub(right_breakdown_pattern, right_breakdown_replacement, content, flags=re.DOTALL)

# Write back
with open("c:/Users/werne/Trueque/trueque_web/src/pages/review.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done refactoring review.tsx")
