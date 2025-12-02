// src/pages/kyc.tsx
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

type DocumentType = 'passport' | 'drivers_license' | 'national_id';

export default function KYCPage() {
  const router = useRouter();
  const { returnTo, offerId, userId, from, to, amountIntent, expectedReceive } = router.query;

  const [userName, setUserName] = useState('User');
  const [userTruequeId, setUserTruequeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // KYC Form Data
  const [kycData, setKycData] = useState({
    // Personal Information
    fullLegalName: '',
    dateOfBirth: '',
    nationality: '',
    occupation: '',
    
    // Address Information
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    
    // Document Information
    documentType: 'passport' as DocumentType,
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
    agreedToScreening: false
  });

  // File uploads
  const [documentFrontFile, setDocumentFrontFile] = useState<File | null>(null);
  const [documentBackFile, setDocumentBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [proofOfAddressFile, setProofOfAddressFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const sessionData = localStorage.getItem('trueque_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUserName(session.firstName || 'User');
        setUserTruequeId(session.truequeId || '');
        
        // Pre-fill from session
        setKycData(prev => ({
          ...prev,
          fullLegalName: `${session.firstName} ${session.lastName}`,
          street: session.address || '',
          country: session.countryOfResidence || ''
        }));
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }
  }, []);

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
    if (!kycData.fullLegalName.trim()) newErrors.fullLegalName = 'Full legal name is required';
    if (!kycData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!kycData.nationality) newErrors.nationality = 'Nationality is required';
    if (!kycData.occupation) newErrors.occupation = 'Occupation is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!kycData.street.trim()) newErrors.street = 'Street address is required';
    if (!kycData.city.trim()) newErrors.city = 'City is required';
    if (!kycData.state.trim()) newErrors.state = 'State/Province is required';
    if (!kycData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
    if (!kycData.country.trim()) newErrors.country = 'Country is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!kycData.documentNumber.trim()) newErrors.documentNumber = 'Document number is required';
    if (!kycData.documentIssueDate) newErrors.documentIssueDate = 'Issue date is required';
    if (!kycData.documentExpiryDate) newErrors.documentExpiryDate = 'Expiry date is required';
    if (!kycData.documentIssuingCountry) newErrors.documentIssuingCountry = 'Issuing country is required';
    if (!documentFrontFile) newErrors.documentFront = 'Front of document is required';
    if (kycData.documentType === 'drivers_license' && !documentBackFile) {
      newErrors.documentBack = 'Back of document is required';
    }
    if (!selfieFile) newErrors.selfie = 'Selfie photo is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    if (!kycData.sourceOfFunds) newErrors.sourceOfFunds = 'Source of funds is required';
    if (!kycData.purposeOfTransaction) newErrors.purposeOfTransaction = 'Purpose is required';
    if (!proofOfAddressFile) newErrors.proofOfAddress = 'Proof of address is required';
    if (!kycData.agreedToDataProcessing) newErrors.agreedToDataProcessing = 'You must agree to data processing';
    if (!kycData.agreedToScreening) newErrors.agreedToScreening = 'You must agree to screening';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;
    
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
    }
    
    if (isValid) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmitKYC();
      }
    }
  };

  const handleSubmitKYC = async () => {
    setLoading(true);

    try {
      // TODO: Upload files and submit KYC data to backend
      const formData = new FormData();
      formData.append('kycData', JSON.stringify(kycData));
      if (documentFrontFile) formData.append('documentFront', documentFrontFile);
      if (documentBackFile) formData.append('documentBack', documentBackFile);
      if (selfieFile) formData.append('selfie', selfieFile);
      if (proofOfAddressFile) formData.append('proofOfAddress', proofOfAddressFile);

      // const response = await fetch('/api/kyc/submit', {
      //   method: 'POST',
      //   body: formData
      // });

      // Mock success
      alert('KYC submitted successfully! Our team will review within 24-48 hours.');
      
      // Return to original flow or dashboard
      if (returnTo) {
        router.push({
          pathname: returnTo as string,
          query: { offerId, userId, from, to, amountIntent, expectedReceive }
        });
      } else {
        router.push('/app');
      }
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
        padding: '30px 40px',
        color: 'white',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0 }}>
            KYC Verification
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '15px', opacity: 0.9 }}>
            Complete your identity verification to continue
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 40px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          {/* Progress Indicator */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              {[1, 2, 3, 4].map(step => (
                <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    margin: '0 auto',
                    backgroundColor: currentStep >= step ? '#4A90E2' : '#e1e8ed',
                    color: currentStep >= step ? 'white' : '#7f8c8d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    transition: 'all 0.3s'
                  }}>
                    {step}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: currentStep >= step ? '#2c3e50' : '#95a5a6',
                    marginTop: '8px',
                    fontWeight: '500'
                  }}>
                    {step === 1 ? 'Personal' : step === 2 ? 'Address' : step === 3 ? 'Documents' : 'Verification'}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e1e8ed',
              borderRadius: '2px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: '#4A90E2',
                width: `${(currentStep / 4) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Regulatory Notice */}
          <div style={{
            marginBottom: '30px',
            padding: '16px',
            backgroundColor: '#e8f4fd',
            border: '2px solid #4A90E2',
            borderRadius: '10px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#2c3e50', lineHeight: '1.6' }}>
              <strong>Why KYC is Required:</strong> Regulatory compliance (AML/CFT) requires identity verification for transactions meeting certain thresholds. Your information is encrypted and securely stored.
            </p>
          </div>

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '25px', color: '#2c3e50' }}>
                Personal Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Full Legal Name</label>
                  <input
                    type="text"
                    value={kycData.fullLegalName}
                    onChange={handleInputChange('fullLegalName')}
                    placeholder="As shown on government ID"
                    style={inputStyle}
                  />
                  {errors.fullLegalName && <div style={errorStyle}>{errors.fullLegalName}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Date of Birth</label>
                    <input
                      type="date"
                      value={kycData.dateOfBirth}
                      onChange={handleInputChange('dateOfBirth')}
                      style={inputStyle}
                    />
                    {errors.dateOfBirth && <div style={errorStyle}>{errors.dateOfBirth}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>Nationality</label>
                    <select value={kycData.nationality} onChange={handleInputChange('nationality')} style={inputStyle}>
                      <option value="">Select Nationality</option>
                      <option value="US">United States</option>
                      <option value="MX">Mexico</option>
                      <option value="BR">Brazil</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="DE">Germany</option>
                      <option value="ES">Spain</option>
                      <option value="IT">Italy</option>
                      <option value="JP">Japan</option>
                      <option value="CN">China</option>
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
                    style={inputStyle}
                  />
                  {errors.occupation && <div style={errorStyle}>{errors.occupation}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '25px', color: '#2c3e50' }}>
                Residential Address
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Street Address</label>
                  <input
                    type="text"
                    value={kycData.street}
                    onChange={handleInputChange('street')}
                    placeholder="123 Main Street, Apt 4B"
                    style={inputStyle}
                  />
                  {errors.street && <div style={errorStyle}>{errors.street}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      value={kycData.city}
                      onChange={handleInputChange('city')}
                      placeholder="New York"
                      style={inputStyle}
                    />
                    {errors.city && <div style={errorStyle}>{errors.city}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>State/Province</label>
                    <input
                      type="text"
                      value={kycData.state}
                      onChange={handleInputChange('state')}
                      placeholder="NY"
                      style={inputStyle}
                    />
                    {errors.state && <div style={errorStyle}>{errors.state}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Postal Code</label>
                    <input
                      type="text"
                      value={kycData.postalCode}
                      onChange={handleInputChange('postalCode')}
                      placeholder="10001"
                      style={inputStyle}
                    />
                    {errors.postalCode && <div style={errorStyle}>{errors.postalCode}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>Country</label>
                    <select value={kycData.country} onChange={handleInputChange('country')} style={inputStyle}>
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="MX">Mexico</option>
                      <option value="BR">Brazil</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                    </select>
                    {errors.country && <div style={errorStyle}>{errors.country}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '25px', color: '#2c3e50' }}>
                Identity Documents
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Document Type</label>
                  <select value={kycData.documentType} onChange={handleInputChange('documentType')} style={inputStyle}>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID Card</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Document Number</label>
                    <input
                      type="text"
                      value={kycData.documentNumber}
                      onChange={handleInputChange('documentNumber')}
                      placeholder="Document number"
                      style={inputStyle}
                    />
                    {errors.documentNumber && <div style={errorStyle}>{errors.documentNumber}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>Issuing Country</label>
                    <select value={kycData.documentIssuingCountry} onChange={handleInputChange('documentIssuingCountry')} style={inputStyle}>
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="MX">Mexico</option>
                      <option value="BR">Brazil</option>
                      <option value="CA">Canada</option>
                    </select>
                    {errors.documentIssuingCountry && <div style={errorStyle}>{errors.documentIssuingCountry}</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>Issue Date</label>
                    <input
                      type="date"
                      value={kycData.documentIssueDate}
                      onChange={handleInputChange('documentIssueDate')}
                      style={inputStyle}
                    />
                    {errors.documentIssueDate && <div style={errorStyle}>{errors.documentIssueDate}</div>}
                  </div>

                  <div>
                    <label style={labelStyle}>Expiry Date</label>
                    <input
                      type="date"
                      value={kycData.documentExpiryDate}
                      onChange={handleInputChange('documentExpiryDate')}
                      style={inputStyle}
                    />
                    {errors.documentExpiryDate && <div style={errorStyle}>{errors.documentExpiryDate}</div>}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Upload Document (Front)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange(setDocumentFrontFile)}
                    style={{ ...inputStyle, padding: '10px' }}
                  />
                  {documentFrontFile && (
                    <div style={{ fontSize: '13px', color: '#27ae60', marginTop: '6px' }}>
                      ✓ {documentFrontFile.name}
                    </div>
                  )}
                  {errors.documentFront && <div style={errorStyle}>{errors.documentFront}</div>}
                </div>

                {kycData.documentType === 'drivers_license' && (
                  <div>
                    <label style={labelStyle}>Upload Document (Back)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange(setDocumentBackFile)}
                      style={{ ...inputStyle, padding: '10px' }}
                    />
                    {documentBackFile && (
                      <div style={{ fontSize: '13px', color: '#27ae60', marginTop: '6px' }}>
                        ✓ {documentBackFile.name}
                      </div>
                    )}
                    {errors.documentBack && <div style={errorStyle}>{errors.documentBack}</div>}
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Selfie Photo</label>
                  <p style={{ fontSize: '13px', color: '#7f8c8d', margin: '4px 0 8px 0' }}>
                    Take a clear photo of yourself holding your ID document
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange(setSelfieFile)}
                    style={{ ...inputStyle, padding: '10px' }}
                  />
                  {selfieFile && (
                    <div style={{ fontSize: '13px', color: '#27ae60', marginTop: '6px' }}>
                      ✓ {selfieFile.name}
                    </div>
                  )}
                  {errors.selfie && <div style={errorStyle}>{errors.selfie}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Additional Info & Consent */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '25px', color: '#2c3e50' }}>
                Additional Information
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Source of Funds</label>
                  <select value={kycData.sourceOfFunds} onChange={handleInputChange('sourceOfFunds')} style={inputStyle}>
                    <option value="">Select source</option>
                    <option value="employment">Employment/Salary</option>
                    <option value="business">Business Income</option>
                    <option value="savings">Savings</option>
                    <option value="investment">Investment Returns</option>
                    <option value="family">Family Support</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.sourceOfFunds && <div style={errorStyle}>{errors.sourceOfFunds}</div>}
                </div>

                <div>
                  <label style={labelStyle}>Purpose of Transactions</label>
                  <textarea
                    value={kycData.purposeOfTransaction}
                    onChange={handleInputChange('purposeOfTransaction')}
                    placeholder="E.g., Family support, business expenses, personal remittances"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                  {errors.purposeOfTransaction && <div style={errorStyle}>{errors.purposeOfTransaction}</div>}
                </div>

                <div>
                  <label style={labelStyle}>Estimated Monthly Transaction Volume</label>
                  <select value={kycData.estimatedMonthlyVolume} onChange={handleInputChange('estimatedMonthlyVolume')} style={inputStyle}>
                    <option value="">Select range</option>
                    <option value="0-1000">$0 - $1,000</option>
                    <option value="1000-5000">$1,000 - $5,000</option>
                    <option value="5000-10000">$5,000 - $10,000</option>
                    <option value="10000+">$10,000+</option>
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Proof of Address</label>
                  <p style={{ fontSize: '13px', color: '#7f8c8d', margin: '4px 0 8px 0' }}>
                    Upload a recent utility bill, bank statement, or government document (within last 3 months)
                  </p>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange(setProofOfAddressFile)}
                    style={{ ...inputStyle, padding: '10px' }}
                  />
                  {proofOfAddressFile && (
                    <div style={{ fontSize: '13px', color: '#27ae60', marginTop: '6px' }}>
                      ✓ {proofOfAddressFile.name}
                    </div>
                  )}
                  {errors.proofOfAddress && <div style={errorStyle}>{errors.proofOfAddress}</div>}
                </div>

                {/* Consent Checkboxes */}
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '10px',
                  border: '2px solid #e1e8ed'
                }}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={kycData.agreedToDataProcessing}
                        onChange={handleInputChange('agreedToDataProcessing')}
                        style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '14px', color: '#2c3e50', lineHeight: '1.6' }}>
                        I consent to the collection, processing, and storage of my personal data for KYC/AML compliance purposes as described in the Privacy Policy.
                      </span>
                    </label>
                    {errors.agreedToDataProcessing && <div style={errorStyle}>{errors.agreedToDataProcessing}</div>}
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={kycData.agreedToScreening}
                        onChange={handleInputChange('agreedToScreening')}
                        style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '14px', color: '#2c3e50', lineHeight: '1.6' }}>
                        I authorize Trueque to conduct identity verification checks, including screening against sanctions lists and PEP databases.
                      </span>
                    </label>
                    {errors.agreedToScreening && <div style={errorStyle}>{errors.agreedToScreening}</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
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
                ← Previous
              </button>
            )}

            <button
              onClick={handleNextStep}
              disabled={loading}
              style={{
                flex: 2,
                padding: '16px',
                fontSize: '18px',
                fontWeight: '600',
                color: 'white',
                background: loading ? '#bdc3c7' : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)'
              }}
            >
              {loading ? 'Submitting...' : currentStep === 4 ? 'Submit KYC' : 'Next →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}