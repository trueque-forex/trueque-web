import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';
import { useRequireAuth } from '../hooks/useRequireAuth';

// ----------------------
// TYPES & MOCKS
// ----------------------

type PaymentType = 'RTP' | 'CARD';
type CardNetwork = 'visa' | 'mastercard' | 'amex';
type CardType = 'debit' | 'credit';

interface PaymentMethod {
  id: string;
  type: PaymentType;
  label: string;
  last4?: string;
  expiry?: string;
  network?: CardNetwork;
  isExpired?: boolean;
  cardType?: CardType;
}

const MOCK_STORED_METHODS: PaymentMethod[] = [
  { id: 'method_rtp', type: 'RTP', label: 'Bank Transfer (RTP/ACH)' },
  { id: 'card_1', type: 'CARD', label: 'Chase Sapphire', last4: '4242', expiry: '12/28', network: 'visa', cardType: 'credit' },
  { id: 'card_2', type: 'CARD', label: 'Citi Double Cash', last4: '8888', expiry: '10/24', network: 'mastercard', isExpired: true, cardType: 'credit' },
  { id: 'card_3', type: 'CARD', label: 'Bank Debit', last4: '1005', expiry: '05/26', network: 'visa', cardType: 'debit' },
];

// ----------------------
// GLOBAL COMPLIANCE ENGINE
// ----------------------
interface TaxRule {
  label: string;
  rate: number;
}

interface CountryCompliance {
  name: string;
  rules: TaxRule[];
}

const COMPLIANCE_REGISTRY: Record<string, CountryCompliance> = {
  'ARS': {
    name: 'Argentina',
    rules: [
      { label: 'Impuesto Créditos/Débitos', rate: 0.006 },
      { label: 'Ingresos Brutos (IIBB)', rate: 0.00 }
    ]
  },
  'BRL': {
    name: 'Brazil',
    rules: [
      { label: 'IOF (Tax on Financial Ops)', rate: 0.0038 }
    ]
  },
  'EUR': { name: 'Eurozone', rules: [] },
  'USD': { name: 'United States', rules: [] },
  'MXN': {
    name: 'Mexico',
    rules: [
      { label: 'SPEI Fee (Domestic Rail)', rate: 0.00 }, // Usually flat, mocking rate for agnostic engine
      { label: 'IVA (On Fees)', rate: 0.16 } // VAT on service fees
    ]
  }
};

// ----------------------
// CONFIGURATION
// ----------------------
const GATEWAY_PROCESSING_COST = 2.50;
const TRUEQUE_PLATFORM_FEE = 0.005;
const RETAILER_VOUCHER_FEE = 2.00; // Mock Retailer Fee

// Card Specifics
const CARD_DEBIT_INBOUND_PCT = 0.015;
const CARD_DEBIT_LIQUIDITY_PCT = 0.005;
const CARD_CREDIT_INBOUND_PCT = 0.029;
const CARD_CREDIT_LIQUIDITY_PCT = 0.015;
const CARD_FIXED_FEE = 0.30;


const Tooltip = ({ text }: { text: string }) => (
  <span title={text} style={{ cursor: 'help', marginLeft: '6px', color: '#bdc3c7', fontSize: '14px' }}>ⓘ</span>
);

