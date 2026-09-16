import { useRouter } from 'next/router';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Header from '../components/Header';
import TransactionSummary from '@/components/shared/TransactionSummary';
import PaymentMethodForm, { PaymentData } from '@/components/shared/PaymentMethodForm';
import { useSwap } from '../context/SwapContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import brandConfig from '../config/brand_config.json';

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
  { id: 'method_rtp', type: 'RTP', label: 'Bank Transfer (RTP)' },
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
  base?: 'principal' | 'fees';
}

interface CountryCompliance {
  name: string;
  rules: TaxRule[];
}

const COMPLIANCE_REGISTRY: Record<string, CountryCompliance> = {
  'ARS': {
    name: 'Argentina',
    rules: [
      { label: 'Impuesto Créditos/Débitos', rate: 0.006, base: 'principal' },
      { label: 'Ingresos Brutos (IIBB)', rate: 0.00, base: 'principal' }
    ]
  },
  'BRL': {
    name: 'Brazil',
    rules: [
      { label: 'IOF (Tax on Financial Ops)', rate: 0.0038, base: 'principal' }
    ]
  },
  'EUR': { name: 'Eurozone', rules: [] },
  'USD': { name: 'United States', rules: [] },
  'MXN': {
    name: 'Mexico',
    rules: [
      { label: 'SPEI Fee (Domestic Rail)', rate: 0.00, base: 'principal' }, 
      { label: 'IVA (On Fees)', rate: 0.16, base: 'fees' } 
    ]
  }
};

