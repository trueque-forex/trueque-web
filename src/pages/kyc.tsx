// src/pages/kyc.tsx
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

type DocumentType = 'passport' | 'drivers_license' | 'national_id';

import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAuth } from '../context/AuthContext'; // Integration
import { generateTruequeID } from '@/lib/idGenerator';
import brandConfig from '../config/brand_config.json';

export default function KYCPage() {
  useRequireAuth(); // Auth Guard
  const { user, refreshSession } = useAuth(); // Context Access
  const router = useRouter();
  const { returnTo, offerId, userId, from, to, amountIntent, expectedReceive, newUser } = router.query;

  const [userName, setUserName] = useState('User');
  const [userTruequeId, setUserTruequeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasMounted, setHasMounted] = useState(false);
  const [rejectedFields, setRejectedFields] = useState<string[]>([]);

  // Granular Locking Logic
  // Granular Locking Logic
  const isFieldLocked = (fieldName: string) => {
    // RESOLVE EFFECTIVE USER (Context or LocalStorage)
    let effectiveUser: any = user;
    if (!effectiveUser && typeof window !== 'undefined') {
      try {
        const sessionStr = localStorage.getItem('trueque_session');
        if (sessionStr) effectiveUser = JSON.parse(sessionStr);
      } catch { }
    }

    // 0. Placeholder Detection
    const isPlaceholder = (val: string) => {
      if (!val) return true;
      const v = val.toLowerCase().trim();
      return v === 'user' || v === 'test' || v === 'friend' || v === 'none';
    };

    // 1. Initial State (New User) - Unlock Everything
    const status = (effectiveUser?.kycStatus || effectiveUser?.kyc_status || '').toUpperCase();
    if (status === 'NONE' || status === 'INCOMPLETE' || !status) return false;

    // 2. Source Validated Lockdown (The "Signup Truth" Rule)
    // If we have "Truth" data from signup/session, we lock the field to prevent drifting.
    if (fieldName === 'dateOfBirth' && (effectiveUser?.dob || effectiveUser?.date_of_birth)) return true;

    // Lock Name if we have a structured first/last name (Strong Signal)
    // Only lock if names are present and NOT placeholders
    if (fieldName === 'fullLegalName') {
      const fn = effectiveUser?.firstName || '';
      const ln = effectiveUser?.lastName || '';
      const name = effectiveUser?.name || '';
      if ((fn && ln && !isPlaceholder(fn) && !isPlaceholder(ln)) || (name && !isPlaceholder(name))) return true;
    }

    // Address Locks (Strict Signup Integrity)
    if (fieldName === 'street_address' && (effectiveUser?.street_address || effectiveUser?.address)) return true;
    if (fieldName === 'city' && effectiveUser?.city) return true;
    if (fieldName === 'state' && (effectiveUser?.state_province || effectiveUser?.state)) return true;
    if (fieldName === 'postalCode' && (effectiveUser?.postal_code || effectiveUser?.postalCode)) return true;
    if (fieldName === 'country' && (effectiveUser?.countryOfResidence || effectiveUser?.country_of_residence)) return true;
    if (fieldName === 'documentIssuingCountry' && (effectiveUser?.countryOfResidence || effectiveUser?.country_of_residence)) return true;
    if (fieldName === 'documentType' && (effectiveUser?.countryOfResidence || effectiveUser?.country_of_residence)) return true;

    if (status === 'PENDING' || status === 'VERIFIED' || status === 'APPROVED') {
      return true;
    }
    // 2. Partial Unlock (Remediation)
    if (status === 'ACTION_REQUIRED') {
      // Only unlock if field is specifically rejected
      return !rejectedFields.includes(fieldName);
    }
    // 3. Default Open
    return false;
  };

  // Helper for Global ReadOnly (e.g. Navigation)
  const isGlobalReadOnly = (() => {
    let effectiveUser: any = user;
    if (!effectiveUser && typeof window !== 'undefined') {
      try {
        const sessionStr = localStorage.getItem('trueque_session');
        if (sessionStr) effectiveUser = JSON.parse(sessionStr);
      } catch { }
    }
    const status = (effectiveUser?.kycStatus || effectiveUser?.kyc_status || '').toUpperCase();

    // UNLOCK IF STATUS IS NONE OR INCOMPLETE
    if (status === 'NONE' || status === 'INCOMPLETE' || !status) return false;

    return status === 'PENDING' || status === 'VERIFIED' || status === 'APPROVED';
  })();

  // Helper for Remediation Mode
  const isRemediationMode = (() => {
    let effectiveUser: any = user;
    if (!effectiveUser && typeof window !== 'undefined') {
      try {
        const sessionStr = localStorage.getItem('trueque_session');
        if (sessionStr) effectiveUser = JSON.parse(sessionStr);
      } catch { }
    }
    const status = (effectiveUser?.kycStatus || effectiveUser?.kyc_status || '').toUpperCase();
    return status === 'ACTION_REQUIRED';
  })();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // KYC Form Data
  const [kycData, setKycData] = useState({
    // Personal Information
    fullLegalName: '',
    dateOfBirth: '',
    nationality: '',
    occupation: '',

    // Address Information
    street_address: '', // Mapped from addressLine1
    apartment: '', // Mapped from addressLine2
    city: '',
    state: '',
    postalCode: '',
    country: 'MX', // Default

    // Document Information
    documentType: 'national_id' as DocumentType,
    documentNumber: '',
    documentIssueDate: '',
    documentExpiryDate: '',
    documentIssuingCountry: '',

    // Additional Information
    sourceOfFunds: '',
    purposeOfTransaction: '',
    estimatedMonthlyVolume: '',

    // Consent
    agreedToDataProcessing: false,
    agreedToScreening: false,
    phone: ''
  });

  // --- PREPOPULATION LOGIC (Preserving Existing Logic) ---
  useEffect(() => {
    if (user && !loading) {
      setKycData(prev => {
        const newData = { ...prev };
        let changed = false;

        // Name Logic: Combine First + Last or use Name
        if (!prev.fullLegalName) {
          const fn = user.firstName || '';
          const ln = user.lastName || '';
          const combined = [fn, ln].filter(Boolean).join(' ');

          if (combined && combined.toLowerCase() !== 'user') {
            newData.fullLegalName = combined;
            changed = true;
          } else if (user.name && user.name.toLowerCase() !== 'user') {
            newData.fullLegalName = user.name;
            changed = true;
          }
        }

        // DOB Logic
        if (!prev.dateOfBirth && (user.dob || user.date_of_birth)) {
          newData.dateOfBirth = user.dob || user.date_of_birth || '';
          changed = true;
        }

        // Address Logic (If available in user profile)
        if (!prev.country && (user.countryOfResidence || user.country)) {
          newData.country = user.countryOfResidence || user.country;
          changed = true;
        }

        return changed ? newData : prev;
      });
    }
  }, [user, loading]);

  // File uploads
  const [documentFrontFile, setDocumentFrontFile] = useState<File | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Detect sender's country from the 'from' currency parameter
    const getSenderCountry = (currencyCode: string | string[] | undefined): string => {
      if (!currencyCode) return '';
      const code = Array.isArray(currencyCode) ? currencyCode[0] : currencyCode;

      const currencyMap: Record<string, string> = {
        'ARS': 'AR',  // Argentina
        'BOB': 'BO',  // Bolivia
        'BRL': 'BR',  // Brazil
        'COP': 'CO',  // Colombia
        'USD': 'US',  // United States (El Salvador also uses USD)
        'GTQ': 'GT',  // Guatemala
        'MXN': 'MX',  // Mexico
        'MXP': 'MX',  // Mexico (alternate)
        'EUR': 'ES',  // Default to Spain for EUR (could be Portugal too)
        'VES': 'VE',  // Venezuela
      };

      return currencyMap[code] || '';
    };

    const senderCountry = getSenderCountry(from);

    const sessionData = localStorage.getItem('trueque_session');
    const draftData = sessionStorage.getItem('registrationDraft');
    // ANCHOR KYC PERSISTENCE: Check Local first (cross-tab), then Session
    const progressData = localStorage.getItem('trueque_kyc_progress') || sessionStorage.getItem('trueque_kyc_progress');

    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUserName(session.firstName || 'User');
        setUserTruequeId(session.truequeId || '');
        if (session.rejectedFields) {
          setRejectedFields(session.rejectedFields);
        }

        // Base pre-fill from session (Data Anchor)
        // PRIORITY: Context User -> Local Session -> Default
        const source = user || session || {};
        let prefill: any = {
          // STEP 1: Personal
          fullLegalName: (source.firstName && source.lastName)
            ? `${source.firstName} ${source.lastName}`
            : (source.name && source.name.toLowerCase() !== 'user' ? source.name : ''),
          country: senderCountry || source.countryOfResidence || session?.countryOfResidence || '',
          nationality: (source as any).nationality || session?.nationality || senderCountry || '',
          dateOfBirth: (source as any).dateOfBirth || (source as any).dob || session?.dateOfBirth || session?.dob || '',
          occupation: (source as any).occupation || session?.occupation || '',

          // STEP 2: Address (Signup Sync)
          street_address: (source.street_address || session?.street_address || source.address || session?.address || ''),
          apartment: (source.apartment || session?.apartment || ''),
          city: (source.city || session?.city || ''),
          state: (source.state_province || session?.state_province || ''),
          postalCode: (source.postal_code || session?.postal_code || ''),

          // STEP 3: Documents
          documentType: 'passport',
          documentNumber: '',
          documentIssueDate: '',
          documentExpiryDate: '',
          documentIssuingCountry: source.countryOfResidence || session?.countryOfResidence || senderCountry || '',
          phone: source.phone || session?.phone || '',

          // STEP 4: Additional Info
          sourceOfFunds: '',
          purposeOfTransaction: '',
          estimatedMonthlyVolume: '',
          agreedToDataProcessing: false,
          agreedToScreening: false
        };

        // Enhanced pre-fill from Draft (if available)
        if (draftData) {
          const draft = JSON.parse(draftData);
          prefill = {
            ...prefill,
            fullLegalName: draft.fullLegalName || prefill.fullLegalName,
            dateOfBirth: draft.dob || '', // Hydrate DOB
            street_address: draft.street_address || '',
            apartment: draft.apartment || '',
            city: draft.city || '',
            state: draft.state_province || draft.state || '',
            postalCode: draft.postal_code || draft.postalCode || '',
            country: draft.country || prefill.country,
            nationality: draft.nationality || prefill.nationality
          };
        }

        // Final Override: In-Progress KYC Data (Persistence)
        if (progressData) {
          const progress = JSON.parse(progressData);
          setKycData(prev => ({
            ...prev,
            ...prefill,
            ...progress // Override with any saved progress
          }));
        } else {
          setKycData(prev => ({
            ...prev,
            ...prefill
          }));
        }

      } catch (e) {
        console.error('Error loading session:', e);
      }
    } else if (senderCountry) {
      // Even without session, pre-fill country from transaction
      setKycData(prev => ({
        ...prev,
        country: senderCountry,
        nationality: senderCountry,
        documentIssuingCountry: senderCountry
      }));
    }

    // Load Last Step
    try {
      const savedStep = sessionStorage.getItem('trueque_kyc_step');
      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        if (stepNum > 1 && stepNum <= 5) setCurrentStep(stepNum);
      }
    } catch { }

  }, [from]);

  // Persistence: Save KYC Progress on Change
  useEffect(() => {
    // Save Data
    if (kycData.fullLegalName || kycData.dateOfBirth || kycData.street_address) {
      const data = JSON.stringify(kycData);
      sessionStorage.setItem('trueque_kyc_progress', data);
      localStorage.setItem('trueque_kyc_progress', data); // Persistent Save
    }
    // Save Step
    sessionStorage.setItem('trueque_kyc_step', String(currentStep));
  }, [kycData, currentStep]);

  // Auto-default Document Type for ES
  useEffect(() => {
    if (kycData.country === 'ES' || kycData.nationality === 'ES') {
      if (kycData.documentType === 'passport') { // Only valid if not explicitly changed?
        setKycData(prev => ({ ...prev, documentType: 'national_id' }));
      }
    }
  }, [kycData.country, kycData.nationality]);

  // Get country-specific address placeholders
  const getAddressPlaceholders = () => {
    const countryCode = kycData.country;
    switch (countryCode) {
      case 'AR':
        return {
          street_address: 'Av. Corrientes 1234',
          apartment: 'Piso 5',
          city: 'Buenos Aires',
          state: 'CABA',
          postalCode: 'C1043'
        };
      case 'MX':
        return {
          street_address: 'e.g. Av. Reforma 123',
          apartment: 'e.g. Col. Centro',
          city: 'e.g. Ciudad de México',
          state: 'e.g. CDMX',
          postalCode: 'e.g. 01000'
        };
      case 'BR':
        return {
          street_address: 'e.g. Rua Paulista 1000',
          apartment: 'e.g. Apto 12',
          city: 'e.g. São Paulo',
          state: 'e.g. SP',
          postalCode: 'e.g. 01310-100'
        };
      case 'ES':
        return {
          street_address: 'e.g. Calle Gran Vía 45',
          apartment: 'e.g. 3º A',
          city: 'e.g. Madrid',
          state: 'e.g. Madrid',
          postalCode: 'e.g. 28013'
        };
      default:
        return {
          street_address: 'Street Name & Number',
          apartment: 'Apt, Unit, Suite',
          city: 'City',
          state: 'State or Province',
          postalCode: 'Postal / ZIP Code'
        };
    }
  };

  const addressPlaceholders = getAddressPlaceholders();

  const handleInputChange = (field: keyof typeof kycData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = (e.target as HTMLInputElement).type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setKycData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileChange = (setter: React.Dispatch<React.SetStateAction<File | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!kycData.fullLegalName.trim()) newErrors.fullLegalName = 'Full Name is required';
    if (!kycData.dateOfBirth) newErrors.dateOfBirth = 'Date of Birth is required';
    else {
      const birthDate = new Date(kycData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) newErrors.dateOfBirth = 'You must be at least 18 years old';
    }
    if (!kycData.nationality) newErrors.nationality = 'Nationality is required';
    if (!kycData.occupation.trim()) newErrors.occupation = 'Occupation is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!kycData.street_address.trim()) newErrors.street_address = 'Street Address is required';
    if (!kycData.city.trim()) newErrors.city = 'City is required';
    if (!kycData.state.trim()) newErrors.state = 'State/Province is required';
    if (!kycData.postalCode.trim()) newErrors.postalCode = 'Postal Code is required';
    if (!kycData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!kycData.documentNumber.trim()) newErrors.documentNumber = 'Document Number is required';
    if (!kycData.documentIssueDate) newErrors.documentIssueDate = 'Issue Date is required';
    if (!kycData.documentExpiryDate) newErrors.documentExpiryDate = 'Expiry Date is required';

    if (kycData.documentIssueDate && kycData.documentExpiryDate) {
      if (new Date(kycData.documentExpiryDate) <= new Date(kycData.documentIssueDate)) {
        newErrors.documentExpiryDate = 'Expiry date must be after issue date';
      }
    }

    if (!kycData.documentIssuingCountry) newErrors.documentIssuingCountry = 'Issuing Country is required';
    // ID Document is required for Tier 2+, but let's at least check fields for Tier 1 submission

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    if (!kycData.sourceOfFunds) newErrors.sourceOfFunds = 'Source of funds is required';
    if (!kycData.purposeOfTransaction) newErrors.purposeOfTransaction = 'Purpose is required';
    // Proof of address is optional for testing
    // if (!proofOfAddressFile) newErrors.proofOfAddress = 'Proof of address is required';
    if (!kycData.agreedToDataProcessing) newErrors.agreedToDataProcessing = 'You must agree to data processing';
    if (!kycData.agreedToScreening) newErrors.agreedToScreening = 'You must agree to screening';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        // Combine Step 1 & 2 Validation
        const v1 = validateStep1();
        const v2 = validateStep2();
        isValid = v1 && v2;
        break;
      case 2:
        // Combine Step 3 & 4 Validation
        const v3 = validateStep3();
        const v4 = validateStep4();
        isValid = v3 && v4;
        break;
    }

    if (isValid) {
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmitKYC();
      }
    }
  };

  const handleSubmitKYC = async () => {
    setLoading(true);

    try {
      // Submit KYC and Generate TID
      const res = await fetch('/api/kyc/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || undefined, // If from query, else rely on session/cookie logic if we had auth header helper? 
          // Wait, apiFetch handles headers usually, but here using raw fetch?
          // kyc.tsx usually relies on `useRequireAuth` which ensures session.
          // But we need to pass the userId explicitly if usage suggests.
          // Let's use `apiFetch` if possible?
          // kyc.tsx imports `useRequireAuth` but doesn't import `apiFetch` in top scope.
          // I'll stick to `fetch` but I might need to send userId from `localStorage` Trueque Session if available.
          // Or assume Cookie is set? Cookie IS set by signup endpoint `authResponse`.
          // So pure `fetch` sends cookies? Only if `credentials: 'include'`?
          // NextJS API routes share same domain, so cookies sent automatically.
          kycData
        })
      });
      // Actually, better to send userId explicitly if we have it in URL query or session state.
      // Lines 87-91 load session from localStorage.
      // But `userId` is also a query param.
      // I'll assume cookie works for `req.cookies` but explicit ID is safer for API.
      // I'll grab ID from session state.

      const responseJson = await res.json();

      if (responseJson.ok && responseJson.tid) {
        setUserTruequeId(responseJson.tid);

        // ACTIVATE LOGIN STATE: Refresh Session from Cookie now that Flow A is done.
        // This ensures Dashboard access is valid.
        await refreshSession().catch((e: any) => console.warn('KYC refresh session warning:', e));

        // Update Session in LocalStorage with new TID (if session handles exist)
        const sessionStr = localStorage.getItem('trueque_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          session.tid = responseJson.tid;
          session.truequeId = responseJson.tid; // Handle both keys
          session.kycStatus = 'PENDING'; // Force State Lock
          session.kycTier = 'TIER_1_PENDING'; // Persistence Requirement
          localStorage.setItem('trueque_session', JSON.stringify(session));
          localStorage.setItem('kyc_tier', '1'); // Redundant explicit key for easy access

          // Force Context Refresh to Lock UI Immediately
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
          }
        }
      } else {
        console.warn('KYC Complete did not return TID', responseJson);
      }

      // Cleanup sensitive draft data
      sessionStorage.removeItem('registrationDraft');
      sessionStorage.removeItem('trueque_kyc_progress');
      sessionStorage.removeItem('trueque_kyc_step'); // Clear step too

      // Show Completion Screen
      setCurrentStep(5);

    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert('Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    fontSize: '15px',
    border: '2px solid #e1e8ed',
    borderRadius: '8px',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#34495e'
  };

  const errorStyle: React.CSSProperties = {
    color: '#e74c3c',
    fontSize: '13px',
    marginTop: '6px'
  };

  return (

    <div className="min-h-screen bg-gray-50 flex flex-col lg:grid lg:grid-cols-12 lg:h-screen lg:overflow-hidden">

      {/* --- LEFT SIDEBAR (Desktop) --- */}
      {currentStep < 5 && (
        <aside className="hidden lg:flex lg:col-span-3 bg-white border-r border-gray-200 flex-col p-10 h-full overflow-y-auto relative z-10">
          {/* Brand */}
          <div className="mb-12">
            <h1 style={{
              fontSize: '32px',
              fontWeight: brandConfig.theme.fontWeight,
              margin: 0,
              fontFamily: brandConfig.theme.fontFamily,
              color: '#1A73E8'
            }}>
              {brandConfig.appName}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Complete your identity verification to continue
            </p>
          </div>

          {/* Vertical Stepper */}
          <div className="space-y-8">
            {[1, 2].map(step => (
              <div key={step} className="flex items-center gap-4 group">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep >= step
                    ? 'bg-[#1A73E8] text-white shadow-lg shadow-blue-200'
                    : 'bg-gray-100 text-gray-400'
                    }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
                <div className="flex flex-col">
                  <span className={`font-bold text-base transition-colors ${currentStep >= step ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step === 1 ? 'Identity Information' : 'Verification & Consent'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {step === 1 ? 'Personal details & Address' : 'ID Upload & Final Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* --- MOBILE HEADER (Visible only on mobile) --- */}
      {currentStep < 5 && (
        <header className="lg:hidden bg-white p-6 border-b border-gray-200 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {brandConfig.appName}
          </h1>
        </header>
      )}

      {/* --- RIGHT CONTENT AREA --- */}
      <main className={`${currentStep === 5 ? 'lg:col-span-12' : 'lg:col-span-9'} h-full overflow-y-auto bg-gray-50/50 p-4 lg:p-8`}>
        <div className="w-full">
          {/* Welcome Banner for New Users */}
          {hasMounted && newUser === 'true' && (
            <div style={{
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: '#e8f4fd',
              border: '2px solid #1A73E8',
              borderRadius: '12px'
            }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '20px' }}>
                🎉 Welcome to {brandConfig.appName}, {userName}!
              </h2>
              <p style={{ margin: 0, color: '#34495e', lineHeight: '1.6' }}>
                Before you can make your first swap, we need to complete a quick verification process. This helps us keep {brandConfig.appName} safe and compliant. Don't worry - this is just a test environment, so you can use fake information!
              </p>
            </div>
          )}

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>

            {/* APPROVED STATE OVERRIDE */}
            {
              ((user as any)?.kycStatus || (user as any)?.kyc_status) === 'APPROVED' ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                  <h1 style={{ color: '#27ae60', marginBottom: '15px' }}>Account Approved</h1>
                  <p style={{ color: '#7f8c8d', fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>
                    Your identity has been verified. You now have full access to global swaps with higher limits.
                  </p>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button
                      onClick={() => router.push('/dashboard')}
                      style={{
                        padding: '12px 24px', backgroundColor: '#1A73E8', color: 'white',
                        border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step 1: Personal Information AND Address (Landscape Layout) */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Personal Info Section */}
                        <div className="bg-gray-50/30 p-6 rounded-xl border border-gray-100/50">
                          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#2c3e50' }}>
                            Personal Information
                          </h2>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            <div>
                              <label style={labelStyle}>Full Legal Name *</label>
                              <input
                                type="text"
                                value={kycData.fullLegalName}
                                onChange={handleInputChange('fullLegalName')}
                                placeholder="As shown on government ID"
                                style={{ ...inputStyle, backgroundColor: isFieldLocked('fullLegalName') ? '#f3f4f6' : 'white', cursor: isFieldLocked('fullLegalName') ? 'not-allowed' : 'text', opacity: isFieldLocked('fullLegalName') ? 0.75 : 1 }}
                                readOnly={isFieldLocked('fullLegalName')}
                              />
                              {errors.fullLegalName && <div style={errorStyle}>{errors.fullLegalName}</div>}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <label style={labelStyle}>Date of Birth *</label>
                                <input
                                  type="date"
                                  value={kycData.dateOfBirth}
                                  onChange={handleInputChange('dateOfBirth')}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('dateOfBirth') ? '#f3f4f6' : 'white', cursor: isFieldLocked('dateOfBirth') ? 'not-allowed' : 'text', opacity: isFieldLocked('dateOfBirth') ? 0.75 : 1 }}
                                  readOnly={isFieldLocked('dateOfBirth')}
                                />
                                {errors.dateOfBirth && <div style={errorStyle}>{errors.dateOfBirth}</div>}
                              </div>

                              <div>
                                <label style={labelStyle}>Nationality *</label>
                                <select
                                  value={kycData.nationality}
                                  onChange={handleInputChange('nationality')}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('nationality') ? '#f3f4f6' : 'white', cursor: isFieldLocked('nationality') ? 'not-allowed' : 'pointer', opacity: isFieldLocked('nationality') ? 0.75 : 1 }}
                                  disabled={isFieldLocked('nationality')}
                                >
                                  <option value="">Select Nationality</option>
                                  <option value="AR">Argentina</option>
                                  <option value="BO">Bolivia</option>
                                  <option value="BR">Brazil</option>
                                  <option value="CO">Colombia</option>
                                  <option value="SV">El Salvador</option>
                                  <option value="GT">Guatemala</option>
                                  <option value="MX">Mexico</option>
                                  <option value="PT">Portugal</option>
                                  <option value="ES">Spain</option>
                                  <option value="US">United States</option>
                                  <option value="VE">Venezuela</option>
                                  <option value="CA">Canada</option>
                                  <option value="GB">United Kingdom</option>
                                </select>
                                {errors.nationality && <div style={errorStyle}>{errors.nationality}</div>}
                              </div>
                            </div>

                            <div>
                              <label style={labelStyle}>Occupation</label>
                              <input
                                type="text"
                                value={kycData.occupation}
                                onChange={handleInputChange('occupation')}
                                placeholder="Your current occupation"
                                style={{ ...inputStyle, backgroundColor: isFieldLocked('occupation') ? '#f3f4f6' : 'white', cursor: isFieldLocked('occupation') ? 'not-allowed' : 'text', opacity: isFieldLocked('occupation') ? 0.75 : 1 }}
                                readOnly={isFieldLocked('occupation')}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address Section */}
                        <div className="bg-gray-50/30 p-6 rounded-xl border border-gray-100/50">
                          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#2c3e50' }}>
                            Residential Address
                          </h2>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                              <div>
                                <label style={labelStyle}>Street Address *</label>
                                <input
                                  type="text"
                                  value={kycData.street_address}
                                  onChange={handleInputChange('street_address')}
                                  placeholder={addressPlaceholders.street_address}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('street_address') ? '#f3f4f6' : 'white', cursor: isFieldLocked('street_address') ? 'not-allowed' : 'text' }}
                                  readOnly={isFieldLocked('street_address')}
                                />
                                {errors.street_address && <div style={errorStyle}>{errors.street_address}</div>}
                              </div>
                              <div>
                                <label style={labelStyle}>Apt/Suite</label>
                                <input
                                  type="text"
                                  value={kycData.apartment}
                                  onChange={handleInputChange('apartment')}
                                  placeholder={addressPlaceholders.apartment}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('apartment') ? '#f3f4f6' : 'white', cursor: isFieldLocked('apartment') ? 'not-allowed' : 'text' }}
                                  readOnly={isFieldLocked('apartment')}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <label style={labelStyle}>City *</label>
                                <input
                                  type="text"
                                  value={kycData.city}
                                  onChange={handleInputChange('city')}
                                  placeholder={addressPlaceholders.city}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('city') ? '#f3f4f6' : 'white', cursor: isFieldLocked('city') ? 'not-allowed' : 'text' }}
                                  readOnly={isFieldLocked('city')}
                                />
                                {errors.city && <div style={errorStyle}>{errors.city}</div>}
                              </div>
                              <div>
                                <label style={labelStyle}>State/Province *</label>
                                <input
                                  type="text"
                                  value={kycData.state}
                                  onChange={handleInputChange('state')}
                                  placeholder={addressPlaceholders.state}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('state') ? '#f3f4f6' : 'white', cursor: isFieldLocked('state') ? 'not-allowed' : 'text', opacity: isFieldLocked('state') ? 0.75 : 1 }}
                                  readOnly={isFieldLocked('state')}
                                />
                                {errors.state && <div style={errorStyle}>{errors.state}</div>}
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <label style={labelStyle}>Postal Code *</label>
                                <input
                                  type="text"
                                  value={kycData.postalCode}
                                  onChange={handleInputChange('postalCode')}
                                  placeholder={addressPlaceholders.postalCode}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('postalCode') ? '#f3f4f6' : 'white', cursor: isFieldLocked('postalCode') ? 'not-allowed' : 'text', opacity: isFieldLocked('postalCode') ? 0.75 : 1 }}
                                  readOnly={isFieldLocked('postalCode')}
                                />
                                {errors.postalCode && <div style={errorStyle}>{errors.postalCode}</div>}
                              </div>
                              <div>
                                <label style={labelStyle}>Country of Residence (Anchor) *</label>
                                <select
                                  value={kycData.country}
                                  onChange={handleInputChange('country')}
                                  style={{ ...inputStyle, backgroundColor: isFieldLocked('country') ? '#f3f4f6' : 'white', cursor: isFieldLocked('country') ? 'not-allowed' : 'pointer', opacity: isFieldLocked('country') ? 0.75 : 1 }}
                                  disabled={isFieldLocked('country')}
                                >
                                  <option value="">Select Country</option>
                                  <option value="AR">Argentina</option>
                                  <option value="BO">Bolivia</option>
                                  <option value="BR">Brazil</option>
                                  <option value="CO">Colombia</option>
                                  <option value="SV">El Salvador</option>
                                  <option value="GT">Guatemala</option>
                                  <option value="MX">Mexico</option>
                                  <option value="PT">Portugal</option>
                                  <option value="ES">Spain</option>
                                  <option value="US">United States</option>
                                  <option value="VE">Venezuela</option>
                                  <option value="CA">Canada</option>
                                  <option value="GB">United Kingdom</option>
                                </select>
                                {errors.country && <div style={errorStyle}>{errors.country}</div>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}


                  {/* Step 2: Documents & Consent */}
                  {currentStep === 2 && (
                    <div className="space-y-8">
                      {/* Document Section */}
                      <div className="bg-gray-50/30 p-6 rounded-xl border border-gray-100/50">
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#2c3e50' }}>
                          Identity Documents
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label style={labelStyle}>Document Type *</label>
                            <select
                              value={kycData.documentType}
                              onChange={handleInputChange('documentType')}
                              style={{ ...inputStyle, backgroundColor: isFieldLocked('documentType') ? '#f3f4f6' : 'white', cursor: isFieldLocked('documentType') ? 'not-allowed' : 'pointer' }}
                              disabled={isFieldLocked('documentType')}
                            >
                              <option value="national_id">{kycData.country === 'ES' ? 'DNI / NIE (National ID)' : 'National ID Card'}</option>
                              <option value="passport">Passport</option>
                              <option value="drivers_license">Driver's License</option>
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Document Number *</label>
                            <input
                              type="text"
                              value={kycData.documentNumber}
                              onChange={handleInputChange('documentNumber')}
                              placeholder={kycData.country === 'ES' ? 'e.g. 12345678Z' : 'Document Number'}
                              style={{ ...inputStyle, backgroundColor: isFieldLocked('documentNumber') ? '#f3f4f6' : 'white', cursor: isFieldLocked('documentNumber') ? 'not-allowed' : 'text' }}
                              readOnly={isFieldLocked('documentNumber')}
                            />
                            {errors.documentNumber && <div style={errorStyle}>{errors.documentNumber}</div>}
                          </div>

                          <div>
                            <label style={labelStyle}>Issuing Country *</label>
                            <select
                              value={kycData.documentIssuingCountry}
                              onChange={handleInputChange('documentIssuingCountry')}
                              style={{ ...inputStyle, backgroundColor: isFieldLocked('documentIssuingCountry') ? '#f3f4f6' : 'white', cursor: isFieldLocked('documentIssuingCountry') ? 'not-allowed' : 'pointer' }}
                              disabled={isFieldLocked('documentIssuingCountry')}
                            >
                              <option value="">Select Country</option>
                              <option value="AR">Argentina</option>
                              <option value="BO">Bolivia</option>
                              <option value="BR">Brazil</option>
                              <option value="CO">Colombia</option>
                              <option value="SV">El Salvador</option>
                              <option value="GT">Guatemala</option>
                              <option value="MX">Mexico</option>
                              <option value="PT">Portugal</option>
                              <option value="ES">Spain</option>
                              <option value="US">United States</option>
                              <option value="VE">Venezuela</option>
                              <option value="CA">Canada</option>
                              <option value="GB">United Kingdom</option>
                            </select>
                            {errors.documentIssuingCountry && <div style={errorStyle}>{errors.documentIssuingCountry}</div>}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label style={labelStyle}>Issue Date *</label>
                              <input
                                type="date"
                                value={kycData.documentIssueDate}
                                onChange={handleInputChange('documentIssueDate')}
                                style={inputStyle}
                              />
                              {errors.documentIssueDate && <div style={errorStyle}>{errors.documentIssueDate}</div>}
                            </div>
                            <div>
                              <label style={labelStyle}>Expiry Date *</label>
                              <input
                                type="date"
                                value={kycData.documentExpiryDate}
                                onChange={handleInputChange('documentExpiryDate')}
                                style={inputStyle}
                              />
                              {errors.documentExpiryDate && <div style={errorStyle}>{errors.documentExpiryDate}</div>}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label style={labelStyle}>Document Front *</label>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleFileChange(setDocumentFrontFile)}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {documentFrontFile && <p className="mt-1 text-xs text-green-600">✓ {documentFrontFile.name}</p>}
                            {errors.documentFront && <div style={errorStyle}>{errors.documentFront}</div>}
                          </div>
                          <div>
                            <label style={labelStyle}>Selfie with ID *</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange(setSelfieFile)}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            {selfieFile && <p className="mt-1 text-xs text-green-600">✓ {selfieFile.name}</p>}
                            {errors.selfie && <div style={errorStyle}>{errors.selfie}</div>}
                          </div>
                        </div>
                      </div>

                      {/* Additional Info Section */}
                      <div className="bg-gray-50/30 p-6 rounded-xl border border-gray-100/50">
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#2c3e50' }}>
                          Additional Information
                        </h2>

                        <div className="space-y-6">
                          <div>
                            <label style={labelStyle}>Source of Funds *</label>
                            <select
                              value={kycData.sourceOfFunds}
                              onChange={handleInputChange('sourceOfFunds')}
                              style={inputStyle}
                            >
                              <option value="">Select source</option>
                              <option value="employment">Employment / Salary</option>
                              <option value="business">Business Income</option>
                              <option value="savings">Savings</option>
                              <option value="investment">Investment Returns</option>
                              <option value="other">Other</option>
                            </select>
                            {errors.sourceOfFunds && <div style={errorStyle}>{errors.sourceOfFunds}</div>}
                          </div>

                          <div>
                            <label style={labelStyle}>Purpose of Transactions *</label>
                            <textarea
                              value={kycData.purposeOfTransaction}
                              onChange={handleInputChange('purposeOfTransaction')}
                              placeholder="e.g., Family support, business expenses"
                              rows={2}
                              style={{ ...inputStyle, resize: 'none' }}
                            />
                            {errors.purposeOfTransaction && <div style={errorStyle}>{errors.purposeOfTransaction}</div>}
                          </div>

                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={kycData.agreedToDataProcessing}
                                onChange={handleInputChange('agreedToDataProcessing')}
                                className="mt-1 h-4 w-4"
                                id="consent1"
                              />
                              <label htmlFor="consent1" className="text-sm text-yellow-800 leading-tight cursor-pointer">
                                I confirm that all information provided is for testing purposes only. No real personal data is being shared.
                              </label>
                            </div>
                            <div className="flex items-start gap-3 mt-4">
                              <input
                                type="checkbox"
                                checked={kycData.agreedToScreening}
                                onChange={handleInputChange('agreedToScreening')}
                                className="mt-1 h-4 w-4"
                                id="consent2"
                              />
                              <label htmlFor="consent2" className="text-sm text-yellow-800 leading-tight cursor-pointer">
                                I acknowledge that this is a UI prototype and no actual verification will be conducted.
                              </label>
                            </div>
                            {(errors.agreedToDataProcessing || errors.agreedToScreening) && (
                              <div className="mt-2 text-xs text-red-600">Please accept all consents to proceed.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Completion & TID */}
                  {currentStep === 5 && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
                      <h2 style={{ fontSize: '28px', color: '#2c3e50', marginBottom: '15px' }}>Verification Submitted!</h2>
                      <p style={{ color: '#7f8c8d', fontSize: '16px', marginBottom: '30px' }}>
                        Thank you, {userName}. Your information has been securely received.
                      </p>

                      <div style={{
                        backgroundColor: '#f8f9fa',
                        border: '2px dashed #bdc3c7',
                        borderRadius: '12px',
                        padding: '30px',
                        marginBottom: '30px',
                        maxWidth: '500px',
                        margin: '0 auto 30px auto'
                      }}>
                        <div style={{ fontSize: '14px', color: '#95a5a6', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          YOUR SYMMETRI ID
                        </div>
                        <div style={{
                          fontSize: '28px',
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color: '#2c3e50',
                          letterSpacing: '2px',
                          wordBreak: 'break-all'
                        }}>
                          {userTruequeId || generateTruequeID(kycData.country || 'ES')}
                        </div>
                        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f6f3', borderRadius: '8px', borderLeft: '4px solid #27ae60' }}>
                          <p style={{ margin: 0, fontSize: '14px', color: '#16a085', textAlign: 'left' }}>
                            This is your Symmetri ID. It is your permanent key for secure account recovery and ensures your privacy and safety during peer-to-peer swaps. Store it in a safe, offline location.
                          </p>
                        </div>
                      </div>

                      <div style={{
                        textAlign: 'left',
                        marginBottom: '20px',
                        color: '#2c3e50',
                        fontSize: '15px',
                        maxWidth: '600px',
                        margin: '0 auto 20px auto',
                        lineHeight: '1.5',
                        backgroundColor: '#e8f4fc',
                        padding: '20px',
                        borderRadius: '8px',
                        borderLeft: '5px solid #3498db'
                      }}>
                        <strong>Verification in Progress:</strong> While your identity is being verified, you are allowed to perform a single swap of up to $200 USD or its equivalent in the currency you decide. We will notify you once your full limits are active.
                      </div>

                      <button
                        onClick={() => {
                          sessionStorage.removeItem('trueque_kyc_step');
                          router.push('/dashboard');
                        }}
                        style={{
                          padding: '16px 40px',
                          fontSize: '18px',
                          fontWeight: '700',
                          color: 'white',
                          background: 'linear-gradient(135deg, #1A73E8 0%, #357ABD 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(26, 115, 232, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Go to Dashboard →
                      </button>
                    </div>
                  )}

                  {/* Navigation Buttons (Hide on Step 5) */}
                  {currentStep < 5 && (
                    <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                      {/* HYDRATION SHIELD: Server/Client Separation */}
                      {!hasMounted ? (
                        /* SERVER/INITIAL RENDER: Neutral State */
                        <button
                          disabled={true}
                          style={{
                            flex: 1,
                            padding: '16px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#95a5a6',
                            background: '#f8f9fa',
                            border: '2px solid #e1e8ed',
                            borderRadius: '12px',
                            cursor: 'default'
                          }}
                        >
                          ← Back
                        </button>
                      ) : (
                        <>
                          {/* CLIENT RENDER: Dynamic State */}
                          <button
                            onClick={() => {
                              if (currentStep === 1) {
                                const hasSession = user || localStorage.getItem('trueque_session');
                                if (hasSession) {
                                  router.push('/dashboard');
                                } else {
                                  router.push('/signup');
                                }
                              } else {
                                setCurrentStep(currentStep - 1);
                              }
                            }}
                            disabled={loading}
                            style={{
                              flex: 1,
                              padding: '16px',
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#7f8c8d',
                              background: 'white',
                              border: '2px solid #e1e8ed',
                              borderRadius: '12px',
                              cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {(currentStep === 1)
                              ? ((user || (typeof window !== 'undefined' && localStorage.getItem('trueque_session'))) ? '← Back to Dashboard' : '← Back to Sign Up')
                              : '← Previous'}
                          </button>

                          {isGlobalReadOnly && currentStep === 2 ? (
                            <button
                              disabled
                              style={{
                                flex: 1,
                                padding: '16px',
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#2980b9',
                                background: '#ecf0f1',
                                border: '2px solid #bdc3c7',
                                borderRadius: '12px',
                                cursor: 'default',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                              }}
                            >
                              <span>🔒</span> Verification in Progress
                            </button>
                          ) : (
                            <button
                              onClick={handleNextStep}
                              disabled={loading}
                              style={{
                                flex: 1,
                                padding: '16px',
                                fontSize: '18px',
                                fontWeight: '600',
                                background: loading ? '#bdc3c7' : 'linear-gradient(135deg, #1A73E8 0%, #357ABD 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: (kycData.agreedToScreening === false && currentStep === 2) || loading ? 'not-allowed' : 'pointer',
                                opacity: (kycData.agreedToScreening === false && currentStep === 2) ? 0.7 : 1,
                                boxShadow: loading ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)'
                              }}
                            >
                              {loading ? 'Submitting...' : currentStep === 2 ? 'Submit KYC' : 'Next →'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Regulatory Notice (Fixed Visibility: Below Buttons) */}
                  {currentStep < 5 && (
                    <div className="mt-12 mb-20 p-8 bg-blue-50/70 border-2 border-[#1A73E8]/20 rounded-3xl text-[15px] text-gray-700 leading-relaxed text-left shadow-md max-w-5xl mx-auto">
                      <p>
                        <strong className="text-[#1A73E8] text-lg block mb-2 font-bold">Regulatory Compliance & Transparency</strong>
                        To comply with local and international regulations, Symmetri requires you to verify your identity. Access to full platform features will be limited until verification is complete.
                        <br /><br />
                        <span className="font-semibold text-gray-800">Note: </span>
                        Upon submitting your information, you may be eligible for a provisional one-time swap of up to $200 while full limits are activated.
                      </p>
                    </div>
                  )}
                </>
              )
            }
          </div>
        </div>
      </main>
    </div>
  );
}