const currencyFmt = (amount: number) =>
  amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ReviewPage() {
  useRequireAuth();
  const router = useRouter();
  const { swapIntent, beneficiary: contextBeneficiary, validateSwapLimit } = useSwap();
  const { from: qFrom, to: qTo } = router.query;

  // State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(MOCK_STORED_METHODS);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('method_rtp');
  const [holidayModeCountry, setHolidayModeCountry] = useState<string | null>(null);

  // FETCH: Holiday Config
  useEffect(() => {
    fetch('/api/config/status')
      .then(res => res.json())
      .then(data => setHolidayModeCountry(data.holiday_mode))
      .catch(err => console.error("Failed to fetch holiday status", err));
  }, []);

  // HYDRATION: Restore 'Maria' and Swap Amount if Context Lost
  useEffect(() => {
    // 1. Restore Beneficiary
    if (!contextBeneficiary) {
      const savedBen = localStorage.getItem('selected_beneficiary');
      if (savedBen) {
        try {
          const parsedBen = JSON.parse(savedBen);
          // We can't easily force it into 'useSwap' context from here without a setter exposed in context.
          // But we can rely on reading it directly or using a local override if we refactored 'contextBeneficiary' usage.
          // Ideally Context exposes 'setBeneficiary'. For now, we might just have to reload the page or accept it?
          // Actually, 'review.tsx' uses 'contextBeneficiary' in Effect dependency [156, 232].
          // Better: Update internal state? 
          // Wait, review.tsx doesn't have local state for beneficiary. It reads from Context.
          // CRITICAL: We need a local fallback state or we assume SwapContext *also* hydrates?
          // Let's modify SwapContext? No, user said "In... Review page... ensure...".
          // We will check 'current_beneficiary' in the calculation Effect directly if contextBeneficiary is null.
        } catch { }
      }
    }
  }, [contextBeneficiary]);

  // LOCAL OVERRIDE HOOK for Calculation
  const resolveBeneficiary = () => {
    if (contextBeneficiary) return contextBeneficiary;
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem('selected_beneficiary') || 'null'); } catch { }
    }
    return null;
  };
  const effectiveBeneficiary = resolveBeneficiary();

  // LOCAL OVERRIDE HOOK for Swap Intent
  const resolveSwapIntent = () => {
    if (swapIntent) return swapIntent;
    if (typeof window !== 'undefined') {
      try {
        const s = JSON.parse(localStorage.getItem('trueque_swap_state_persistent') || 'null');
        if (s) return { amount: parseFloat(s.amount), currencyTo: (s.currencyTo || '').split('-')[1] }; // Partial map
      } catch { }
    }
    return {};
  };
  const effectiveSwapIntent: any = resolveSwapIntent();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'bank' | 'card' | 'wallet'>('card');
  const [addingMethod, setAddingMethod] = useState(false);
  const [newForm, setNewForm] = useState({
    holderName: '', iban: '', cardNumber: '', expiry: '', cvv: '', cardType: 'debit' as CardType, walletProvider: '', walletId: ''
  });

  const [loading, setLoading] = useState(false);
  const [showCancelLogic, setShowCancelLogic] = useState(false);

  const handleAbortTransaction = () => {
    // Session Cleanup: Clear SwapIntent to prevent ghost data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trueque_swap_state_persistent');
    }
    // Navigation Target: Dashboard (Home)
    router.push('/');
  };

  // Computed Breakdown
  const [breakdown, setBreakdown] = useState({
    principalSource: 0,   // SACRED Swap Amount (EUR)
    grossReceive: 0,      // SACRED Beneficiary Receive (Dest Currency)
    inboundFee: 0,
    liquidityFee: 0,
    gatewayFee: 0,
    outboundFee: 0,
    retailerFee: 0,
    platformFee: 0,
    appliedTaxes: [] as { label: string, amountSource: number }[],
    totalFeesSource: 0,
    totalToPaySource: 0
  });

  // ---------------------------------------------------------
  // CORE LOGIC: STRICT ADDITIVE MODEL + COMPLIANCE ENGINE
  // ---------------------------------------------------------
  useEffect(() => {
    // 1. Resolve Principal
    const amount = effectiveSwapIntent?.amount || parseFloat(router.query.amountIntent as string) || 0;
    const rate = effectiveSwapIntent?.rate || parseFloat(router.query.rate as string) || 1050.00;
    const toCurrency = (effectiveSwapIntent?.currencyTo || qTo || 'ARS') as string;

    if (!amount || !rate) return;

    let principalSource = 0;
    let grossReceive = 0;

    // Detect Source vs Target Intent
    if (toCurrency === 'ARS' && amount > 5000) {
      // Target Intent (e.g. 120,000 ARS)
      grossReceive = amount;
      principalSource = amount / rate;
    } else {
      // Source Intent (e.g. 100 EUR)
      principalSource = amount;
      grossReceive = amount * rate;
    }

    // 2. Identify Methods
    const payMethod = paymentMethods.find(m => m.id === selectedMethodId);
    const isCard = payMethod?.type === 'CARD';
    const isCredit = isCard && payMethod?.cardType === 'credit';
    const deliveryMethod = effectiveBeneficiary?.banking?.deliveryMethod || 'bank_rtp';
    const isVoucher = effectiveSwapIntent?.offerType === 'retail_voucher' || effectiveSwapIntent?.offerType === 'merchant_voucher';

    // 3. Calculate ADDITIVE Fees (Fuel) -> All in EUR
    let inboundPctFee = 0;
    let cardFixedFee = 0;

    let liquidityFee = 0;
    if (isCard) {
      const iPct = isCredit ? CARD_CREDIT_INBOUND_PCT : CARD_DEBIT_INBOUND_PCT;
      let lPct = isCredit ? CARD_CREDIT_LIQUIDITY_PCT : CARD_DEBIT_LIQUIDITY_PCT;

      // HOLIDAY MODE CHECK
      if (holidayModeCountry && holidayModeCountry === toCurrency) {
        // console.log("Holiday Mode Active for:", toCurrency, "- Doubling Liquidity Fee");
        lPct *= 2.0;
      }

      inboundPctFee = principalSource * iPct;
      cardFixedFee = CARD_FIXED_FEE;
      liquidityFee = principalSource * lPct;
    }

    const gatewayFee = GATEWAY_PROCESSING_COST;
    const platformFee = principalSource * TRUEQUE_PLATFORM_FEE;

    let outboundFee = 0;
    if (deliveryMethod === 'card_push') outboundFee = principalSource * 0.015;
    else if (deliveryMethod === 'wallet') outboundFee = 0.50;

    // VOUCHER LOGIC
    let retailerFee = 0;
    if (isVoucher) {
      outboundFee = 0; // Disable outbound for vouchers
      // If Merchant Voucher, maybe fee is different? For now assume same RETAILER_VOUCHER_FEE check.
      // Or we can differentiate: if (swapIntent.offerType === 'merchant_voucher') ...
      retailerFee = RETAILER_VOUCHER_FEE;
    }

    // D. COMPLIANCE ENGINE (Dynamic Taxes)
    // FORCE UPDATE: Rename and Ensure 0.6% for ARS
    if (toCurrency === 'ARS') {
      COMPLIANCE_REGISTRY['ARS'].rules = [
        { label: 'ARS Bank Tax (0.6%)', rate: 0.006 },
        { label: 'Ingresos Brutos (IIBB)', rate: 0.00 }
      ];
    }

    const compliance = COMPLIANCE_REGISTRY[toCurrency] || { rules: [] };
    const appliedTaxes = compliance.rules
      .map(rule => {
        // Tax on Domestic Leg
        const destTaxAmount = grossReceive * rule.rate;
        // Convert to Source (Fuel)
        const sourceTaxAmount = destTaxAmount / rate;
        return { label: rule.label, amountSource: sourceTaxAmount };
      })
      .filter(t => t.amountSource > 0);

    const matchTaxesTotal = appliedTaxes.reduce((acc, t) => acc + t.amountSource, 0);

    // Total Fees = (Inbound % + Card Fixed) + Liquidity + Gateway + Platform + (Outbound OR Retailer) + Taxes
    const totalFeesSource = inboundPctFee + cardFixedFee + liquidityFee + gatewayFee + outboundFee + retailerFee + platformFee + matchTaxesTotal;
    const totalToPaySource = principalSource + totalFeesSource;

    setBreakdown({
      principalSource,
      grossReceive,
      inboundFee: inboundPctFee, // Mapping 'inboundFee' to just the % part for state, but we need separate display
      liquidityFee,
      gatewayFee,
      outboundFee,
      retailerFee,
      platformFee,
      appliedTaxes,
      totalFeesSource,
      totalToPaySource,
      // @ts-ignore - Augmenting state for display without breaking interface yet (or we can just use vars in render if we calculate there, but better to put in state)
      // Actually, we'll just store them in the standard state if we update the type, but for now let's rely on consistent calculation or add custom fields.
      // Let's add them to the state object to be safe.
      cardFixedFee
    } as any);

  }, [effectiveSwapIntent, router.query, selectedMethodId, effectiveBeneficiary, qTo, paymentMethods, holidayModeCountry]);


  // Handlers
  const handleAddNewMethod = () => {
    setAddingMethod(true);
    setTimeout(() => {
      const id = `new_${Date.now()}`;
      const newMethod: PaymentMethod = newMethodType === 'card'
        ? { id, type: 'CARD', label: `${newForm.cardType} •• ${newForm.cardNumber.slice(-4)}`, last4: newForm.cardNumber.slice(-4), expiry: newForm.expiry, cardType: newForm.cardType as CardType }
        : { id, type: 'RTP', label: 'Bank Account' };
      setPaymentMethods(prev => [...prev, newMethod]);
      setSelectedMethodId(id);
      setShowAddModal(false);
      setAddingMethod(false);
      setNewForm({ holderName: '', iban: '', cardNumber: '', expiry: '', cvv: '', cardType: 'debit', walletProvider: '', walletId: '' });
    }, 1000);
  };

  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState(['', '', '', '', '', '']); // Changed to array
  const [mfaError, setMfaError] = useState('');
  const [method, setMethod] = useState<'whatsapp' | 'sms'>('whatsapp');
  const mfaInputs = useRef<(HTMLInputElement | null)[]>([]);

  // MFA Logic Helpers
  const handleMfaInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...mfaCode];
    newCode[index] = value.slice(-1);
    setMfaCode(newCode);
    if (value && index < 5 && mfaInputs.current[index + 1]) {
      mfaInputs.current[index + 1]?.focus();
    }
  };

  const handleMfaKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !mfaCode[index] && index > 0) {
      mfaInputs.current[index - 1]?.focus();
    }
  };

  const processSwap = async () => {
    setLoading(true);
    try {
      const s = JSON.parse(localStorage.getItem('trueque_session') || '{}');
      const name = s.firstName || s.email?.split('@')[0] || 'Joao';
      const brandedId = `${name.toUpperCase()} TID`;

      const payload = {
        amount: breakdown.totalToPaySource,
        currencyFrom: 'EUR',
        currencyTo: swapIntent?.currencyTo || qTo,
        beneficiaryId: effectiveBeneficiary?.id,
        provider: swapIntent?.provider
      };

      const res = await fetch('/api/swaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Swap failed');

      s.txCount = (s.txCount || 0) + 1;
      localStorage.setItem('trueque_session', JSON.stringify(s));

      router.push({
        pathname: '/secure-swap',
        query: {
          transactionId: brandedId,
          amountTotal: breakdown.totalToPaySource.toFixed(2),
          amountPrincipal: breakdown.principalSource.toFixed(2),
          amountFees: breakdown.totalFeesSource.toFixed(2),
          currency: 'EUR',
          tid: brandedId,
          amountReceive: breakdown.grossReceive.toFixed(2),
          currencyTo: swapIntent?.currencyTo || qTo,
          methodType: paymentMethods.find(m => m.id === selectedMethodId)?.type || 'RTP',
          init: 'true'
        }
      });
    } catch (e) {
      console.error(e);
      alert('Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    // 1. GUARDRAIL CHECK
    // Allow APPROVED users to bypass limit checks
    // We need to access user from Auth context to check status reliably
    const s = JSON.parse(localStorage.getItem('trueque_session') || '{}');
    const isApproved = (s.kycStatus || '').toUpperCase() === 'APPROVED';

    if (!isApproved) {
      const guard = validateSwapLimit ? validateSwapLimit(breakdown.totalToPaySource) : { allowed: true };
      if (!guard.allowed) {
        alert(guard.reason || "Transaction limit exceeded.");
        return;
      }
    }

    // 2. MFA CHECK (Flow A vs B Logic)
    // Flow A: Low Value (< 200 EUR) -> Skip Second Factor (Frictionless) - DISABLED FOR SECURITY
    // Flow B: High Value (>= 200 EUR) -> Force Identity Verification - NOW UNIVERSAL
    // if (breakdown.totalToPaySource < 200) {
    //   console.log('Flow A: Skipping MFA for low value swap');
    //   processSwap();
    // } else {
    setShowMFA(true);
    // }
  };

  const handleVerifyMFA = () => {
    const fullCode = mfaCode.join('');
    if (fullCode === '123456') {
      setShowMFA(false);
      processSwap();
    } else {
      setMfaError('Invalid code. Try 123456');
    }
  };

  // Render Helpers
  const renderMethodOption = (method: PaymentMethod) => {
    if (method.type === 'RTP') return <option key={method.id} value={method.id}>Bank Transfer (RTP) - Best Value</option>;
    return <option key={method.id} value={method.id} disabled={method.isExpired}>{method.label} {method.isExpired ? '(Expired)' : ''}</option>;
  };

  const isVoucher = swapIntent?.offerType === 'retail_voucher' || swapIntent?.offerType === 'merchant_voucher';

  // Styles
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#57606f' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '14px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <Header />
      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 1fr', gap: '40px', backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {/* LEFT: PAYMENT */}
          <div>
            <h2 style={{ fontSize: '22px', color: '#2c3e50', marginBottom: '20px' }}>Select Funding Method</h2>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>Fund With</label>
              <select value={selectedMethodId} onChange={(e) => e.target.value === 'add_new' ? setShowAddModal(true) : setSelectedMethodId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #bdc3c7', fontSize: '16px', backgroundColor: 'white' }}>
                {paymentMethods.map(renderMethodOption)}
                <option value="add_new">+ Add New Funding Method</option>
              </select>
            </div>
            <div style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, #f6f8f9 0%, #e5ebee 100%)', border: '1px solid #dcdde1', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '24px' }}>{paymentMethods.find(m => m.id === selectedMethodId)?.type === 'RTP' ? '🏦' : '💳'}</div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{paymentMethods.find(m => m.id === selectedMethodId)?.label}</div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                  {paymentMethods.find(m => m.id === selectedMethodId)?.type === 'RTP' ? 'Linked Bank Account' : `${(paymentMethods.find(m => m.id === selectedMethodId)?.cardType || 'debit').toUpperCase()} ending in ${paymentMethods.find(m => m.id === selectedMethodId)?.last4}`}
                </div>
              </div>
            </div>

            {/* Add New Modal */}
            {showAddModal && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div style={{ background: 'white', padding: 30, borderRadius: 12, width: 400 }}>
                <h3>Add Method (Mock)</h3>
                <p>Mock interface for adding a dummy method.</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                  <button onClick={() => setShowAddModal(false)} style={{ padding: '10px', flex: 1 }}>Cancel</button>
                  <button onClick={handleAddNewMethod} style={{ padding: '10px', flex: 1, background: '#2c3e50', color: 'white' }}>Save Mock</button>
                </div>
              </div>
            </div>}
          </div>

          {/* RIGHT: BREAKDOWN */}
          <div>
            <div style={{ backgroundColor: '#fdfdfd', border: '1px solid #e1e8ed', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2c3e50' }}>Transaction Breakdown</h3>

              {/* SACRED SWAP INTENT */}
              <div style={{ ...rowStyle, fontSize: '16px', marginBottom: '10px' }}>
                <span>Swap Amount <span style={{ fontSize: '11px', color: '#7f8c8d', background: '#ecf0f1', padding: '2px 6px', borderRadius: '4px' }}>SACRED</span></span>
                <span style={{ fontWeight: '600', color: '#2c3e50' }}>€{currencyFmt(breakdown.principalSource)}</span>
              </div>

              {/* SACRED RECEIVE */}
              <div style={{ ...rowStyle, fontSize: '16px', marginBottom: '20px', color: '#27ae60' }}>
                <span style={{ fontWeight: '600' }}>
                  {isVoucher ?
                    (swapIntent?.offerType === 'merchant_voucher' ? 'Sacred Merchant Value' : 'Sacred Voucher Value')
                    : 'Beneficiary Receives (Sacred)'}
                </span>
                <span style={{ fontWeight: '800' }}>{currencyFmt(breakdown.grossReceive)} {swapIntent?.currencyTo || 'ARS'}</span>
              </div>

              <div style={{ borderTop: '1px solid #eee', margin: '15px 0' }}></div>

              <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px' }}>+ Applicable Fees (Fuel)</h4>

              {/* ADDITIVE FEES Breakdown - 5 Core Fees */}
              {/* 1. Inbound (Percentage) */}
              <div style={rowStyle}>
                <span>Inbound Fuel ({(breakdown as any).inboundFee > 0 ? 'Variable' : 'Free'}) <Tooltip text="The cost your bank or local payment app charges to move your money into the system" /></span>
                <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.inboundFee)}</span>
              </div>

              {/* 2. Card Fixed - NEW */}
              {(breakdown as any).cardFixedFee > 0 && (
                <div style={rowStyle}>
                  <span>Card Processing (Fixed) <Tooltip text="Network fixed fee" /></span>
                  <span style={{ color: '#2c3e50' }}>+ €{currencyFmt((breakdown as any).cardFixedFee)}</span>
                </div>
              )}

              {/* 3. Premium / Liquidity */}
              {breakdown.liquidityFee > 0 && <div style={rowStyle}>
                <span>Instant Liquidity <Tooltip text="This covers the cost for the independent Gateway institution to advance money to your recipient immediately, even if your bank or card takes days to finish the transfer" /></span>
                <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.liquidityFee)}</span>
              </div>}

              {/* 4. Gateway */}
              <div style={rowStyle}>
                <span>Gateway Processing <Tooltip text="A small fee paid to an independent financial institution (the 'Gateway') that handles your money. This institution acts as a buffer to ensure your personal bank details are never shared directly with the recipient or their bank" /></span>
                <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.gatewayFee)}</span>
              </div>

              {/* 5. Service / Platform */}
              <div style={rowStyle}>
                <span>Platform Fee <Tooltip text="The cost for using the Trueque app to find the best market rate and organize your swap from start to finish" /></span>
                <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.platformFee)}</span>
              </div>

              {/* Conditional Outbound vs Retailer */}
              {!isVoucher && (
                <div style={rowStyle}>
                  <span>Outbound Fuel (Delivery) <Tooltip text="The cost your bank or local payment app charges to delivery the funds to the recipient" /></span>
                  <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.outboundFee)}</span>
                </div>
              )}
              {isVoucher && (
                <div style={rowStyle}>
                  <span>Retailer Activation <Tooltip text="Merchant processing fee" /></span>
                  <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(breakdown.retailerFee)}</span>
                </div>
              )}

              {/* DYNAMIC COMPLIANCE TAXES */}
              {breakdown.appliedTaxes.map((tax, i) => (
                <div key={i} style={rowStyle}>
                  <span>{tax.label} <Tooltip text="Mandatory taxes required by the government in the destination country. These are deducted by the local bank or delivery partner; Trueque does not receive or handle these funds" /></span>
                  <span style={{ color: '#2c3e50' }}>+ €{currencyFmt(tax.amountSource)}</span>
                </div>
              ))}

              <div style={{ borderTop: '2px solid #e1e8ed', margin: '15px 0' }}></div>

              {/* TOTAL COST */}
              <div style={{ ...rowStyle, color: '#e67e22', fontWeight: 'bold', fontSize: '16px' }}>
                <span>Total Additional Cost (Friction)</span>
                <span>+ €{currencyFmt(breakdown.totalFeesSource)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>Total Cost to You</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: '#2c3e50' }}>€{currencyFmt(breakdown.totalToPaySource)}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '1.1rem', fontWeight: '700', color: '#2c3e50', border: '1px solid #dcdde1', textAlign: 'center' }}>
              Effective Rate: 1 EUR = {(breakdown.principalSource > 0 ? (breakdown.grossReceive / breakdown.totalToPaySource).toFixed(2) : '0.00')} {swapIntent?.currencyTo || 'ARS'} <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#7f8c8d' }}>(includes all friction)</span>
            </div>

            {/* FOOTER ACTIONS - EXACT HARMONY WITH BENEFICIARY.TSX */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              <button
                onClick={() => router.back()}
                style={{
                  flex: 1, padding: '14px', borderRadius: '10px',
                  border: '2px solid #e1e8ed', backgroundColor: 'transparent',
                  color: '#7f8c8d', fontWeight: 'bold', cursor: 'pointer',
                  transition: 'all 0.2s', fontSize: '16px'
                }}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 2, padding: '14px', borderRadius: '10px',
                  border: 'none', backgroundColor: '#4A90E2', // Trueque Blue
                  color: 'white', fontWeight: 'bold', cursor: 'pointer',
                  opacity: loading ? 0.7 : 1, fontSize: '16px',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(74, 144, 226, 0.3)'
                }}
              >
                {loading ? 'Processing...' : `Confirm & Swap €${currencyFmt(breakdown.totalToPaySource)}`}
              </button>
            </div>

            {/* Cancel Transaction Link */}
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button
                onClick={() => setShowCancelLogic(true)}
                style={{
                  background: 'none', border: 'none', color: '#e74c3c',
                  fontSize: '14px', cursor: 'pointer', textDecoration: 'underline'
                }}>
                Cancel Transaction
              </button>
            </div>

            {/* ABORT CONFIRMATION MODAL */}
            {showCancelLogic && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '380px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#c0392b' }}>Cancel Transaction?</h3>
                  <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Are you sure you want to cancel? Your progress will be lost.</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setShowCancelLogic(false)}
                      style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #bdc3c7', borderRadius: '8px', cursor: 'pointer', color: '#2c3e50', fontWeight: 'bold' }}>
                      No, Keep Swapping
                    </button>
                    <button
                      onClick={handleAbortTransaction}
                      style={{ flex: 1, padding: '12px', background: '#e74c3c', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MFA MODAL */}
            {showMFA && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '400px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>

                  <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔒</div>

                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '10px' }}>
                    Two-Step Verification
                  </h2>
                  <p style={{ color: '#7f8c8d', marginBottom: '30px', lineHeight: '1.5' }}>
                    For your security, we've sent a 6-digit code to your registered number via <strong>{method === 'whatsapp' ? 'WhatsApp' : 'SMS'}</strong>.
                  </p>

                  {/* Toggle Method */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
                    <button
                      onClick={() => setMethod('whatsapp')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: method === 'whatsapp' ? '2px solid #2ecc71' : '1px solid #e1e8ed',
                        backgroundColor: method === 'whatsapp' ? '#e8f8f5' : 'white',
                        color: method === 'whatsapp' ? '#27ae60' : '#95a5a6',
                        cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setMethod('sms')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: method === 'sms' ? '2px solid #3498db' : '1px solid #e1e8ed',
                        backgroundColor: method === 'sms' ? '#ebf5fb' : 'white',
                        color: method === 'sms' ? '#2980b9' : '#95a5a6',
                        cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      SMS
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                    {mfaCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { mfaInputs.current[i] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleMfaInput(i, e.target.value)}
                        onKeyDown={(e) => handleMfaKeyDown(i, e)}
                        style={{
                          width: '45px',
                          height: '55px',
                          fontSize: '24px',
                          textAlign: 'center',
                          borderRadius: '8px',
                          border: mfaError ? '2px solid #e74c3c' : '2px solid #e1e8ed',
                          outline: 'none',
                          color: '#2c3e50',
                          fontWeight: 'bold'
                        }}
                      />
                    ))}
                  </div>

                  {mfaError && <div style={{ color: '#e74c3c', marginBottom: '20px', fontSize: '14px' }}>{mfaError}</div>}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => { setShowMFA(false); setShowCancelLogic(true); }}
                      style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #bdc3c7', borderRadius: '8px', cursor: 'pointer', color: '#7f8c8d' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifyMFA}
                      style={{ flex: 1, padding: '14px', background: '#2c3e50', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}
                    >
                      Verify & Swap
                    </button>
                  </div>

                  <div style={{ marginTop: '20px', fontSize: '12px', color: '#95a5a6' }}>
                    Code sent. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => alert('Code Resent!')}>Resend</span>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}