import {
  GATEWAY_PROCESSING_COST,
  CARD_DEBIT_INBOUND_PCT,
  CARD_DEBIT_LIQUIDITY_PCT,
  CARD_CREDIT_INBOUND_PCT,
  CARD_CREDIT_LIQUIDITY_PCT,
  CARD_FIXED_FEE,
  SYMMETRI_PLATFORM_FEE
} from '../config/pricing';


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
  const [payOutRail, setPayOutRail] = useState<string>((router.query.rail as string) || 'RTP');
    const [holidayModeCountry, setHolidayModeCountry] = useState<string | null>(null);

  const [useNewMethod, setUseNewMethod] = useState(false);
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

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
  const resolveBeneficiary = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('selected_beneficiary');
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error("resolveBeneficiary error", e);
      }
    }
    if (contextBeneficiary && (contextBeneficiary.id || contextBeneficiary.personal?.firstName)) {
      return contextBeneficiary;
    }
    return null;
  }, [contextBeneficiary]);

  const effectiveBeneficiary = useMemo(() => resolveBeneficiary(), [resolveBeneficiary]);
  // LOCAL OVERRIDE HOOK for Swap Intent
  const resolveSwapIntent = () => {
    if (swapIntent) return swapIntent;
    if (typeof window !== 'undefined') {
      try {
        const s = JSON.parse(localStorage.getItem('trueque_swap_state_persistent') || 'null');
        if (s) return { ...s, amount: parseFloat(s.amount), target_currency: (s.target_currency || '').split('-')[1] }; // Full map
      } catch { }
    }
    return {};
  };
  const effectiveSwapIntent: any = resolveSwapIntent();

  // GUARD: Prevent ghost sessions if arriving via Back button with no active swap
  useEffect(() => {
    if (router.isReady) {
      const amount = effectiveSwapIntent?.amount || parseFloat(router.query.amountIntent as string) || 0;
      if (!amount || isNaN(amount)) {
        // If they managed to get here with no intent, kick them back to the start!
        router.replace('/dashboard');
      }
    }
  }, [router.isReady, effectiveSwapIntent, router.query.amountIntent]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethodType, setNewMethodType] = useState<'bank' | 'card' | 'wallet'>('card');
  const [addingMethod, setAddingMethod] = useState(false);
  const [newForm, setNewForm] = useState({
    holderName: '', iban: '', cardNumber: '', expiry: '', cvv: '', cardType: 'debit' as CardType, walletProvider: '', walletId: '',
    bankName: '', accountType: 'checking', routingNumber: '', accountNumber: '', billingZip: '', rtpSupported: false
  });

  const [loading, setLoading] = useState(false);
  const [showCancelLogic, setShowCancelLogic] = useState(false);

  const handleAbortTransaction = () => {
    // Session Cleanup: Clear SwapIntent to prevent ghost data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trueque_swap_state_persistent');
    }
    // Navigation Target: Dashboard (Home)
    router.push('/dashboard');
  };

  // Computed Breakdown
  const [breakdown, setBreakdown] = useState({
    principalSource: 0,   // SACRED Swap Amount (EUR)
    grossReceive: 0,      // SACRED Beneficiary Receive (Dest Currency)
    inboundFee: 0,
    liquidityFee: 0,
    gatewayFee: 0,
    outboundFee: 0,
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
    const rate = effectiveSwapIntent?.rateIntent || effectiveSwapIntent?.exchange_rate || parseFloat(router.query.rateIntent as string) || parseFloat(router.query.rate as string) || 1050.00;
    const toCurrency = (effectiveSwapIntent?.target_currency || qTo || 'ARS') as string;

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
    let isCard = false;
    let isCredit = false;

    if (useNewMethod) {
      isCard = paymentData?.methodId === 'debit' || paymentData?.methodId === 'credit';
      isCredit = paymentData?.methodId === 'credit';
    } else {
      const payMethod = paymentMethods.find(m => m.id === selectedMethodId);
      isCard = payMethod?.type === 'CARD';
      isCredit = isCard && payMethod?.cardType === 'credit';
    }

    const deliveryMethod = effectiveBeneficiary?.banking?.deliveryMethod || 'bank_rtp';

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

    // 5. Symmetri Platform Fee
    const platformFeeRate = SYMMETRI_PLATFORM_FEE;
    const platformFee = principalSource * platformFeeRate;

    let outboundFee = 0;
    const rtpFee = process.env.NEXT_PUBLIC_FEE_RTP ? parseFloat(process.env.NEXT_PUBLIC_FEE_RTP) : 0.50;
    const speiFee = process.env.NEXT_PUBLIC_FEE_SPEI ? parseFloat(process.env.NEXT_PUBLIC_FEE_SPEI) : 0.05;
    
    if (payOutRail === 'PUSH_TO_CARD') outboundFee = principalSource * 0.015;
    else if (payOutRail === 'SPEI') outboundFee = speiFee;
    else if (payOutRail === 'RTP') outboundFee = rtpFee;

    // D. COMPLIANCE ENGINE (Dynamic Taxes)
    // FORCE UPDATE: Rename and Ensure 0.6% for ARS
    if (toCurrency === 'ARS') {
      COMPLIANCE_REGISTRY['ARS'].rules = [
        { label: 'ARS Bank Tax (0.6%)', rate: 0.006, base: 'principal' },
        { label: 'Ingresos Brutos (IIBB)', rate: 0.00, base: 'principal' }
      ];
    }

    const baseFeesSource = inboundPctFee + cardFixedFee + liquidityFee + gatewayFee + outboundFee + platformFee;

    const compliance = COMPLIANCE_REGISTRY[toCurrency] || { rules: [] };
    const appliedTaxes = compliance.rules
      .map(rule => {
        let sourceTaxAmount = 0;
        if (rule.base === 'fees') {
          sourceTaxAmount = baseFeesSource * rule.rate;
        } else {
          // Tax on Domestic Leg Principal
          const destTaxAmount = grossReceive * rule.rate;
          sourceTaxAmount = destTaxAmount / rate;
        }
        return { label: rule.label, amountSource: sourceTaxAmount };
      })
      .filter(t => t.amountSource > 0);

    const matchTaxesTotal = appliedTaxes.reduce((acc, t) => acc + t.amountSource, 0);

    // Total Fees = Base Fees + Taxes
    const totalFeesSource = baseFeesSource + matchTaxesTotal;
    const totalToPaySource = principalSource + totalFeesSource;

    setBreakdown({
      principalSource,
      grossReceive,
      inboundFee: inboundPctFee, // Mapping 'inboundFee' to just the % part for state, but we need separate display
      liquidityFee,
      gatewayFee,
      outboundFee,
      platformFee,
      appliedTaxes,
      totalFeesSource,
      totalToPaySource,
      // @ts-ignore - Augmenting state for display without breaking interface yet (or we can just use vars in render if we calculate there, but better to put in state)
      // Actually, we'll just store them in the standard state if we update the type, but for now let's rely on consistent calculation or add custom fields.
      // Let's add them to the state object to be safe.
      cardFixedFee
    } as any);

  }, [effectiveSwapIntent, router.query, selectedMethodId, effectiveBeneficiary, qTo, paymentMethods, holidayModeCountry, useNewMethod, paymentData]);


  // Handlers
  const handleAddNewMethod = () => {
    setAddingMethod(true);
    setTimeout(() => {
      const id = `new_${Date.now()}`;
      const newMethod: PaymentMethod = newMethodType === 'card'
        ? { id, type: 'CARD', label: `${newForm.cardType === 'credit' ? 'Credit' : 'Debit'} Card`, last4: newForm.cardNumber.slice(-4) || '0000', expiry: '12/28', cardType: newForm.cardType as CardType }
        : { id, type: 'RTP', label: newForm.holderName || 'Linked Bank Account' };
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
      const name = s.firstName || s.email?.split('@')[0] || 'User';
      const brandedId = `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const dynamicSourceCurrency = String(effectiveSwapIntent?.source_currency || qFrom || 'USD').toUpperCase();

      const type = effectiveSwapIntent?.type || 'MAKER';
      let res;

      if (type === 'TAKER') {
        const offerId = effectiveSwapIntent?.counterpartyOfferId;
        res = await fetch(`/api/offers/${offerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'MATCHED',
            adyen_stored_payment_id: (useNewMethod && paymentData) ? paymentData.token : "mock_adyen_token_taker_999",
            destination_id: effectiveBeneficiary?.id // Ensure Taker beneficiary is passed
          })
        });
      } else {
        const payload = {
          amount: breakdown.totalToPaySource,
          currencyFrom: dynamicSourceCurrency,
          currencyTo: swapIntent?.target_currency || qTo,
          beneficiaryId: effectiveBeneficiary?.id,
          provider: swapIntent?.provider,
          payoutMethod: useNewMethod ? (paymentData?.methodId || 'card') : (paymentMethods.find(m => m.id === selectedMethodId)?.type || 'RTP'),
          payOutRail: payOutRail
        };

        res = await fetch('/api/swaps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 403 && err.error?.code === 'KYC_LIMIT_EXCEEDED') {
          alert(`⚠️ Limit Exceeded!\n\nYou have reached your Tier limit of ${dynamicSourceCurrency} ${err.error.metadata.limit}.\nCurrent Volume: ${dynamicSourceCurrency} ${err.error.metadata.current}\n\nPlease Upgrade to Tier 2 for Unlimited Swaps.`);
          return;
        }
        throw new Error(err.error?.message || 'Swap failed');
      }

      const sessionData = JSON.parse(localStorage.getItem('trueque_session') || '{}');
      sessionData.txCount = (sessionData.txCount || 0) + 1;
      localStorage.setItem('trueque_session', JSON.stringify(sessionData));

      router.push({
        pathname: '/secure-swap',
        query: {
          transactionId: brandedId,
          amountTotal: breakdown.totalToPaySource.toFixed(2),
          amountPrincipal: breakdown.principalSource.toFixed(2),
          amountFees: breakdown.totalFeesSource.toFixed(2),
          currency: dynamicSourceCurrency,
          symmetriId: brandedId,
          amountReceive: breakdown.grossReceive.toFixed(2),
          target_currency: swapIntent?.target_currency || qTo,
          beneficiaryName: effectiveBeneficiary?.first_name ? (effectiveBeneficiary.first_name + ' ' + (effectiveBeneficiary.last_name || '')) : (effectiveBeneficiary?.name || 'Recipient'),
          methodType: paymentMethods.find(m => m.id === selectedMethodId)?.type || 'RTP',
          init: 'true'
        }
      });
    } catch (e: any) {
      console.error(e);
      if (e.message !== 'Swap failed') { // Already handled alert
        // checks if we didn't already alert
      } else {
        alert('Transaction failed. Please try again.');
      }
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
      const dynamicSourceCurrency = String(effectiveSwapIntent?.source_currency || qFrom || 'USD').toUpperCase();
      const guard = validateSwapLimit ? validateSwapLimit(breakdown.totalToPaySource, dynamicSourceCurrency) : { allowed: true };
      if (!guard.allowed) {
        alert(guard.reason || "Transaction limit exceeded.");
        return;
      }
    }

    // 2. MFA CHECK (Flow A vs B Logic)
    // Flow A: Low Value (< 200 EUR) -> Skip Second Factor (Frictionless) - DISABLED FOR SECURITY
    // Flow B: High Value (>= 200 EUR) -> Force Identity Verification - NOW UNIVERSAL
    
    // Check if MFA is disabled for test accounts
    if (s.mfa_enabled === false) {
      console.log('Skipping MFA (mfa_enabled is false in session)');
      processSwap();
    } else {
      setShowMFA(true);
      fetch('/api/auth/resend-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: s.email }),
      }).catch(console.error);
    }
  };

  const handleVerifyMFA = async () => {
    const fullCode = mfaCode.join('');
    try {
      const s = JSON.parse(localStorage.getItem('trueque_session') || '{}');
      const res = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode, email: s.email }),
      });
      const data = await res.json();
      if (data.ok && data.verified) {
        setShowMFA(false);
        processSwap();
      } else {
        setMfaError('Invalid code. Please check and try again.');
      }
    } catch {
      setMfaError('Verification failed. Please try again.');
    }
  };

  // Render Helpers
  const renderMethodOption = (method: PaymentMethod) => {
    if (method.type === 'RTP') return <option key={method.id} value={method.id}>Bank Transfer (RTP) - Best Value</option>;
    return <option key={method.id} value={method.id} disabled={method.isExpired}>{method.label} {method.isExpired ? '(Expired)' : ''}</option>;
  };

  // Styles

  // Styles
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px', color: '#57606f' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#fff', fontSize: '14px' };
  
  const fromCurr = String(effectiveSwapIntent?.source_currency || qFrom || 'USD').toUpperCase();
  const targetCurr = String(effectiveSwapIntent?.target_currency || qTo || 'ARS').toUpperCase();

  const pct = (val: number) => breakdown.principalSource > 0 ? (val / breakdown.principalSource * 100).toFixed(2) + '%' : '0.00%';

  const renderExchangeRate = (rateFromTo: number) => {
    if (fromCurr === 'USD') {
      return `1 USD = ${rateFromTo.toFixed(4)} ${targetCurr}`;
    } else if (targetCurr === 'USD') {
      return `1 USD = ${(1 / rateFromTo).toFixed(4)} ${fromCurr}`;
    }
    return `1 ${fromCurr} = ${rateFromTo.toFixed(4)} ${targetCurr}`;
  };

  const agreedRate = breakdown.principalSource > 0 ? breakdown.grossReceive / breakdown.principalSource : 0;
  const effectiveRate = breakdown.totalToPaySource > 0 ? breakdown.grossReceive / breakdown.totalToPaySource : 0;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Wait for router to be ready and mounted to avoid hydration mismatch (Server vs Client)
  if (!mounted || !router.isReady) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: brandConfig.theme.fontFamily }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(450px, 1.2fr) 1fr', gap: '40px', backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {/* LEFT: PAYMENT */}
          <div>
            <h2 style={{ fontSize: '22px', color: '#2c3e50', marginBottom: '20px' }}>Select Funding Method</h2>
            
            <PaymentMethodForm 
               gateways={[
                 { id: 'rtp', label: 'Instant Bank (RTP)', pct: 0, fixed: 0.50 },
                 { id: 'debit', label: 'Debit Card', pct: CARD_DEBIT_INBOUND_PCT, fixed: CARD_FIXED_FEE },
                 { id: 'credit', label: 'Credit Card', pct: CARD_CREDIT_INBOUND_PCT, fixed: CARD_FIXED_FEE },
                 { id: 'zelle', label: 'Zelle', pct: 0, fixed: 0 }
               ]}
               selectedMethodId={useNewMethod ? (paymentData?.methodId || null) : null}
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

          {/* RIGHT: BREAKDOWN */}
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

            {/* FOOTER ACTIONS - EXACT HARMONY WITH BENEFICIARY.TSX */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
              <button
                onClick={() => {
                  router.push({
                    pathname: '/beneficiary-selection',
                    query: router.query
                  });
                }}
                style={{
                  flex: 1, padding: '14px', borderRadius: '10px',
                  border: '2px solid #e1e8ed', backgroundColor: 'transparent',
                  color: '#7f8c8d', fontWeight: 'bold', cursor: 'pointer',
                  transition: 'all 0.2s', fontSize: '16px'
                }}
              >
                Back
              </button>
              {effectiveBeneficiary ? (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '10px',
                    backgroundColor: brandConfig.theme.actionColor,
                    color: 'white', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', border: 'none', fontSize: '16px'
                  }}
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/beneficiary-selection?rail=${payOutRail}`)}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '10px',
                    backgroundColor: brandConfig.theme.actionColor,
                    color: 'white', fontWeight: 'bold', cursor: 'pointer',
                    transition: 'all 0.2s', border: 'none', fontSize: '16px'
                  }}
                >
                  Proceed to Beneficiary →
                </button>
              )}
            </div>

            {/* Cancel Transaction Link */}
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button
                onClick={() => setShowCancelLogic(true)}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  border: '2px solid #e1e8ed',
                  borderRadius: '10px',
                  color: '#7f8c8d',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
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
                    Code sent. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => {
                      const s = JSON.parse(localStorage.getItem('trueque_session') || '{}');
                      fetch('/api/auth/resend-mfa', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: s.email }),
                      }).catch(console.error);
                      alert('A new code has been generated in your terminal!');
                    }}>Resend</span>
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