// src/pages/offers.tsx
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';

type Offer = {
  id: string;
  userId: string;
  offerSend: number;
  marketReceive: number;

  // Itemized fees
  gatewayFee: number;
  paymentMethodFee: number;
  truequeFee: number;
  totalFees: number;

  offerReceive: number;
  effectiveRate: number;
  currencyFrom: string;
  currencyTo: string;
  marketRate: number;
  timeFrame: string;
  paymentMethod: string;
  reputation?: number;
  completedTransactions?: number;
};

export default function OffersPage() {
  const router = useRouter();

  const { from, to, amountIntent, expectedReceive, rate, timeFrame } = router.query;

  const [userName, setUserName] = useState('User');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        // TODO: Backend API call
        // const response = await fetch(`/api/offers?send=${amountIntent}&from=${from}&to=${to}`);

        const sendAmount = parseFloat(amountIntent as string) || 0;
        const marketRate = parseFloat(rate as string) || 1;
        const marketValue = sendAmount * marketRate;

        // Different counterparties use different payment methods with different fee structures
        const mockOffers: Offer[] = [
          {
            id: '1',
            userId: 'USR-7392',
            offerSend: sendAmount,
            marketReceive: marketValue,
            paymentMethod: 'Bank Transfer',
            gatewayFee: marketValue * 0.002, // 0.2% gateway
            paymentMethodFee: 0, // Bank transfer has no extra fee
            truequeFee: marketValue * 0.003, // 0.3% Trueque platform fee
            totalFees: marketValue * 0.005,
            offerReceive: marketValue - (marketValue * 0.005),
            effectiveRate: marketRate * 0.995,
            currencyFrom: from as string || 'USD',
            currencyTo: to as string || 'MXN',
            marketRate: marketRate,
            timeFrame: timeFrame as string || '24 hours',
            reputation: 4.9,
            completedTransactions: 203
          },
          {
            id: '2',
            userId: 'USR-5418',
            offerSend: sendAmount,
            marketReceive: marketValue,
            paymentMethod: 'Bank Transfer',
            gatewayFee: marketValue * 0.0025,
            paymentMethodFee: 0,
            truequeFee: marketValue * 0.003,
            totalFees: marketValue * 0.0055,
            offerReceive: marketValue - (marketValue * 0.0055),
            effectiveRate: marketRate * 0.9945,
            currencyFrom: from as string || 'USD',
            currencyTo: to as string || 'MXN',
            marketRate: marketRate,
            timeFrame: timeFrame as string || '24 hours',
            reputation: 5.0,
            completedTransactions: 156
          },
          {
            id: '3',
            userId: 'USR-9276',
            offerSend: sendAmount,
            marketReceive: marketValue,
            paymentMethod: 'Debit Card',
            gatewayFee: marketValue * 0.005, // 0.5% gateway
            paymentMethodFee: marketValue * 0.003, // 0.3% debit card processing
            truequeFee: marketValue * 0.003, // 0.3% Trueque
            totalFees: marketValue * 0.011,
            offerReceive: marketValue - (marketValue * 0.011),
            effectiveRate: marketRate * 0.989,
            currencyFrom: from as string || 'USD',
            currencyTo: to as string || 'MXN',
            marketRate: marketRate,
            timeFrame: timeFrame as string || '24 hours',
            reputation: 4.8,
            completedTransactions: 89
          },
          {
            id: '4',
            userId: 'USR-3164',
            offerSend: sendAmount,
            marketReceive: marketValue,
            paymentMethod: 'Debit Card',
            gatewayFee: marketValue * 0.006,
            paymentMethodFee: marketValue * 0.004,
            truequeFee: marketValue * 0.003,
            totalFees: marketValue * 0.013,
            offerReceive: marketValue - (marketValue * 0.013),
            effectiveRate: marketRate * 0.987,
            currencyFrom: from as string || 'USD',
            currencyTo: to as string || 'MXN',
            marketRate: marketRate,
            timeFrame: timeFrame as string || '24 hours',
            reputation: 4.7,
            completedTransactions: 67
          },
          {
            id: '5',
            userId: 'USR-8241',
            offerSend: sendAmount,
            marketReceive: marketValue,
            paymentMethod: 'Credit Card',
            gatewayFee: marketValue * 0.007, // 0.7% gateway
            paymentMethodFee: marketValue * 0.023, // 2.3% credit card processing
            truequeFee: marketValue * 0.003, // 0.3% Trueque
            totalFees: marketValue * 0.033,
            offerReceive: marketValue - (marketValue * 0.033),
            effectiveRate: marketRate * 0.967,
            currencyFrom: from as string || 'USD',
            currencyTo: to as string || 'MXN',
            marketRate: marketRate,
            timeFrame: timeFrame as string || '24 hours',
            reputation: 4.6,
            completedTransactions: 45
          }
        ];

        mockOffers.sort((a, b) => b.offerReceive - a.offerReceive);
        setOffers(mockOffers);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (from && to && amountIntent) {
      fetchOffers();
    }
  }, [from, to, amountIntent, rate, timeFrame]);

  const handleSwap = (offer: Offer) => {
    router.push({
      pathname: '/beneficiary',
      query: {
        offerId: offer.id,
        userId: offer.userId,
        from,
        to,
        amountIntent: offer.offerSend.toFixed(2),
        expectedReceive: offer.offerReceive.toFixed(2),
        marketRate: offer.marketRate.toFixed(4),
        effectiveRate: offer.effectiveRate.toFixed(4),
        totalFees: offer.totalFees.toFixed(2),
        paymentMethod: offer.paymentMethod,
        timeFrame: offer.timeFrame
      }
    });
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
            Hello {userName},
          </h1>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <button
              onClick={() => router.push('/app')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
            >
              Dashboard
            </button>
            <span style={{ fontSize: '24px', cursor: 'pointer' }}>🔔</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 40px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px', color: '#2c3e50' }}>
            Available Swap Matches
          </h2>
          <p style={{ fontSize: '15px', color: '#7f8c8d', marginBottom: '25px' }}>
            All swaps start at market rate. Fees are itemized and transparent.
          </p>

          <div style={{
            backgroundColor: '#e8f4fd',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
            border: '2px solid #4A90E2'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '4px' }}>You're Sending</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#2c3e50' }}>
                  {parseFloat(amountIntent as string || '0').toFixed(2)} {from}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '0 20px' }}>
                <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '4px' }}>Market Rate</div>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#4A90E2' }}>
                  1 {from} = {parseFloat(rate as string || '0').toFixed(4)} {to}
                </div>
                <div style={{ fontSize: '13px', color: '#95a5a6', marginTop: '4px' }}>
                  (1 {to} = {(1 / (parseFloat(rate as string) || 1)).toFixed(4)} {from})
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '4px' }}>At Market Rate</div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: '#27ae60' }}>
                  {parseFloat(expectedReceive as string || '0').toFixed(2)} {to}
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#7f8c8d' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <div>Finding best matches...</div>
            </div>
          ) : offers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: '#f8f9fa',
              borderRadius: '12px',
              border: '2px solid #e1e8ed'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                No matches available
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                Try adjusting your amount or time frame
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {offers.map((offer, index) => {

                return (
                  <div
                    key={offer.id}
                    onClick={() => setSelectedOffer(offer.id)}
                    style={{
                      padding: '24px',
                      backgroundColor: selectedOffer === offer.id ? '#f0f8ff' : '#fafbfc',
                      border: selectedOffer === offer.id ? '2px solid #4A90E2' : '2px solid #e1e8ed',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOffer !== offer.id) {
                        e.currentTarget.style.borderColor = '#b8d4f1';
                        e.currentTarget.style.backgroundColor = '#fcfdfe';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOffer !== offer.id) {
                        e.currentTarget.style.borderColor = '#e1e8ed';
                        e.currentTarget.style.backgroundColor = '#fafbfc';
                      }
                    }}
                  >
                    {index === 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '20px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        Lowest Fees
                      </div>
                    )}

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr 1fr auto',
                      gap: '20px',
                      alignItems: 'center'
                    }}>
                      {/* Rank */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: index === 0
                          ? 'linear-gradient(135deg, #27ae60 0%, #229954 100%)'
                          : 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: '600'
                      }}>
                        {index + 1}
                      </div>

                      {/* User Info */}
                      <div>
                        <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '4px', fontWeight: '500' }}>
                          User ID
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#2c3e50', fontFamily: 'monospace' }}>
                          {offer.userId}
                        </div>
                        {offer.reputation && (
                          <div style={{ fontSize: '13px', color: '#f39c12', marginTop: '4px' }}>
                            ⭐ {offer.reputation.toFixed(1)} • {offer.completedTransactions} swaps
                          </div>
                        )}
                      </div>

                      {/* You Receive */}
                      <div>
                        <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '4px', fontWeight: '500' }}>
                          You Receive (Est.)
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: '600', color: '#27ae60' }}>
                          {offer.marketReceive.toFixed(2)} {offer.currencyTo}
                        </div>
                        <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '2px' }}>
                          Market Rate: {offer.marketRate.toFixed(4)}
                        </div>
                      </div>

                      {/* Swap Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwap(offer);
                        }}
                        style={{
                          padding: '14px 28px',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: 'white',
                          background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(74, 144, 226, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(74, 144, 226, 0.3)';
                        }}
                      >
                        Swap →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Transparency Note */}
          <div style={{
            marginTop: '30px',
            padding: '16px',
            backgroundColor: '#fff9e6',
            border: '2px solid #ffc107',
            borderRadius: '10px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404', lineHeight: '1.6' }}>
              💡 <strong>Full Transparency:</strong> Transactions are shown at <strong>market rate</strong> with <strong>no rate margin fee</strong>.
              The final amount will be adjusted after Gateway, Payment Method, and Trueque fees are applied during the review step.
            </p>
          </div>

          {/* Back Button */}
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => router.back()}
              style={{
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#7f8c8d',
                background: 'white',
                border: '2px solid #e1e8ed',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ← Back to Swap
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}