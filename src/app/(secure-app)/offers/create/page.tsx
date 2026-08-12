'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Contacts } from '@capacitor-community/contacts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CloseIcon from '@mui/icons-material/Close';

import InlineBeneficiaryForm from '@/components/shared/InlineBeneficiaryForm';
import PaymentMethodForm, { PaymentData } from '@/components/shared/PaymentMethodForm';
import TransactionSummary from '@/components/shared/TransactionSummary';

export default function CreateOfferWizard() {
  const router = useRouter();
  
  // Overall State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1 State: The Math
  const [amount, setAmount] = useState('');
  const [sourceCurrency, setSourceCurrency] = useState('USD');
  const [amountReceived, setAmountReceived] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('MXN');
  const [isRecurring, setIsRecurring] = useState(false);
  const [cadence, setCadence] = useState('MONTHLY');
  
  const parsedAmount = parseFloat(amount);
  const parsedReceived = parseFloat(amountReceived);
  const exchangeRate = (parsedAmount > 0 && parsedReceived > 0) 
    ? (parsedReceived / parsedAmount).toFixed(2) 
    : '0.00';
  
  // Step 2 State: Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);
  const [isAddingBeneficiary, setIsAddingBeneficiary] = useState(false);
  const [newBenName, setNewBenName] = useState('');
  const [newBenPhone, setNewBenPhone] = useState('');
  const [newBenMethod, setNewBenMethod] = useState('bank_rtp');
  const [newBenBank, setNewBenBank] = useState('');
  const [newBenAccount, setNewBenAccount] = useState('');
  
  // Step 3 State: Funding
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isPaymentValid, setIsPaymentValid] = useState(false);
  const [inboundGateways, setInboundGateways] = useState<any[]>([]);
  const [outboundRails, setOutboundRails] = useState<any[]>([]);
  const feePct = 0.015;
  const symmetriFee = (parseFloat(amount || '0') * feePct).toFixed(2);
  const grossTotal = (parseFloat(amount || '0') + parseFloat(symmetriFee)).toFixed(2);

  // Fetch Beneficiaries & Config
  useEffect(() => {
    if (currentStep >= 2 && beneficiaries.length === 0) {
      const fetchBens = async () => {
        setIsLoadingBeneficiaries(true);
        try {
          const res = await fetch('/api/beneficiaries');
          if (res.ok) {
            const data = await res.json();
            const bens = Array.isArray(data) ? data : (data.beneficiaries || []);
            setBeneficiaries(bens);
          }
        } catch (err) {
          console.error("Failed to load beneficiaries", err);
        } finally {
          setIsLoadingBeneficiaries(false);
        }
      };
      fetchBens();
    }
  }, [currentStep]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config/corridors');
        if (res.ok) {
          const data = await res.json();
          const sourceCountryStr = sourceCurrency === 'MXN' ? 'MX' : (sourceCurrency === 'EUR' ? 'ES' : 'US');
          const targetCountryStr = targetCurrency === 'MXN' ? 'MX' : (targetCurrency === 'EUR' ? 'ES' : 'US');

          if (data[sourceCountryStr] && data[sourceCountryStr].inbound_gateways) {
             const gateways = Object.keys(data[sourceCountryStr].inbound_gateways).map(key => ({
               id: key,
               ...data[sourceCountryStr].inbound_gateways[key]
             }));
             gateways.forEach(g => {
                if (g.id.includes('card')) {
                   g.pct += 0.001; // Liquidity buffer fee for cards
                }
             });
             setInboundGateways(gateways);
             if (gateways.length > 0 && !paymentMethod) {
               setPaymentMethod(gateways[0].id);
             }
          }

          if (data[targetCountryStr] && data[targetCountryStr].outbound_rails) {
             const rails = Object.keys(data[targetCountryStr].outbound_rails).map(key => ({
               id: key,
               ...data[targetCountryStr].outbound_rails[key]
             }));
             setOutboundRails(rails);
          }
        }
      } catch (e) {
        console.error("Failed to fetch inbound gateways");
      }
    };
    fetchConfig();
  }, [sourceCurrency]);

  const validBeneficiaries = beneficiaries.filter(b => {
    console.log("Filtering:", b.name, b.identifiers?.currency, targetCurrency, b.identifiers?.currency === targetCurrency);
    if (b.identifiers?.currency) return b.identifiers.currency === targetCurrency;
    const countryToCurr: Record<string, string> = { 'MX': 'MXN', 'ES': 'EUR', 'US': 'USD', 'GT': 'GTQ' };
    if (b.country && countryToCurr[b.country]) return countryToCurr[b.country] === targetCurrency;
    return false;
  });
  console.log("VALID BENS:", validBeneficiaries.length, validBeneficiaries);

  useEffect(() => {
    if (currentStep === 2 && validBeneficiaries.length > 0 && !selectedDestinationId) {
      setSelectedDestinationId(validBeneficiaries[0].id);
    }
  }, [currentStep, validBeneficiaries, selectedDestinationId]);

  // Actions
  const handleStep1Submit = async () => {
    if (!amount || !amountReceived) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swap_type: 'SYNTHETIC',
          amount,
          source_currency: sourceCurrency,
          amount_received: amountReceived,
          target_currency: targetCurrency,
          exchange_rate: exchangeRate,
          is_recurring: isRecurring,
          cadence: isRecurring ? cadence : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Draft Offer');
      setOfferId(data.offer.id);
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!selectedDestinationId || !offerId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination_id: selectedDestinationId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update Offer');
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewOffer = () => {
     setCurrentStep(4);
  };

  const handleFinalSubmit = async (redirectDest: 'home' | 'reset') => {
    if (!offerId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adyen_stored_payment_id: paymentData?.token || "mock_adyen_token_wizard_999",
          status: "OPEN" 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to finalize Offer');
      
      if (redirectDest === 'reset') {
         setCurrentStep(1);
         setAmount('');
         setAmountReceived('');
         setIsLoading(false);
      } else {
         router.push('/?success=offer_created');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">
      
      {/* Top Navbar / Header for Wizard */}
      <div className="w-full bg-white shadow-sm px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center space-x-2 text-blue-600">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
           <span className="font-bold text-xl tracking-tight text-gray-900">Symmetri</span>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Cancel and return to Dashboard"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 md:p-8 mt-4">
        
        <div className="mb-8 text-center animate-fade-in-up">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
            Post an <span className="gradient-text-hero">Offer</span>
          </h1>
          <p className="text-lg text-gray-600">
            Set your terms. We'll find a match. You keep custody until the swap.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm text-sm">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {/* STEP 1: The Math */}
          <div className={`glass-light rounded-2xl overflow-hidden transition-all duration-500 ease-in-out border ${currentStep === 1 ? 'shadow-xl ring-2 ring-blue-500/20 border-blue-200' : 'border-gray-200 opacity-80'}`}>
            <div className="px-6 py-5 flex items-center justify-between bg-white/50 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${currentStep > 1 ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white'}`}>
                  {currentStep > 1 ? <CheckCircleIcon fontSize="small" /> : '1'}
                </div>
                <h2 className="text-xl font-semibold text-gray-800">The Math</h2>
              </div>
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(1)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
              )}
            </div>

            <div className={`transition-all duration-500 overflow-hidden ${currentStep === 1 ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount I want to swap</label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium">$</span>
                      </div>
                      <input 
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-16 sm:text-lg border-gray-300 rounded-xl py-3"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <select
                          value={sourceCurrency}
                          onChange={(e) => setSourceCurrency(e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-r-xl font-semibold uppercase outline-none"
                        >
                          <option>USD</option>
                          <option>EUR</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount they will receive in {targetCurrency === 'MXN' ? '🇲🇽 Mexico' : targetCurrency === 'GTQ' ? '🇬🇹 Guatemala' : '🇪🇸 Spain'}
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium">$</span>
                      </div>
                      <input 
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-8 pr-16 sm:text-lg border-gray-300 rounded-xl py-3 bg-gray-50"
                        placeholder="0.00"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <select
                          value={targetCurrency}
                          onChange={(e) => setTargetCurrency(e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-r-xl font-semibold uppercase outline-none"
                        >
                          <option value="MXN">MXN</option>
                          <option value="GTQ">GTQ</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                
                
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div>
                    <label className="text-sm font-semibold text-gray-900">Recurring Swap</label>
                    <p className="text-xs text-gray-500">Automatically post this offer again</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {isRecurring && (
                      <select
                        value={cadence}
                        onChange={(e) => setCadence(e.target.value)}
                        className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="WEEKLY">Weekly</option>
                        <option value="BI-WEEKLY">Bi-Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`${isRecurring ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    >
                      <span className={`${isRecurring ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 flex justify-between items-center border border-blue-100">
                  <span className="text-sm text-blue-800 font-medium">Implied Exchange Rate</span>
                  <span className="text-sm text-blue-900 font-bold">1 {sourceCurrency} = {exchangeRate} {targetCurrency}</span>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleStep1Submit}
                    disabled={isLoading || !amount || !amountReceived}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Creating Draft...' : 'Commit Math & Continue'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Step 1 Summary (when collapsed) */}
            {currentStep > 1 && (
              <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Swapping <span className="font-bold text-gray-900">{amount} {sourceCurrency}</span> for <span className="font-bold text-gray-900">{amountReceived} {targetCurrency}</span></span>
              </div>
            )}
          </div>

          {/* STEP 2: The Destination */}
          <div className={`glass-light rounded-2xl overflow-hidden transition-all duration-500 ease-in-out border ${currentStep === 2 ? 'shadow-xl ring-2 ring-blue-500/20 border-blue-200' : 'border-gray-200 opacity-80'}`}>
            <div className={`px-6 py-5 flex items-center justify-between ${currentStep === 2 ? 'bg-white/50 border-b border-gray-100' : 'bg-gray-50/50'}`}>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${currentStep > 2 ? 'bg-green-100 text-green-700' : currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {currentStep > 2 ? <CheckCircleIcon fontSize="small" /> : '2'}
                </div>
                <h2 className={`text-xl font-semibold ${currentStep >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>The Destination</h2>
              </div>
              {currentStep > 2 && (
                <button onClick={() => setCurrentStep(2)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
              )}
            </div>

            <div className={`transition-all duration-500 overflow-hidden ${currentStep === 2 ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Where should the funds be deposited?</label>
                  
                  {isLoadingBeneficiaries ? (
                    <div className="py-8 text-center text-gray-500">Loading beneficiaries...</div>
                  ) : validBeneficiaries.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <p className="text-yellow-800 font-medium mb-3">You don't have any saved beneficiaries for {targetCurrency}.</p>
                      <button className="text-blue-600 font-semibold hover:underline">Add a new {targetCurrency} beneficiary</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isAddingBeneficiary ? (
                        <InlineBeneficiaryForm
                          targetCurrency={targetCurrency}
                          onSuccess={(data) => {
                             setBeneficiaries(prev => [...prev, data]);
                             setSelectedDestinationId(data.id);
                             setIsAddingBeneficiary(false);
                          }}
                          onCancel={() => setIsAddingBeneficiary(false)}
                        />
                      ) : (
                        <>
                          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                            {validBeneficiaries.map(ben => (
                              <div 
                                key={ben.id} 
                                onClick={() => setSelectedDestinationId(ben.id)}
                                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedDestinationId === ben.id ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                      {ben.name?.[0] || <AccountBalanceWalletIcon fontSize="small" />}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">{ben.name}</p>
                                      <p className="text-xs text-gray-500 uppercase">{ben.identifiers?.bank_name || ben.identifiers?.swift || 'Bank Transfer'} • {ben.country}</p>
                                    </div>
                                  </div>
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedDestinationId === ben.id ? 'border-blue-500' : 'border-gray-300'}`}>
                                    {selectedDestinationId === ben.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => setIsAddingBeneficiary(true)} className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-blue-600 font-medium hover:bg-gray-50 transition-colors">
                            + Add a new {targetCurrency} beneficiary
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleStep2Submit}
                    disabled={isLoading || !selectedDestinationId}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Choose Beneficiary & Continue'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Step 2 Summary (when collapsed) */}
            {currentStep > 2 && (
              <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Sending to <span className="font-bold text-gray-900">{validBeneficiaries.find(b => b.id === selectedDestinationId)?.name || 'Selected Beneficiary'}</span></span>
                <button onClick={() => setCurrentStep(2)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
              </div>
            )}
          </div>

          {/* STEP 3: The Funding */}
          <div className={`glass-light rounded-2xl overflow-hidden transition-all duration-500 ease-in-out border ${currentStep === 3 ? 'shadow-xl ring-2 ring-blue-500/20 border-blue-200' : 'border-gray-200 opacity-80'}`}>
            <div className={`px-6 py-5 flex items-center justify-between ${currentStep === 3 ? 'bg-white/50 border-b border-gray-100' : 'bg-gray-50/50'}`}>
              <div className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${currentStep > 3 ? 'bg-green-100 text-green-700' : currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {currentStep > 3 ? <CheckCircleIcon fontSize="small" /> : '3'}
                </div>
                <h2 className={`text-xl font-semibold ${currentStep >= 3 ? 'text-gray-800' : 'text-gray-400'}`}>The Funding</h2>
              </div>
              {currentStep > 3 && (
                <button onClick={() => setCurrentStep(3)} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Edit</button>
              )}
            </div>

            <div className={`transition-all duration-500 overflow-hidden ${currentStep === 3 ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 space-y-6">
                
                {/* Math Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b pb-2 mb-3">Transaction Receipt</h3>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Principal Amount</span>
                    <span className="font-medium text-gray-900">${amount} {sourceCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Wanted Exchange Rate</span>
                    <span className="font-medium text-gray-900">1 {sourceCurrency} = {exchangeRate} {targetCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 font-bold border-t pt-2 mt-2">
                    <span>Principal Amount</span>
                    <span className="font-bold text-gray-900">${amount} {sourceCurrency}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 italic">
                      * Note: Final costs may vary depending on the selected payment method, inbound/outbound gateway costs, and third-party processing fees.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Select Payment Method</h3>
                  <PaymentMethodForm 
                    gateways={inboundGateways}
                    selectedMethodId={paymentMethod}
                    onMethodSelect={setPaymentMethod}
                    onDataChange={(isValid, data) => {
                       setPaymentData(data);
                       setIsPaymentValid(isValid);
                    }}
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleReviewOffer}
                    disabled={!isPaymentValid}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Review Offer
                  </button>
                </div>

              </div>
            </div>
            
            {/* Step 3 Summary (when collapsed) */}
            {currentStep > 3 && (
              <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Funding Method <span className="font-bold text-gray-900">{inboundGateways.find(g => g.id === paymentMethod)?.label || 'Selected'}</span></span>
              </div>
            )}
          </div>
          
          {/* STEP 4: Summary */}
          {currentStep === 4 && (() => {
            const selectedBen = validBeneficiaries.find(b => b.id === selectedDestinationId);
            const benMethod = selectedBen?.method || 'bank_rtp';
            const outRail = outboundRails.find(r => r.id === benMethod) || outboundRails[0];
            const outboundFee = outRail ? outRail.cost.toFixed(2) : "0.00";
            
            const selectedInbound = inboundGateways.find(g => g.id === paymentMethod);
            const inboundFee = selectedInbound ? (parseFloat(amount || '0') * selectedInbound.pct + selectedInbound.fixed).toFixed(2) : "0.00";
            
            const totalFees = (parseFloat(symmetriFee) + parseFloat(inboundFee) + parseFloat(outboundFee)).toFixed(2);
            const effectiveRate = (parseFloat(amountReceived) / (parseFloat(amount || '0') + parseFloat(totalFees))).toFixed(2);

            return (
              <div className="relative">
                <TransactionSummary 
                  amount={amount}
                  sourceCurrency={sourceCurrency}
                  amountReceived={amountReceived}
                  targetCurrency={targetCurrency}
                  beneficiaryName={selectedBen?.name || '-'}
                  fundingMethodName={selectedInbound?.label || '-'}
                  symmetriFee={symmetriFee}
                  inboundFee={inboundFee}
                  outboundFee={outboundFee}
                  totalFees={totalFees}
                  effectiveRate={effectiveRate}
                  stepNumber={4}
                />
                
                <div className="space-y-3 mt-4">
                  <button 
                    onClick={() => handleFinalSubmit('reset')}
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl font-bold text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Post another Offer'}
                  </button>
                  <button 
                    onClick={() => handleFinalSubmit('home')}
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : 'Post Offer & Return Home'}
                  </button>
                </div>
              </div>
            );
          })()}
          
        </div>
      </div>
    </div>
  );
}
