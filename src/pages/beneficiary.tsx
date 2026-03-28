import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useSwap } from '../context/SwapContext';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuth } from '../context/AuthContext';

// Types
type AccountType = 'checking' | 'savings';
type RelationshipType = 'self' | 'family' | 'friend' | 'business';

// Validation RegEx patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CBU: /^\d{22}$/,         // Argentina CBU: 22 digits
  CUIT: /^\d{11}$/,        // Argentina CUIT: 11 digits
  CLABE: /^\d{18}$/,       // Mexico CLABE: 18 digits 
  IBAN: /^[A-Z]{2}\d{2}[A-Z\d]{4,30}$/, // Basic IBAN check
  BIC: /^[A-Z]{6}[A-Z0-9]{1,3}$/, // SWIFT/BIC
  ABA: /^\d{9}$/,          // USA Routing
  CCI: /^\d{20}$/,         // Peru CCI
  VE_BANK: /^\d{20}$/,     // Venezuela 20-digit account
  CEDULA: /^[VEGJPveijp]-?\d{6,9}$/, // generic LatAm ID format (adjust as needed)
};

const VE_BANKS = [
  { id: '0102', name: '0102 - Venezuela' },
  { id: '0105', name: '0105 - Mercantil' },
  { id: '0108', name: '0108 - Provincial' },
  { id: '0114', name: '0114 - Bancaribe' },
  { id: '0128', name: '0128 - BNC' },
  { id: '0134', name: '0134 - Banesco' },
  { id: '0151', name: '0151 - BFC' },
  { id: '0163', name: '0163 - Tesoro' },
  { id: '0172', name: '0172 - Bancamiga' },
  { id: '0175', name: '0175 - Bicentenario' },
];

// UI Components
const InputGroup = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e', fontSize: '14px' }}>
      {label}
    </label>
    {children}
    {error && <div style={{ color: '#e74c3c', fontSize: '13px', marginTop: '5px' }}>{error}</div>}
  </div>
);

