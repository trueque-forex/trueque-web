// src/pages/beneficiary.tsx
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

type AccountType = 'checking' | 'savings' | 'card' | 'wallet';
type RelationshipType = 'self' | 'family' | 'friend' | 'business' | 'other';

export default function BeneficiaryPage() {
  const router = useRouter();

  // Get swap context from query params
  const { from, to, amountIntent, expectedReceive, rate, timeFrame } = router.query;

  // User info
  const [userName, setUserName] = useState('User');
  const [existingBeneficiary, setExistingBeneficiary] = useState<any>(null);

  // Form state
  const [useSelf, setUseSelf] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [form, setForm] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: 'self' as RelationshipType,

    // Banking Information
    accountType: 'checking' as AccountType,
    bankName: '',
    branchCode: '',
    routingNumber: '',
    accountNumber: '',
    accountNumberConfirm: '',

    // Tax & Legal Information
    taxId: '',
    taxIdType: 'SSN' as 'SSN' | 'ITIN' | 'EIN' | 'Foreign',

    // Address Information
    street: '',
    street2: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Fetch user and beneficiary info on mount
  useEffect(() => {
    const sessionData = localStorage.getItem('trueque_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUserName(session.firstName || session.email?.split('@')[0] || 'User');

        // Check if beneficiary exists
        if (session.beneficiary) {
          setExistingBeneficiary(session.beneficiary);
          // Pre-fill form with existing beneficiary
          setForm(prev => ({
            ...prev,
            firstName: session.beneficiary.name?.split(' ')[0] || '',
            lastName: session.beneficiary.name?.split(' ').slice(1).join(' ') || '',
            accountType: session.beneficiary.type || 'checking',
            accountNumber: session.beneficiary.account || ''
          }));
        }
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }
  }, []);

  // Auto-fill user's own information if "I am the beneficiary" is checked
  useEffect(() => {
    if (useSelf) {
      const sessionData = localStorage.getItem('trueque_session');
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          setForm(prev => ({
            ...prev,
            firstName: session.firstName || '',
            lastName: session.lastName || '',
            email: session.email || '',
            relationship: 'self',
            street: session.address || '',
            country: session.country_of_residence || ''
          }));
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      }
    }
  }, [useSelf]);

  const handleChange = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    setFieldErrors(prev => ({ ...prev, [k]: '' }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    // Personal Information
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email format';
    }
    if (!form.phone.trim()) errors.phone = 'Phone number is required';

    // Banking Information
    if (!form.bankName.trim()) errors.bankName = 'Bank name is required';
    if (form.accountType === 'checking' || form.accountType === 'savings') {
      if (!form.routingNumber.trim()) {
        errors.routingNumber = 'Routing/branch code is required';
      }
    }
    if (!form.accountNumber.trim()) errors.accountNumber = 'Account number is required';
    if (form.accountNumber !== form.accountNumberConfirm) {
      errors.accountNumberConfirm = 'Account numbers do not match';
    }

    // Tax Information
    if (!form.taxId.trim()) errors.taxId = 'Tax ID is required';

    // Address
    if (!form.street.trim()) errors.street = 'Street address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State/Province is required';
    if (!form.zipCode.trim()) errors.zipCode = 'ZIP/Postal code is required';
    if (!form.country.trim()) errors.country = 'Country is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Prepare beneficiary data
    const beneficiaryData = {
      personal: {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        relationship: form.relationship
      },
      banking: {
        accountType: form.accountType,
        bankName: form.bankName.trim(),
        branchCode: form.branchCode.trim(),
        routingNumber: form.routingNumber.trim(),
        accountNumber: form.accountNumber.trim()
      },
      tax: {
        taxId: form.taxId.trim(),
        taxIdType: form.taxIdType
      },
      address: {
        street: form.street.trim(),
        street2: form.street2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zipCode: form.zipCode.trim(),
        country: form.country.trim()
      },
      swapContext: {
        from,
        to,
        amountIntent,
        expectedReceive,
        rate,
        timeFrame
      }
    };

    // TODO: Save beneficiary and proceed to review/confirmation
    console.log('Beneficiary data:', beneficiaryData);

    // Navigate to review page (to be created)
    router.push({
      pathname: '/review',
      query: {
        beneficiary: JSON.stringify(beneficiaryData)
      }
    });

    setLoading(false);
  };

  // Common styles (matching swap.tsx)
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '2px solid #e1e8ed',
    borderRadius: '10px',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#34495e'
  };

  const errorStyle: React.CSSProperties = {
    color: '#e74c3c',
    fontSize: '13px',
    marginTop: '6px',
    fontWeight: '500'
  };

  const helpStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#7f8c8d',
    marginTop: '6px'
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '25px',
    color: '#2c3e50',
    paddingBottom: '12px',
    borderBottom: '2px solid #e1e8ed'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
        padding: '30px 40px',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            margin: 0
          }}>
            Hello {userName}, Add Beneficiary Details
          </h1>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: 900,
        margin: '40px auto',
        padding: '0 40px'
      }}>
        {/* Swap Summary Card */}
        {amountIntent && (
          <div style={{
            backgroundColor: '#e8f4fd',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            border: '2px solid #4A90E2'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '16px' }}>
              Transaction Summary
            </h3>
            <div style={{ fontSize: '14px', color: '#34495e' }}>
              You're sending <strong>{amountIntent} {from}</strong> to receive <strong>{expectedReceive} {to}</strong>
              {timeFrame && <> within <strong>{timeFrame}</strong></>}
            </div>
          </div>
        )}

        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          {/* Existing Beneficiary Notice */}
          {existingBeneficiary && (
            <div style={{
              backgroundColor: '#d4edda',
              border: '2px solid #28a745',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '30px'
            }}>
              <p style={{ margin: 0, color: '#155724', fontWeight: '500' }}>
                ✓ You have an existing beneficiary on file: <strong>{existingBeneficiary.name}</strong>
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#155724' }}>
                You can use this beneficiary or enter new details below.
              </p>
            </div>
          )}

          {/* Self Beneficiary Option */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '16px',
              backgroundColor: useSelf ? '#e8f4fd' : '#f8f9fa',
              borderRadius: '10px',
              border: useSelf ? '2px solid #4A90E2' : '2px solid #e1e8ed',
              transition: 'all 0.2s'
            }}>
              <input
                type="checkbox"
                checked={useSelf}
                onChange={(e) => setUseSelf(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#34495e' }}>
                I am the beneficiary (receiving the funds myself)
              </span>
            </label>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Personal Information Section */}
            <h2 style={sectionHeaderStyle}>Personal Information</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '25px',
              marginBottom: '30px'
            }}>
              {/* First Name */}
              <div>
                <label htmlFor="firstName" style={labelStyle}>First Name *</label>
                <input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  placeholder="John"
                  style={inputStyle}
                />
                {fieldErrors.firstName && <div style={errorStyle}>{fieldErrors.firstName}</div>}
              </div>

              {/* Middle Name */}
              <div>
                <label htmlFor="middleName" style={labelStyle}>Middle Name (Optional)</label>
                <input
                  id="middleName"
                  value={form.middleName}
                  onChange={handleChange('middleName')}
                  placeholder="Michael"
                  style={inputStyle}
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" style={labelStyle}>Last Name *</label>
                <input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  placeholder="Doe"
                  style={inputStyle}
                />
                {fieldErrors.lastName && <div style={errorStyle}>{fieldErrors.lastName}</div>}
              </div>

              {/* Relationship */}
              <div>
                <label htmlFor="relationship" style={labelStyle}>Relationship to You *</label>
                <select
                  id="relationship"
                  value={form.relationship}
                  onChange={handleChange('relationship')}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  disabled={useSelf}
                >
                  <option value="self">Self</option>
                  <option value="family">Family Member</option>
                  <option value="friend">Friend</option>
                  <option value="business">Business Contact</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" style={labelStyle}>Email Address *</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="beneficiary@example.com"
                  style={inputStyle}
                />
                {fieldErrors.email && <div style={errorStyle}>{fieldErrors.email}</div>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" style={labelStyle}>Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={handleChange('phone')}
                  placeholder="+1 (555) 123-4567"
                  style={inputStyle}
                />
                <div style={helpStyle}>Include country code</div>
                {fieldErrors.phone && <div style={errorStyle}>{fieldErrors.phone}</div>}
              </div>
            </div>

            {/* Banking Information Section */}
            <h2 style={sectionHeaderStyle}>Banking Information</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '25px',
              marginBottom: '30px'
            }}>
              {/* Account Type */}
              <div>
                <label htmlFor="accountType" style={labelStyle}>Account Type *</label>
                <select
                  id="accountType"
                  value={form.accountType}
                  onChange={handleChange('accountType')}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="checking">Checking Account</option>
                  <option value="savings">Savings Account</option>
                  <option value="card">Debit Card</option>
                  <option value="wallet">Digital Wallet</option>
                </select>
              </div>

              {/* Bank Name */}
              <div>
                <label htmlFor="bankName" style={labelStyle}>Bank/Institution Name *</label>
                <input
                  id="bankName"
                  required
                  value={form.bankName}
                  onChange={handleChange('bankName')}
                  placeholder="e.g., Chase Bank"
                  style={inputStyle}
                />
                {fieldErrors.bankName && <div style={errorStyle}>{fieldErrors.bankName}</div>}
              </div>

              {/* Routing Number */}
              {(form.accountType === 'checking' || form.accountType === 'savings') && (
                <div>
                  <label htmlFor="routingNumber" style={labelStyle}>Routing Number *</label>
                  <input
                    id="routingNumber"
                    required
                    value={form.routingNumber}
                    onChange={handleChange('routingNumber')}
                    placeholder="9 digits"
                    style={inputStyle}
                  />
                  <div style={helpStyle}>9-digit routing number (US banks)</div>
                  {fieldErrors.routingNumber && <div style={errorStyle}>{fieldErrors.routingNumber}</div>}
                </div>
              )}

              {/* Branch Code */}
              {(form.accountType === 'checking' || form.accountType === 'savings') && (
                <div>
                  <label htmlFor="branchCode" style={labelStyle}>Branch Code (Optional)</label>
                  <input
                    id="branchCode"
                    value={form.branchCode}
                    onChange={handleChange('branchCode')}
                    placeholder="Branch identifier"
                    style={inputStyle}
                  />
                  <div style={helpStyle}>Required for some international banks</div>
                </div>
              )}

              {/* Account Number */}
              <div style={{ position: 'relative' }}>
                <label htmlFor="accountNumber" style={labelStyle}>
                  {form.accountType === 'wallet' ? 'Wallet ID' : 'Account Number'} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="accountNumber"
                    required
                    value={form.accountNumber}
                    onChange={handleChange('accountNumber')}
                    placeholder={form.accountType === 'wallet' ? 'username@provider' : 'Account number'}
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    type={showAccountNumber ? "text" : "password"}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#7f8c8d'
                    }}
                  >
                    {showAccountNumber ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {fieldErrors.accountNumber && <div style={errorStyle}>{fieldErrors.accountNumber}</div>}
              </div>

              {/* Confirm Account Number */}
              <div style={{ position: 'relative' }}>
                <label htmlFor="accountNumberConfirm" style={labelStyle}>
                  Confirm {form.accountType === 'wallet' ? 'Wallet ID' : 'Account Number'} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="accountNumberConfirm"
                    required
                    value={form.accountNumberConfirm}
                    onChange={handleChange('accountNumberConfirm')}
                    placeholder="Re-enter to confirm"
                    style={{ ...inputStyle, paddingRight: '40px' }}
                    type={showAccountNumber ? "text" : "password"}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccountNumber(!showAccountNumber)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#7f8c8d'
                    }}
                  >
                    {showAccountNumber ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {fieldErrors.accountNumberConfirm && <div style={errorStyle}>{fieldErrors.accountNumberConfirm}</div>}
              </div>
            </div>

            {/* Tax & Legal Information Section */}
            <h2 style={sectionHeaderStyle}>Tax & Legal Information</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '25px',
              marginBottom: '30px'
            }}>
              {/* Tax ID Type */}
              <div>
                <label htmlFor="taxIdType" style={labelStyle}>Tax ID Type *</label>
                <select
                  id="taxIdType"
                  value={form.taxIdType}
                  onChange={handleChange('taxIdType')}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="SSN">SSN (Social Security Number)</option>
                  <option value="ITIN">ITIN (Individual Taxpayer ID)</option>
                  <option value="EIN">EIN (Employer ID Number)</option>
                  <option value="Foreign">Foreign Tax ID</option>
                </select>
              </div>

              {/* Tax ID */}
              <div>
                <label htmlFor="taxId" style={labelStyle}>Tax ID Number *</label>
                <input
                  id="taxId"
                  required
                  value={form.taxId}
                  onChange={handleChange('taxId')}
                  placeholder="XXX-XX-XXXX"
                  style={inputStyle}
                  type="password"
                  autoComplete="off"
                />
                <div style={helpStyle}>Required for tax reporting and compliance</div>
                {fieldErrors.taxId && <div style={errorStyle}>{fieldErrors.taxId}</div>}
              </div>
            </div>

            {/* Address Information Section */}
            <h2 style={sectionHeaderStyle}>Address Information</h2>

            {/* Note for self-beneficiary */}
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#e8f4fd',
              borderLeft: '4px solid #4A90E2',
              borderRadius: '4px',
              fontSize: '14px',
              color: '#34495e'
            }}>
              <strong>Note:</strong> If you are sending funds to yourself, please use the <strong>address of the bank</strong> in the destination country.
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '25px',
              marginBottom: '30px'
            }}>
              {/* Street Address - Full Width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="street" style={labelStyle}>Street Address *</label>
                <input
                  id="street"
                  required
                  value={form.street}
                  onChange={handleChange('street')}
                  placeholder="123 Main Street"
                  style={inputStyle}
                />
                {fieldErrors.street && <div style={errorStyle}>{fieldErrors.street}</div>}
              </div>

              {/* Street Address 2 - Full Width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="street2" style={labelStyle}>Apartment, Suite, etc. (Optional)</label>
                <input
                  id="street2"
                  value={form.street2}
                  onChange={handleChange('street2')}
                  placeholder="Apt 4B"
                  style={inputStyle}
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" style={labelStyle}>City *</label>
                <input
                  id="city"
                  required
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="New York"
                  style={inputStyle}
                />
                {fieldErrors.city && <div style={errorStyle}>{fieldErrors.city}</div>}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" style={labelStyle}>State/Province *</label>
                <input
                  id="state"
                  required
                  value={form.state}
                  onChange={handleChange('state')}
                  placeholder="NY"
                  style={inputStyle}
                />
                {fieldErrors.state && <div style={errorStyle}>{fieldErrors.state}</div>}
              </div>

              {/* ZIP Code */}
              <div>
                <label htmlFor="zipCode" style={labelStyle}>ZIP/Postal Code *</label>
                <input
                  id="zipCode"
                  required
                  value={form.zipCode}
                  onChange={handleChange('zipCode')}
                  placeholder="10001"
                  style={inputStyle}
                />
                {fieldErrors.zipCode && <div style={errorStyle}>{fieldErrors.zipCode}</div>}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" style={labelStyle}>Country *</label>
                <input
                  id="country"
                  required
                  value={form.country}
                  onChange={handleChange('country')}
                  placeholder="United States"
                  style={inputStyle}
                />
                {fieldErrors.country && <div style={errorStyle}>{fieldErrors.country}</div>}
              </div>
            </div>

            {/* Compliance Notice */}
            <div style={{
              backgroundColor: '#fff9e6',
              border: '2px solid #ffc107',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '30px'
            }}>
              <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#856404' }}>
                ℹ️ Regulatory Compliance Notice
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                All information is collected in compliance with US and international anti-money laundering (AML)
                and know-your-customer (KYC) regulations. Your data is encrypted and stored securely.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '15px',
              marginTop: '30px'
            }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '18px',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'white',
                  background: loading
                    ? '#bdc3c7'
                    : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)'
                }}
              >
                {loading ? 'Processing...' : 'Continue to Review'}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                style={{
                  flex: 1,
                  padding: '18px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#7f8c8d',
                  background: 'white',
                  border: '2px solid #e1e8ed',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}