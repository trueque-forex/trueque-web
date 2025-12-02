// src/pages/review.tsx
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

type PaymentMethodType = 'instant' | 'debit_card' | 'credit_card' | 'wallet' | 'ach';

interface FeeStructure {
  method: PaymentMethodType;
  label: string;
  percentage: number;
  fixed: number;
}

const FEE_RATES: FeeStructure[] = [
  { method: 'instant', label: 'Instant Payment', percentage: 0.015, fixed: 0.50 }, // 1.5% + $0.50
  { method: 'debit_card', label: 'Debit Card', percentage: 0.01, fixed: 0.00 },   // 1.0%
  { method: 'credit_card', label: 'Credit Card', percentage: 0.03, fixed: 0.00 },  // 3.0%
  { method: 'wallet', label: 'Digital Wallet', percentage: 0.02, fixed: 0.00 },    // 2.0%
  { method: 'ach', label: 'ACH Bank Transfer', percentage: 0.00, fixed: 0.00 },    // Free
];

const GATEWAY_FEE_LOCAL = 1.00; // Fixed local gateway fee
const GATEWAY_FEE_DESTINY = 2.00; // Fixed destiny gateway fee
const TRUEQUE_FEE_PERCENTAGE = 0.005; // 0.5% Trueque fee

export default function ReviewPage() {
  const router = useRouter();
  const {
    offerId,
    userId,
    from,
    to,
    amountIntent,
    expectedReceive,
    marketRate,
    timeFrame,
    beneficiary
  } = router.query;

  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [kycRequired, setKycRequired] = useState(false);

  // Payment Selection State
  const [selectedMethodType, setSelectedMethodType] = useState<PaymentMethodType>('ach');
  const [showAddPayment, setShowAddPayment] = useState(false);

  // Fee Calculation State
  const [fees, setFees] = useState({
    paymentMethodFee: 0,
    gatewayLocal: 0,
    gatewayDestiny: 0,
    truequeFee: 0,
    totalFees: 0,
    totalAmountToPay: 0
  });

  useEffect(() => {
    const sessionData = localStorage.getItem('trueque_session');
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        setUserName(session.firstName || session.email?.split('@')[0] || 'User');
      } catch (e) {
        console.error('Error loading session:', e);
      }
    }
    checkKycRequirement();
  }, [amountIntent]);

  // Recalculate fees when amount or method changes
  useEffect(() => {
    if (!amountIntent) return;

    const amount = parseFloat(amountIntent as string);
    const methodRate = FEE_RATES.find(r => r.method === selectedMethodType);

    if (methodRate) {
      const pmFee = (amount * methodRate.percentage) + methodRate.fixed;
      const truequeFee = amount * TRUEQUE_FEE_PERCENTAGE;

      // Gateway fees apply if amount > 0
      const gwLocal = amount > 0 ? GATEWAY_FEE_LOCAL : 0;
      const gwDestiny = amount > 0 ? GATEWAY_FEE_DESTINY : 0;

      const totalFees = pmFee + truequeFee + gwLocal + gwDestiny;

      setFees({
        paymentMethodFee: pmFee,
        gatewayLocal: gwLocal,
        gatewayDestiny: gwDestiny,
        truequeFee: truequeFee,
        totalFees: totalFees,
        totalAmountToPay: amount + totalFees
      });
    }
  }, [amountIntent, selectedMethodType]);

  const checkKycRequirement = async () => {
    try {
      const amount = parseFloat(amountIntent as string || '0');
      // Mock KYC check logic - trigger for amounts > $150
      const requiresKyc = amount > 150;
      setKycRequired(requiresKyc);
    } catch (error) {
      console.error('Error checking KYC:', error);
    }
  };

  const handleConfirmSwap = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    // If KYC is required, redirect to KYC page first
    if (kycRequired) {
      router.push({
        pathname: '/kyc',
        query: {
          returnTo: '/review',
          offerId,
          userId,
          from,
          to,
          amountIntent,
          expectedReceive,
          marketRate,
          timeFrame,
          paymentMethod: selectedMethodType,
          totalFees: fees.totalFees.toFixed(2)
        }
      });
      return;
    }

    setLoading(true);

    try {
      const mockTransactionId = `T${new Date().toISOString().slice(0, 10).replace(/-/g, '')}US${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}A`;

      router.push({
        pathname: '/transaction-success',
        query: {
          transactionId: mockTransactionId,
          amountSend: amountIntent,
          amountReceive: expectedReceive,
          currencyFrom: from,
          currencyTo: to,
          totalPaid: fees.totalAmountToPay.toFixed(2)
        }
      });
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#2c3e50',
    paddingBottom: '12px',
    borderBottom: '2px solid #e1e8ed'
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
    color: '#34495e'
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
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: '600', margin: 0 }}>
            Review & Confirm Swap
          </h1>
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
      </header>

      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 40px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          {/* KYC Warning */}
          {kycRequired && (
            <div style={{
              marginBottom: '25px',
              padding: '16px',
              backgroundColor: '#fff3cd',
              border: '2px solid #ffc107',
              borderRadius: '10px'
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#856404', fontWeight: '600' }}>
                ⚠️ KYC Verification Required
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#856404' }}>
                This transaction requires identity verification. You'll be redirected to complete KYC after confirming.
              </p>
            </div>
          )}

          {/* Payment Method Selection */}
          <h2 style={sectionHeaderStyle}>Payment Method</h2>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#34495e' }}>
              Select Payment Method:
            </label>
            <select
              value={selectedMethodType}
              onChange={(e) => setSelectedMethodType(e.target.value as PaymentMethodType)}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                border: '2px solid #e1e8ed',
                borderRadius: '10px',
                marginBottom: '15px',
                cursor: 'pointer',
                backgroundColor: 'white'
              }}
            >
              {FEE_RATES.map(rate => (
                <option key={rate.method} value={rate.method}>
                  {rate.label} (Fee: {rate.percentage * 100}% {rate.fixed > 0 ? `+ $${rate.fixed.toFixed(2)}` : ''})
                </option>
              ))}
            </select>

            {/* Add New Payment Method Toggle */}
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={() => setShowAddPayment(!showAddPayment)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4A90E2',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {showAddPayment ? '− Cancel adding new method' : '+ Add a new payment method'}
              </button>

              {showAddPayment && (
                <div style={{
                  marginTop: '15px',
                  padding: '20px',
                  border: '1px dashed #bdc3c7',
                  borderRadius: '10px',
                  backgroundColor: '#fafafa'
                }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#7f8c8d' }}>
                    Enter new payment details (Mock UI):
                  </p>
                  <input
                    placeholder="Card Number / Account Number"
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      placeholder="MM/YY"
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    />
                    <input
                      placeholder="CVC"
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <button style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#4A90E2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    Save Method
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fee Breakdown */}
          <h2 style={sectionHeaderStyle}>Fee Breakdown</h2>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
            <div style={rowStyle}>
              <span>Payment Method Fee ({FEE_RATES.find(r => r.method === selectedMethodType)?.label}):</span>
              <span>${fees.paymentMethodFee.toFixed(2)}</span>
            </div>
            <div style={rowStyle}>
              <span>Gateway Fee (Local):</span>
              <span>${fees.gatewayLocal.toFixed(2)}</span>
            </div>
            <div style={rowStyle}>
              <span>Gateway Fee (Destiny):</span>
              <span>${fees.gatewayDestiny.toFixed(2)}</span>
            </div>
            <div style={rowStyle}>
              <span>Trueque Fee ({TRUEQUE_FEE_PERCENTAGE * 100}%):</span>
              <span>${fees.truequeFee.toFixed(2)}</span>
            </div>
            <div style={{
              borderTop: '2px solid #e1e8ed',
              marginTop: '15px',
              paddingTop: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: '700',
              color: '#2c3e50'
            }}>
              <span>Total Amount to Pay:</span>
              <span>${fees.totalAmountToPay.toFixed(2)} {from}</span>
            </div>
          </div>

          {/* Transaction Summary (Moved to Bottom) */}
          <h2 style={sectionHeaderStyle}>Transaction Summary</h2>

          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#e8f4fd', borderRadius: '12px', border: '2px solid #4A90E2' }}>
            <div style={rowStyle}>
              <span>You send:</span>
              <strong>{amountIntent} {from}</strong>
            </div>
            <div style={rowStyle}>
              <span>Recipient receives:</span>
              <strong>{expectedReceive} {to}</strong>
            </div>
            <div style={{ ...rowStyle, borderTop: '1px solid #bdc3c7', paddingTop: '10px', marginTop: '10px' }}>
              <span>Market Rate:</span>
              <span>{marketRate}</span>
            </div>
            <div style={rowStyle}>
              <span>Additional Cost (Fees):</span>
              <span style={{ color: '#e74c3c' }}>-${fees.totalFees.toFixed(2)} {from}</span>
            </div>
            <div style={rowStyle}>
              <span><strong>Effective Rate:</strong></span>
              <strong>
                1 {from} = {(parseFloat(expectedReceive as string) / fees.totalAmountToPay).toFixed(4)} {to}
              </strong>
            </div>
            <div style={rowStyle}>
              <span>Delivery time:</span>
              <span>{timeFrame || 'Standard'}</span>
            </div>
          </div>

          {/* Terms */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                style={{ marginRight: '10px', width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px' }}>I agree to the terms and conditions</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={handleConfirmSwap}
              disabled={loading || !agreedToTerms}
              style={{
                flex: 2,
                padding: '16px',
                fontSize: '18px',
                fontWeight: '600',
                color: 'white',
                background: loading || !agreedToTerms
                  ? '#bdc3c7'
                  : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                border: 'none',
                borderRadius: '12px',
                cursor: loading || !agreedToTerms ? 'not-allowed' : 'pointer',
                boxShadow: loading || !agreedToTerms ? 'none' : '0 4px 12px rgba(74, 144, 226, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Processing...' : kycRequired ? 'Continue to KYC' : `Pay $${fees.totalAmountToPay.toFixed(2)} & Confirm`}
            </button>

            <button
              onClick={() => router.back()}
              style={{
                flex: 1,
                padding: '16px',
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
        </div>
      </main>
    </div>
  );
}