export default function BeneficiaryPage() {
  const { user } = useAuth(); // DIRECT SOURCE OF TRUTH
  useRequireAuth(); // Auth Guard
  const router = useRouter();
  const { swapIntent, beneficiary: contextForm, setBeneficiary, savedBeneficiaries, setEditingIndex, editingIndex, saveCurrentBeneficiary } = useSwap();

  // 1. Query Params (Fallback)
  const { amountIntent } = router.query;

  // 2. State for Wizard Flow
  const [viewMode, setViewMode] = useState<'selection' | 'form'>('form'); // Default to Form
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Personal, Step 2: Banking
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [targetBeneficiaryId, setTargetBeneficiaryId] = useState<string | null>(null); // For PUT updates

  // Phone State (Harmonized with Signup)
  const [phoneCode, setPhoneCode] = useState('+54'); // Default to AR/Source
  const [phoneNumber, setPhoneNumber] = useState('');

  // Symmetri 1.0: Payment Method Logic
  type PayoutMethod = 'bank' | 'card' | 'wallet' | 'pago_movil';
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('bank');

  // 3. Sandbox Logic - DISABLED here to allow flow to proceed to Review
  // We will enforce the limit at the "Confirm" step in ReviewPage.
  /*
  useEffect(() => {
    if (!user) return;
    const rawUser = user as any;
    const kyc = (rawUser.kycStatus || rawUser.kyc_status || 'PENDING').toUpperCase();

    if (kyc === 'PENDING' && router.isReady) {
       // ... (Logic moved/delegated to Review)
    }
  }, [user, amountIntent, swapIntent, router.isReady, router]);
  */

  // Hydrate Phone State from Context on Mount
  useEffect(() => {
    if (contextForm.personal.phone && !phoneNumber) {
      // Simple heuristic split if saved as "+54 9 11..."
      const parts = contextForm.personal.phone.split(' ');
      if (parts.length >= 2) {
        setPhoneCode(parts[0]);
        setPhoneNumber(parts.slice(1).join(''));
      } else {
        setPhoneNumber(contextForm.personal.phone);
      }
    }
  }, [contextForm.personal.phone]);

  // NEW: Hydrate from Query Param (Flow B: Selection -> Verification)
  useEffect(() => {
    if (router.isReady && router.query.beneficiaryId && savedBeneficiaries.length > 0) {
      // Find by ID
      const bId = router.query.beneficiaryId as string;
      const index = savedBeneficiaries.findIndex((b: any) => b.id === bId);
      if (index >= 0) {
        setBeneficiary(savedBeneficiaries[index]);
        setEditingIndex(index);
      }
    }
  }, [router.isReady, router.query.beneficiaryId, savedBeneficiaries]);

  // 4. User & Country Context
  const getDestinationCountry = () => {
    const to = (swapIntent?.currencyTo || router.query.to || 'ARS').toString().toUpperCase();
    if (to === 'ARS') return 'AR';
    if (to === 'EUR') return 'EU';
    if (to === 'MXN') return 'MX';
    if (to === 'BRL') return 'BR';
    if (to === 'USD') return 'US';
    if (to === 'VES') return 'VE';
    if (to === 'DOP') return 'DO';
    if (to === 'PEN') return 'PE';
    if (to === 'COP') return 'CO';
    return 'US'; // Default
  };
  const destCountry = getDestinationCountry();
  const isVoucher = swapIntent?.offerType === 'retail_voucher' || swapIntent?.offerType === 'merchant_voucher';

  // 6. Fetch Corridor Config
  const [corridorOptions, setCorridorOptions] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/config/corridors')
      .then(res => res.json())
      .then(data => {
        if (destCountry && data[destCountry]) {
          const fees = data[destCountry].outbound_rails;
          // Guard against missing fees config (prevents crash)
          if (fees) {
            const opts = Object.keys(fees).map(key => ({
              id: key,
              label: fees[key].label || fees[key].display_name || key.replace('_', ' ').toUpperCase()
            }));
            setCorridorOptions(opts);
          } else {
            console.warn(`[Beneficiary] No outbound_rails found for ${destCountry}`);
            setCorridorOptions([]);
          }
        }
      })
      .catch(err => console.error("Failed to load corridor options", err));
  }, [destCountry]);

  // Fallback if config fails
  const displayOptions = corridorOptions.length > 0
    ? corridorOptions
    : [
      { id: 'bank_rtp', label: 'Bank (RTP)' },
      { id: 'card_push', label: 'Debit Card' },
      { id: 'wallet', label: 'Wallet' }
    ];

  // Initialize View Mode logic
  useEffect(() => {
    // If explicit ID in URL, we are editing -> Form
    if (router.query.beneficiaryId) {
      setViewMode('form');
      return;
    }

    // Otherwise, if we have saved beneficiaries, prefer selection
    // Ignoring contextForm.personal.firstName allows us to show the list even if a draft exists
    if (savedBeneficiaries.length > 0) {
      setViewMode('selection');
    }
  }, [savedBeneficiaries.length, router.query.beneficiaryId]); // Explicit dependencies

  // Handlers
  const handlePersonalChange = (field: keyof typeof contextForm.personal, value: string) => {
    setBeneficiary(prev => ({
      ...prev,
      personal: { ...prev.personal, [field]: value }
    }));
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  // Symmetri 1.0: Clear hidden fields to prevent ghost data
  const clearHiddenFields = (prevBanking: typeof contextForm.banking, selectedMethod: PayoutMethod) => {
    const banking = { ...prevBanking };
    // Always keep bankName and deliveryMethod
    const toKeep = ['bankName', 'deliveryMethod'];

    // Logic to determine which fields to clear based on method and country
    // This is called before updating the method
    const allFields = [
      'cbu', 'alias', 'accountType', 'cardNumber', 'cardExpiry', 'cvv',
      'walletProvider', 'walletId', 'iban', 'accountNumber', 'clabe',
      'routingNumber', 'pixKey', 'taxId', 'mobileNumber', 'idNumber', 'cci', 'beneficiaryName'
    ];

    allFields.forEach(f => {
      // @ts-ignore
      banking[f] = '';
    });

    return banking;
  };

  const handleBankingChange = (field: keyof typeof contextForm.banking, value: string) => {
    setBeneficiary(prev => {
      let newBanking = { ...prev.banking, [field]: value };

      // If switching payoutMethod (standardized), clear other fields
      if (field === 'deliveryMethod') {
        // Map standardized UI choice back to rail IDs if needed, 
        // but here we use the rails directly or adapt them.
        // For simplicity, we'll let the UI handle the mapping to rail IDs.
      }

      // AUTO-HYDRATION: If switching method, check if we have data in saved_methods
      if (field === 'deliveryMethod' && prev.saved_methods && prev.saved_methods[value]) {
        // Map identifiers back to banking fields (Heuristic match)
        const saved = prev.saved_methods[value];
        const identifiers = saved.identifiers || saved;

        Object.assign(newBanking, {
          bankName: identifiers.bank_name || newBanking.bankName,
          accountNumber: identifiers.account_number || newBanking.accountNumber,
          cbu: identifiers.cbu || newBanking.cbu,
          alias: identifiers.alias || newBanking.alias,
          iban: identifiers.iban || newBanking.iban,
          clabe: identifiers.clabe || newBanking.clabe,
          cardNumber: identifiers.card_number || newBanking.cardNumber,
          walletProvider: identifiers.wallet_provider || newBanking.walletProvider,
          walletId: identifiers.wallet_id || newBanking.walletId
        });
      }

      return { ...prev, banking: newBanking };
    });

    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  // Sync Phone on Change
  useEffect(() => {
    const combined = `${phoneCode} ${phoneNumber}`;
    if (combined !== contextForm.personal.phone && phoneNumber) {
      setBeneficiary(prev => ({
        ...prev,
        personal: { ...prev.personal, phone: combined }
      }));
    }
  }, [phoneCode, phoneNumber]);

  // MARIA'S DATA FIX: Aggressive Persistence for "Active Draft"
  useEffect(() => {
    // Wherever contextForm changes (user types), save to localStorage
    if (contextForm.personal.firstName || contextForm.personal.lastName) {
      // ANCHOR MARIA: Save Full Object using requested key
      localStorage.setItem('selected_beneficiary', JSON.stringify(contextForm));
    }
  }, [contextForm]);

  // Load from Persistence on Mount (if Context is Empty)
  useEffect(() => {
    if (!contextForm.personal.firstName && !contextForm.personal.lastName) {
      const saved = localStorage.getItem('selected_beneficiary');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setBeneficiary(parsed);
          // Also hydrate local phone state
          const phone = parsed.personal?.phone || '';
          if (phone) {
            const parts = phone.split(' ');
            if (parts.length >= 2) {
              setPhoneCode(parts[0]);
              setPhoneNumber(parts.slice(1).join(''));
            } else {
              setPhoneNumber(phone);
            }
          }
        } catch (e) {
          console.error("Failed to hydrate active beneficiary", e);
        }
      }
    }
  }, []);


  // Validation Logic
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!contextForm.personal.firstName) newErrors.firstName = 'First Name is required';
    if (!contextForm.personal.lastName) newErrors.lastName = 'Last Name is required';
    if (!contextForm.personal.email || !PATTERNS.EMAIL.test(contextForm.personal.email)) newErrors.email = 'Valid email is required';
    if (!phoneNumber || phoneNumber.length < 5) newErrors.phone = 'Phone number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Luhn Check for Card Number
  const luhnCheck = (num: string) => {
    let arr = (num + '').split('').reverse().map(x => parseInt(x));
    let lastDigit = arr.shift();
    let sum = arr.reduce((acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2 > 9) ? val * 2 - 9 : val * 2)), 0);
    return (sum + lastDigit!) % 10 === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    const {
      deliveryMethod, bankName, cbu, iban, clabe, accountNumber,
      cardNumber, cardExpiry, routingNumber, pixKey, taxId,
      mobileNumber, idNumber, cci, beneficiaryName
    } = contextForm.banking;

    if (isVoucher) return true;

    // 💳 CARD VALIDATION
    if (deliveryMethod === 'card_push') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (!cleanCard || cleanCard.length < 15) newErrors.cardNumber = 'Valid Card Number required';
      else if (!luhnCheck(cleanCard)) newErrors.cardNumber = 'Invalid Card Number (Luhn check failed)';

      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) newErrors.cardExpiry = 'Expiry MM/YY required';
      if (!beneficiaryName) newErrors.beneficiaryName = 'Cardholder name is required';
    }

    // 🏦 BANK DEPOSIT VALIDATION
    if (deliveryMethod === 'bank_rtp') {
      if (destCountry === 'US') {
        if (!PATTERNS.ABA.test(routingNumber || '')) newErrors.routingNumber = 'Routing Number must be 9 digits';
        if (!accountNumber) newErrors.accountNumber = 'Account Number required';
      } else if (destCountry === 'AR') {
        const cleanCBU = cbu.replace(/\D/g, '');
        if (!PATTERNS.CBU.test(cleanCBU)) newErrors.cbu = 'CBU must be exactly 22 digits';
      } else if (destCountry === 'EU') {
        if (!iban || !PATTERNS.IBAN.test(iban.replace(/\s/g, '').toUpperCase())) newErrors.iban = 'Invalid IBAN format';
        if (!beneficiaryName) newErrors.beneficiaryName = 'Beneficiary name required';
      } else if (destCountry === 'MX') {
        if (!clabe || !PATTERNS.CLABE.test(clabe.replace(/\D/g, ''))) newErrors.clabe = 'CLABE must be 18 digits';
        if (!beneficiaryName) newErrors.beneficiaryName = 'Beneficiary name required';
      } else if (destCountry === 'BR') {
        if (!pixKey) newErrors.pixKey = 'PIX Key required';
        if (!taxId) newErrors.taxId = 'Tax ID (CPF) required';
      } else if (destCountry === 'CO') {
        if (!mobileNumber) newErrors.mobileNumber = 'Mobile number required';
        if (!idNumber) newErrors.idNumber = 'ID Number (Cédula) required';
      } else if (destCountry === 'VE') {
        if (!bankName) newErrors.bankName = 'Select a bank';
        if (!PATTERNS.VE_BANK.test(accountNumber || '')) newErrors.accountNumber = 'Account must be 20 digits';
        if (!idNumber) newErrors.idNumber = 'ID Number (Cédula) required';
      } else if (destCountry === 'DO') {
        if (!accountNumber) newErrors.accountNumber = 'Account number required';
        if (!idNumber) newErrors.idNumber = 'Cédula/RNC required';
      } else if (destCountry === 'PE') {
        if (!PATTERNS.CCI.test(cci || '')) newErrors.cci = 'CCI must be 20 digits';
        if (!beneficiaryName) newErrors.beneficiaryName = 'Beneficiary name required';
      } else {
        if (!accountNumber) newErrors.accountNumber = 'Account Number required';
      }
    }

    // ⚡ PAGO MOVIL VALIDATION
    if (deliveryMethod === 'pago_movil') {
      if (!bankName) newErrors.bankName = 'Select a bank';
      if (!mobileNumber || mobileNumber.length < 10) newErrors.mobileNumber = 'Valid mobile number required';
      if (!idNumber) newErrors.idNumber = 'ID Number (Cédula) required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Unified Submit Handler
  const handleUnifiedSubmit = () => {
    // Run both validations
    const v1 = validateStep1();
    const v2 = validateStep2();

    if (v1 && v2) {
      handleSubmit();
    } else {
      // Scroll to top or first error?
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { personal, banking } = contextForm;

      // Symmetri 1.0: Map identifiers based on country & method
      const identifiers: Record<string, any> = {
        email: personal.email,
        phone_number: personal.phone,
        bank_name: banking.bankName,
        account_type: banking.accountType,
        country: destCountry
      };

      if (banking.deliveryMethod === 'card_push') {
        identifiers.card_number = banking.cardNumber;
        identifiers.card_expiry = banking.cardExpiry;
        identifiers.beneficiary_name = banking.beneficiaryName;
      } else if (banking.deliveryMethod === 'pago_movil') {
        identifiers.mobile_number = banking.mobileNumber;
        identifiers.id_number = banking.idNumber;
      } else {
        // Bank Transfer Logic
        if (destCountry === 'US') {
          identifiers.routing_number = banking.routingNumber;
          identifiers.account_number = banking.accountNumber;
        } else if (destCountry === 'AR') {
          identifiers.cbu = banking.cbu;
          identifiers.alias = banking.alias;
        } else if (destCountry === 'EU') {
          identifiers.iban = banking.iban;
          identifiers.beneficiary_name = banking.beneficiaryName;
        } else if (destCountry === 'MX') {
          identifiers.clabe = banking.clabe;
          identifiers.beneficiary_name = banking.beneficiaryName;
        } else if (destCountry === 'BR') {
          identifiers.pix_key = banking.pixKey;
          identifiers.tax_id = banking.taxId;
        } else if (destCountry === 'CO') {
          identifiers.mobile_number = banking.mobileNumber;
          identifiers.id_number = banking.idNumber;
        } else if (destCountry === 'VE') {
          identifiers.account_number = banking.accountNumber;
          identifiers.id_number = banking.idNumber;
        } else if (destCountry === 'DO') {
          identifiers.account_number = banking.accountNumber;
          identifiers.id_number = banking.idNumber;
        } else if (destCountry === 'PE') {
          identifiers.cci = banking.cci;
          identifiers.beneficiary_name = banking.beneficiaryName;
        } else {
          identifiers.account_number = banking.accountNumber;
        }
      }

      const payload = {
        name: `${personal.firstName} ${personal.lastName}`.trim(),
        method: banking.deliveryMethod,
        identifiers,
        country: destCountry,
        id: targetBeneficiaryId
      };

      // Determine Method: POST (Create) or PUT (Update/Add Method)
      const apiMethod = targetBeneficiaryId ? 'PUT' : 'POST';

      const res = await fetch('/api/beneficiaries', {
        method: apiMethod,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensure session cookie is passed
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to save beneficiary');
      }

      // CAPTURE ID & HANDOVER TO REVIEW
      const savedData = await res.json();

      // Merge ID and SAVED_METHODS into current state
      // CRITICAL: We must merge 'saved_methods' from backend to ensure Switcher works locally immediatley
      const finale = {
        ...contextForm,
        id: savedData.id,
        saved_methods: savedData.saved_methods
      };

      // Update Context & Persistence
      setBeneficiary(finale);
      localStorage.setItem('selected_beneficiary', JSON.stringify(finale));

      // UPDATE LIST CACHE IMMEDIATELY
      // This ensures if we go back to "Selection" mode, the new rail is visible
      saveCurrentBeneficiary();

      // Success -> Step 5 (Review)
      router.push('/review');
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message || 'Error saving beneficiary. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // UI Components
  const inputStyle = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #bdc3c7',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
  };

  // 5. User Name Loading
  const [userName, setUserName] = useState('');
  useEffect(() => {
    const s = localStorage.getItem('trueque_session');
    if (s) {
      try {
        const sess = JSON.parse(s);
        setUserName(sess.firstName || 'User');
      } catch { }
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fa', fontFamily: 'sans-serif' }}>
      <Header />

      <main style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px' }}>

        {/* SELECTION SCREEN */}
        {viewMode === 'selection' && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            {/* Navigation Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <button
                onClick={() => {
                  router.push({
                    pathname: '/offers',
                    query: {
                      amountIntent: swapIntent?.amount || router.query.amountIntent,
                      rate: swapIntent?.rate || router.query.rate,
                      from: swapIntent?.currencyFrom || router.query.from,
                      to: swapIntent?.currencyTo || router.query.to
                    }
                  });
                }}
                style={{
                  background: 'none', border: 'none', color: '#7f8c8d', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                ← Back to Offers
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem('trueque_swap_state');
                  router.push('/dashboard');
                }}
                style={{
                  background: 'none', border: 'none', color: '#e74c3c', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cancel ✕
              </button>
            </div>

            <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50', textAlign: 'center' }}>Select Beneficiary</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {(() => {
                // GROUPING LOGIC
                // Group by "First Last" -> { personal: ..., ids: { 'bank_rtp': ID, 'wallet': ID } }
                const remoteList = savedBeneficiaries || [];
                // DEBUG: Log the list to see what we are grouping
                console.log("[Beneficiary] Grouping List:", remoteList);

                const groups: Record<string, any> = {};

                remoteList.forEach((b: any) => {
                  const nameKey = `${b.personal.firstName} ${b.personal.lastName}`.trim();
                  if (!groups[nameKey]) {
                    groups[nameKey] = {
                      personal: b.personal,
                      methods: {}, // map method -> { id, detail, fullObj }
                      primaryId: b.id // Default ID for updates
                    };
                  }

                  // Add main method of this row
                  const mainMethod = b.banking.deliveryMethod || 'bank_rtp';
                  if (!groups[nameKey].methods[mainMethod]) {
                    groups[nameKey].methods[mainMethod] = { id: b.id, data: b.banking, full: b };
                  }

                  // Add nested/saved_methods if present (from PUT updates)
                  if (b.saved_methods) {
                    Object.keys(b.saved_methods).forEach(mKey => {
                      // We don't have full banking struct, but we have identifiers. 
                      // We'll treat the main row ID as the carrier.
                      if (!groups[nameKey].methods[mKey]) {
                        groups[nameKey].methods[mKey] = {
                          id: b.id,
                          data: { ...b.banking, ...b.saved_methods[mKey], deliveryMethod: mKey }, // heuristic merge
                          isNested: true,
                          full: b
                        };
                      }
                    });
                  }
                });

                return Object.entries(groups).map(([name, group], i) => (
                  <div key={i} style={{
                    padding: '20px', border: '1px solid #e1e8ed', borderRadius: '12px',
                    backgroundColor: '#f8f9fa', marginBottom: '10px'
                  }}>
                    {/* Header: Name + Phone */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '20px', background: '#e1e8ed', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '16px' }}>{name}</div>
                          <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{group.personal.phone}</div>
                        </div>
                      </div>
                    </div>

                    {/* Rail Switcher */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {displayOptions.map(opt => {
                        const rail = opt.id;

                        // Filter Wallet if strict logic needed, but Config should be truth.
                        // if (method === 'wallet' && !['AR', 'EU'].includes(destCountry)) return null;

                        const existing = group.methods[rail];

                        return (
                          <button
                            key={rail}
                            onClick={() => {
                              if (existing) {
                                // SELECT EXISTING
                                setBeneficiary(existing.full); // Populate Context

                                // If nested, we might need to patch the banking details in context
                                if (existing.isNested) {
                                  setBeneficiary((prev: any) => ({
                                    ...prev,
                                    banking: { ...prev.banking, ...existing.data }
                                  }));
                                }

                                // Hydrate Phone Local State
                                const phone = group.personal.phone || '';
                                const parts = phone.split(' ');
                                if (parts.length >= 2) {
                                  setPhoneCode(parts[0]);
                                  setPhoneNumber(parts.slice(1).join(''));
                                } else {
                                  setPhoneNumber(phone);
                                }

                                // Direct Proceed Logic (Review)? Or Edit?
                                const finalObj = existing.isNested
                                  ? { ...existing.full, banking: { ...existing.full.banking, ...existing.data } }
                                  : existing.full;

                                setBeneficiary(finalObj);
                                localStorage.setItem('selected_beneficiary', JSON.stringify(finalObj));
                                router.push('/review');

                              } else {
                                // ADD NEW RAIL (IN-PLACE)
                                // Pre-fill Personal from Group & Preserve existing Banking if switching
                                const existingBanking = group.full?.banking || {};
                                setBeneficiary({
                                  ...group.full || { personal: group.personal, banking: {} },
                                  personal: group.personal,
                                  banking: {
                                    ...existingBanking,
                                    deliveryMethod: rail,
                                    // Only reset fields if not already present in the "carrier" row
                                    bankName: existingBanking.bankName || '',
                                    cbu: existingBanking.cbu || '',
                                    iban: existingBanking.iban || '',
                                    clabe: existingBanking.clabe || '',
                                    accountNumber: existingBanking.accountNumber || '',
                                    accountType: existingBanking.accountType || 'checking',
                                    cardNumber: existingBanking.cardNumber || '',
                                    cardExpiry: existingBanking.cardExpiry || '',
                                    walletProvider: existingBanking.walletProvider || '',
                                    walletId: existingBanking.walletId || ''
                                  }
                                });

                                // Set Update Triggers
                                setTargetBeneficiaryId(group.primaryId); // Tells handleSubmit to PUT
                                setEditingIndex(999); // Flag as "Editing"

                                // Phone Hydration
                                const phone = group.personal.phone || '';
                                const parts = phone.split(' ');
                                if (parts.length >= 2) {
                                  setPhoneCode(parts[0]);
                                  setPhoneNumber(parts.slice(1).join(''));
                                }

                                // Go to Form -> Step 2 (Banking) directly?
                                setStep(2);
                                setViewMode('form');
                              }
                            }}
                            style={{
                              flex: 1, padding: '8px 12px', borderRadius: '8px',
                              border: existing ? '1px solid #4A90E2' : '1px dashed #bdc3c7',
                              backgroundColor: existing ? '#eef6fc' : 'white',
                              color: existing ? '#4A90E2' : '#95a5a6',
                              fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                          >
                            {existing && <span>✓</span>} {opt.label}
                          </button>
                        );
                      })}
                    </div>

                  </div>
                ));
              })()}

              <button onClick={() => {
                // Clear context for New Person
                setBeneficiary({
                  personal: { firstName: '', lastName: '', email: '', phone: '' },
                  banking: {
                    deliveryMethod: 'bank_rtp',
                    bankName: '', cbu: '', alias: '', // Added missing alias
                    iban: '', clabe: '', accountNumber: '',
                    accountType: 'checking',
                    cardNumber: '', cardExpiry: '',
                    walletProvider: '', walletId: ''
                  }
                });
                setEditingIndex(-1);
                setTargetBeneficiaryId(null);
                setPhoneNumber('');
                setStep(1);
                setViewMode('form');
              }} style={{
                padding: '15px', border: '2px dashed #bdc3c7', borderRadius: '10px',
                cursor: 'pointer', textAlign: 'center', color: '#7f8c8d', fontWeight: 'bold',
                marginTop: '10px'
              }}>
                + Add New Beneficiary
              </button>
            </div>
          </div>
        )}

        {/* FORM SCREEN */}
        {viewMode === 'form' && (
          <>
            {/* Navigation Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <button
                onClick={() => {
                  if (savedBeneficiaries && savedBeneficiaries.length > 0) {
                    setViewMode('selection');
                    // Reset editing index if strictly "adding new" (999) to cancel draft
                    if (editingIndex === 999) {
                      setEditingIndex(-1);
                      setBeneficiary({
                        personal: { firstName: '', lastName: '', email: '', phone: '' },
                        banking: {
                          deliveryMethod: 'bank_rtp',
                          bankName: '', cbu: '', alias: '', iban: '', clabe: '', accountNumber: '',
                          accountType: 'checking', cardNumber: '', cardExpiry: '', walletProvider: '', walletId: ''
                        }
                      });
                    }
                  } else {
                    router.push({
                      pathname: '/offers',
                      query: {
                        amountIntent: swapIntent?.amount || router.query.amountIntent,
                        rate: swapIntent?.rate || router.query.rate,
                        from: swapIntent?.currencyFrom || router.query.from,
                        to: swapIntent?.currencyTo || router.query.to
                      }
                    });
                  }
                }}
                style={{
                  background: 'none', border: 'none', color: '#7f8c8d', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                ← {savedBeneficiaries && savedBeneficiaries.length > 0 ? 'Back to List' : 'Back to Offers'}
              </button>

              <button
                onClick={() => {
                  sessionStorage.removeItem('trueque_swap_state');
                  router.push('/dashboard');
                }}
                style={{
                  background: 'none', border: 'none', color: '#e74c3c', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer'
                }}
              >
                Cancel ✕
              </button>
            </div>

            {/* Progress Stepper REMOVED - Single View */}

            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '40px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              {userName && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, color: '#4A90E2', fontSize: '18px' }}>
                    Hello, {userName} 👋
                  </h3>
                  {swapIntent && (
                    <div style={{ fontSize: '14px', color: '#7f8c8d', backgroundColor: '#f8f9fa', padding: '8px 12px', borderRadius: '20px' }}>
                      Swapping <b>{swapIntent.amount} {swapIntent.currencyFrom}</b> for <b>{swapIntent.currencyTo}</b>
                    </div>
                  )}
                </div>
              )}

              {/* SAVED BENEFICIARIES SELECTOR */}
              {savedBeneficiaries && savedBeneficiaries.length > 0 && step === 1 && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #d0e8f8' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#2980b9', fontSize: '14px' }}>
                    ⚡ Quick Fill: Select a Saved Beneficiary
                  </label>
                  <select
                    onChange={(e) => {
                      const idx = parseInt(e.target.value);
                      if (idx >= 0) {
                        setBeneficiary(savedBeneficiaries[idx]);
                        setEditingIndex(idx);
                        // Force update local phone state too
                        const phone = savedBeneficiaries[idx].personal.phone || '';
                        const parts = phone.split(' ');
                        if (parts.length >= 2) {
                          setPhoneCode(parts[0]);
                          setPhoneNumber(parts.slice(1).join(''));
                        } else {
                          setPhoneNumber(phone);
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bdc3c7', fontSize: '14px' }}
                  >
                    <option value="-1">-- Make a Selection --</option>
                    {savedBeneficiaries.map((b, i) => (
                      <option key={i} value={i}>
                        {b.personal.firstName} {b.personal.lastName} - {b.banking.bankName || b.banking.walletProvider || 'Saved'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* LANDSCAPE GRID LAYOUT */}
              <div className="grid lg:grid-cols-2 gap-10">

                {/* --- COLUMN 1: PERSONAL DETAILS --- */}
                <div>
                  <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>
                    1. Beneficiary Details
                  </h2>



                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <InputGroup label="First Name" error={errors.firstName}>
                      <input
                        style={inputStyle}
                        value={contextForm.personal.firstName}
                        onChange={(e) => handlePersonalChange('firstName', e.target.value)}
                        placeholder="e.g. Maria"
                      />
                    </InputGroup>
                    <InputGroup label="Last Name" error={errors.lastName}>
                      <input
                        style={inputStyle}
                        value={contextForm.personal.lastName}
                        onChange={(e) => handlePersonalChange('lastName', e.target.value)}
                        placeholder="e.g. Gonzalez"
                      />
                    </InputGroup>
                  </div>

                  {/* Harmonized Phone Input */}
                  <InputGroup label="Mobile Phone" error={errors.phone}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        style={{ ...inputStyle, width: '100px' }}
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+54">🇦🇷 +54</option>
                        <option value="+52">🇲🇽 +52</option>
                        <option value="+55">🇧🇷 +55</option>
                        <option value="+57">🇨🇴 +57</option>
                        <option value="+34">🇪🇸 +34</option>
                      </select>
                      <input
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Mobile Number"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                  </InputGroup>

                  <InputGroup label="Email" error={errors.email}>
                    <input
                      style={inputStyle}
                      type="email"
                      value={contextForm.personal.email}
                      onChange={(e) => handlePersonalChange('email', e.target.value)}
                      placeholder="maria@example.com"
                    />
                  </InputGroup>
                </div>

                {/* --- COLUMN 2: BANKING DETAILS --- */}
                <div>
                  <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50', borderBottom: '2px solid #f0f2f5', paddingBottom: '10px' }}>
                    2. Banking Information
                  </h2>
                  {/* Step 2 Content Rendered Unconditionally */}
                  {isVoucher ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <h3 style={{ color: '#27ae60' }}>
                        {swapIntent?.offerType === 'merchant_voucher' ? '🏙️ Merchant Voucher Delivery' : '🎟️ Retail Voucher Delivery'}
                      </h3>
                      <p style={{ color: '#7f8c8d' }}>
                        The voucher code will be sent to <strong>{contextForm.personal.phone}</strong> via WhatsApp/SMS.
                      </p>
                      <div style={{ fontSize: '13px', marginTop: '10px', color: '#e67e22' }}>
                        Please ensure the number is correct in Step 1.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Symmetri 1.0: Standardized Method Selector */}
                      <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#34495e', fontSize: '14px' }}>
                          Payment Method
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              const cleared = clearHiddenFields(contextForm.banking, 'bank');
                              setBeneficiary(prev => ({ ...prev, banking: { ...cleared, deliveryMethod: 'bank_rtp' } }));
                            }}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                              borderColor: contextForm.banking.deliveryMethod === 'bank_rtp' ? '#4A90E2' : '#e1e8ed',
                              backgroundColor: contextForm.banking.deliveryMethod === 'bank_rtp' ? '#eef6fc' : 'white',
                              color: contextForm.banking.deliveryMethod === 'bank_rtp' ? '#4A90E2' : '#7f8c8d',
                              fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                            }}>
                            {contextForm.banking.deliveryMethod === 'bank_rtp' && <span>🏦 </span>} Bank Deposit
                          </button>

                          {destCountry === 'VE' && (
                            <button
                              onClick={() => {
                                const cleared = clearHiddenFields(contextForm.banking, 'pago_movil');
                                setBeneficiary(prev => ({ ...prev, banking: { ...cleared, deliveryMethod: 'pago_movil' } }));
                              }}
                              style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                                borderColor: contextForm.banking.deliveryMethod === 'pago_movil' ? '#f39c12' : '#e1e8ed',
                                backgroundColor: contextForm.banking.deliveryMethod === 'pago_movil' ? '#fef5e7' : 'white',
                                color: contextForm.banking.deliveryMethod === 'pago_movil' ? '#f39c12' : '#7f8c8d',
                                fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                              }}>
                              {contextForm.banking.deliveryMethod === 'pago_movil' && <span>⚡ </span>} Pago Móvil
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const cleared = clearHiddenFields(contextForm.banking, 'card');
                              setBeneficiary(prev => ({ ...prev, banking: { ...cleared, deliveryMethod: 'card_push' } }));
                            }}
                            style={{
                              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                              borderColor: contextForm.banking.deliveryMethod === 'card_push' ? '#4A90E2' : '#e1e8ed',
                              backgroundColor: contextForm.banking.deliveryMethod === 'card_push' ? '#eef6fc' : 'white',
                              color: contextForm.banking.deliveryMethod === 'card_push' ? '#4A90E2' : '#7f8c8d',
                              fontWeight: '600', cursor: 'pointer', fontSize: '13px'
                            }}>
                            {contextForm.banking.deliveryMethod === 'card_push' && <span>💳 </span>} Debit Card
                          </button>
                        </div>
                      </div>

                      {/* === Payout-Specific Dynamic Fields === */}

                      {/* 💳 GLOBAL CARD METHOD */}
                      {contextForm.banking.deliveryMethod === 'card_push' && (
                        <>
                          <InputGroup label="Card Number" error={errors.cardNumber}>
                            <input
                              style={inputStyle}
                              value={contextForm.banking.cardNumber}
                              onChange={(e) => handleBankingChange('cardNumber', e.target.value.replace(/\D/g, ''))}
                              maxLength={16}
                              placeholder="0000 0000 0000 0000"
                            />
                          </InputGroup>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <InputGroup label="Expiry (MM/YY)" error={errors.cardExpiry}>
                              <input
                                style={inputStyle}
                                value={contextForm.banking.cardExpiry}
                                onChange={(e) => handleBankingChange('cardExpiry', e.target.value)}
                                maxLength={5}
                                placeholder="MM/YY"
                              />
                            </InputGroup>
                            <InputGroup label="Cardholder Name" error={errors.beneficiaryName}>
                              <input
                                style={inputStyle}
                                value={contextForm.banking.beneficiaryName || ''}
                                onChange={(e) => handleBankingChange('beneficiaryName', e.target.value)}
                                placeholder="FullName"
                              />
                            </InputGroup>
                          </div>
                        </>
                      )}

                      {/* 🏦 BANK DEPOSIT METHOD */}
                      {contextForm.banking.deliveryMethod === 'bank_rtp' && (
                        <>
                          {/* USA */}
                          {destCountry === 'US' && (
                            <>
                              <InputGroup label="Routing Number (ABA)" error={errors.routingNumber}>
                                <input style={inputStyle} value={contextForm.banking.routingNumber || ''} onChange={(e) => handleBankingChange('routingNumber', e.target.value)} maxLength={9} placeholder="9 digits" />
                              </InputGroup>
                              <InputGroup label="Account Number" error={errors.accountNumber}>
                                <input style={inputStyle} value={contextForm.banking.accountNumber || ''} onChange={(e) => handleBankingChange('accountNumber', e.target.value)} placeholder="Account Number" />
                              </InputGroup>
                              <InputGroup label="Account Type">
                                <select style={inputStyle} value={contextForm.banking.accountType} onChange={(e) => handleBankingChange('accountType', e.target.value)}>
                                  <option value="checking">Checking</option>
                                  <option value="savings">Savings</option>
                                </select>
                              </InputGroup>
                            </>
                          )}

                          {/* EUROZONE */}
                          {destCountry === 'EU' && (
                            <>
                              <InputGroup label="IBAN" error={errors.iban}>
                                <input style={inputStyle} value={contextForm.banking.iban || ''} onChange={(e) => handleBankingChange('iban', e.target.value.toUpperCase())} placeholder="ES12..." />
                              </InputGroup>
                              <InputGroup label="Beneficiary Full Name" error={errors.beneficiaryName}>
                                <input style={inputStyle} value={contextForm.banking.beneficiaryName || ''} onChange={(e) => handleBankingChange('beneficiaryName', e.target.value)} placeholder="Full Name" />
                              </InputGroup>
                            </>
                          )}

                          {/* MEXICO */}
                          {destCountry === 'MX' && (
                            <>
                              <InputGroup label="CLABE (18 digits)" error={errors.clabe}>
                                <input style={inputStyle} value={contextForm.banking.clabe || ''} onChange={(e) => handleBankingChange('clabe', e.target.value)} maxLength={18} placeholder="18 digits" />
                              </InputGroup>
                              <InputGroup label="Beneficiary Full Name" error={errors.beneficiaryName}>
                                <input style={inputStyle} value={contextForm.banking.beneficiaryName || ''} onChange={(e) => handleBankingChange('beneficiaryName', e.target.value)} placeholder="Full Name" />
                              </InputGroup>
                            </>
                          )}

                          {/* BRAZIL */}
                          {destCountry === 'BR' && (
                            <>
                              <InputGroup label="PIX Key" error={errors.pixKey}>
                                <input style={inputStyle} value={contextForm.banking.pixKey || ''} onChange={(e) => handleBankingChange('pixKey', e.target.value)} placeholder="CPF, Email, Phone, or EVP" />
                              </InputGroup>
                              <InputGroup label="Tax ID (CPF)" error={errors.taxId}>
                                <input style={inputStyle} value={contextForm.banking.taxId || ''} onChange={(e) => handleBankingChange('taxId', e.target.value)} placeholder="000.000.000-00" />
                              </InputGroup>
                            </>
                          )}

                          {/* COLOMBIA */}
                          {destCountry === 'CO' && (
                            <>
                              <InputGroup label="Mobile Number (Transfiya)" error={errors.mobileNumber}>
                                <input style={inputStyle} value={contextForm.banking.mobileNumber || ''} onChange={(e) => handleBankingChange('mobileNumber', e.target.value)} placeholder="300 000 0000" />
                              </InputGroup>
                              <InputGroup label="ID Number (Cédula)" error={errors.idNumber}>
                                <input style={inputStyle} value={contextForm.banking.idNumber || ''} onChange={(e) => handleBankingChange('idNumber', e.target.value)} placeholder="Cédula Number" />
                              </InputGroup>
                            </>
                          )}

                          {/* VENEZUELA BANK */}
                          {destCountry === 'VE' && (
                            <>
                              <InputGroup label="Cédula (V/E)" error={errors.idNumber}>
                                <input
                                  style={inputStyle}
                                  value={contextForm.banking.idNumber || ''}
                                  onChange={(e) => handleBankingChange('idNumber', e.target.value)}
                                  placeholder="V-12345678"
                                />
                              </InputGroup>
                              <InputGroup label="Account Number (20 Digits)" error={errors.accountNumber}>
                                <input
                                  style={inputStyle}
                                  value={contextForm.banking.accountNumber || ''}
                                  onChange={(e) => handleBankingChange('accountNumber', e.target.value)}
                                  maxLength={20}
                                  placeholder="0102..."
                                />
                              </InputGroup>
                            </>
                          )}

                          {/* DOMINICAN REPUBLIC */}
                          {destCountry === 'DO' && (
                            <>
                              <InputGroup label="Account Number" error={errors.accountNumber}>
                                <input style={inputStyle} value={contextForm.banking.accountNumber || ''} onChange={(e) => handleBankingChange('accountNumber', e.target.value)} placeholder="Account Number" />
                              </InputGroup>
                              <InputGroup label="ID Number (Cédula/RNC)" error={errors.idNumber}>
                                <input style={inputStyle} value={contextForm.banking.idNumber || ''} onChange={(e) => handleBankingChange('idNumber', e.target.value)} placeholder="001-0000000-0" />
                              </InputGroup>
                              <InputGroup label="Account Type">
                                <select style={inputStyle} value={contextForm.banking.accountType} onChange={(e) => handleBankingChange('accountType', e.target.value)}>
                                  <option value="savings">Savings</option>
                                  <option value="checking">Checking</option>
                                </select>
                              </InputGroup>
                            </>
                          )}

                          {/* PERU */}
                          {destCountry === 'PE' && (
                            <>
                              <InputGroup label="CCI (20 Digits)" error={errors.cci}>
                                <input style={inputStyle} value={contextForm.banking.cci || ''} onChange={(e) => handleBankingChange('cci', e.target.value)} maxLength={20} placeholder="Interbank Account Code" />
                              </InputGroup>
                              <InputGroup label="Beneficiary Full Name" error={errors.beneficiaryName}>
                                <input style={inputStyle} value={contextForm.banking.beneficiaryName || ''} onChange={(e) => handleBankingChange('beneficiaryName', e.target.value)} placeholder="Full Name" />
                              </InputGroup>
                            </>
                          )}

                          {/* ARGENTINA (Preserved/Refined) */}
                          {destCountry === 'AR' && (
                            <>
                              <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e', fontSize: '14px' }}>Account Type</label>
                                <div style={{ display: 'flex', gap: '15px', background: '#f8f9fa', padding: '10px', borderRadius: '8px', border: '1px solid #e1e8ed' }}>
                                  <div
                                    onClick={() => handleBankingChange('accountType', 'CBU')}
                                    style={{
                                      flex: 1,
                                      padding: '12px 10px', borderRadius: '8px',
                                      border: (contextForm.banking.accountType !== 'CVU') ? '2px solid #4A90E2' : '1px solid #bdc3c7',
                                      backgroundColor: (contextForm.banking.accountType !== 'CVU') ? '#eef6fc' : 'white',
                                      color: (contextForm.banking.accountType !== 'CVU') ? '#4A90E2' : '#7f8c8d',
                                      cursor: 'pointer', fontWeight: 'bold', textAlign: 'center', transition: 'all 0.2s',
                                      boxShadow: (contextForm.banking.accountType !== 'CVU') ? '0 2px 5px rgba(74, 144, 226, 0.2)' : 'none'
                                    }}>
                                    🏦 Bank (CBU)
                                  </div>
                                  <div
                                    onClick={() => handleBankingChange('accountType', 'CVU')}
                                    style={{
                                      flex: 1,
                                      padding: '12px 10px', borderRadius: '8px',
                                      border: (contextForm.banking.accountType === 'CVU') ? '2px solid #9b59b6' : '1px solid #bdc3c7',
                                      backgroundColor: (contextForm.banking.accountType === 'CVU') ? '#f5eef8' : 'white',
                                      color: (contextForm.banking.accountType === 'CVU') ? '#9b59b6' : '#7f8c8d',
                                      cursor: 'pointer', fontWeight: 'bold', textAlign: 'center', transition: 'all 0.2s',
                                      boxShadow: (contextForm.banking.accountType === 'CVU') ? '0 2px 5px rgba(155, 89, 182, 0.2)' : 'none'
                                    }}>
                                    📱 Wallet (CVU)
                                  </div>
                                </div>
                              </div>
                              <InputGroup label={`${contextForm.banking.accountType === 'CVU' ? 'CVU' : 'CBU'} (22 digits)`} error={errors.cbu}>
                                <input
                                  style={inputStyle}
                                  value={contextForm.banking.cbu}
                                  onChange={(e) => handleBankingChange('cbu', e.target.value)}
                                  placeholder="0000000000000000000000"
                                  maxLength={22}
                                />
                              </InputGroup>
                            </>
                          )}
                        </>
                      )}

                      {/* ⚡ PAGO MOVIL VENEZUELA */}
                      {contextForm.banking.deliveryMethod === 'pago_movil' && (
                        <>
                          <InputGroup label="Cédula (V/E)" error={errors.idNumber}>
                            <input
                              style={inputStyle}
                              value={contextForm.banking.idNumber || ''}
                              onChange={(e) => handleBankingChange('idNumber', e.target.value)}
                              placeholder="V-12345678"
                            />
                          </InputGroup>
                          <InputGroup label="Bank" error={errors.bankName}>
                            <select style={inputStyle} value={contextForm.banking.bankName} onChange={(e) => handleBankingChange('bankName', e.target.value)}>
                              <option value="">Select Bank</option>
                              {VE_BANKS.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                          </InputGroup>
                          <InputGroup label="Mobile Number" error={errors.mobileNumber}>
                            <input
                              style={inputStyle}
                              value={contextForm.banking.mobileNumber || ''}
                              onChange={(e) => handleBankingChange('mobileNumber', e.target.value)}
                              placeholder="0414 123 4567"
                            />
                          </InputGroup>
                        </>
                      )}

                    </>
                  )}
                </div> {/* End of Column 2 */}

              </div> {/* End of Grid */}

              {/* Footer Actions */}
              <div style={{ display: 'flex', gap: '15px', marginTop: '30px', borderTop: '1px solid #e1e8ed', paddingTop: '20px' }}>
                <button
                  onClick={() => router.back()}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '10px',
                    border: '2px solid #e1e8ed', backgroundColor: 'transparent',
                    color: '#7f8c8d', fontWeight: 'bold', cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>

                {/* UPDATE CHECKBOX (Only if editing a saved entry) */}
                {editingIndex !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px' }}>
                    <input
                      type="checkbox"
                      id="updateSaved"
                      defaultChecked={true}
                      onChange={(e) => {
                        if (!e.target.checked) setEditingIndex(999); // 999 = Create New
                        else setEditingIndex(editingIndex);
                      }}
                    />
                    <label htmlFor="updateSaved" style={{ fontSize: '12px', color: '#7f8c8d', cursor: 'pointer' }}>
                      Update details?
                    </label>
                  </div>
                )}

                <button
                  onClick={handleUnifiedSubmit}
                  className="action-button"
                  disabled={loading}
                  style={{
                    flex: 2, padding: '14px', borderRadius: '10px',
                    border: 'none', backgroundColor: '#4A90E2',
                    color: 'white', fontWeight: 'bold', cursor: 'pointer',
                    opacity: loading ? 0.7 : 1,
                    boxShadow: '0 4px 15px rgba(74, 144, 226, 0.3)'
                  }}
                >
                  {loading ? 'Processing...' : 'Review & Confirm'}
                </button>
              </div>

            </div>
            {/* Closing the form view and the container */}
          </>
        )}

      </main>
    </div>
  );
}