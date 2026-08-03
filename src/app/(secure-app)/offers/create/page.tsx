'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function CreateOfferWizard() {
  const router = useRouter();
  
  // Overall State
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1 State: The Math
  const [amount, setAmount] = useState('100');
  const [sourceCurrency, setSourceCurrency] = useState('USD');
  const [amountReceived, setAmountReceived] = useState('2000');
  const [targetCurrency, setTargetCurrency] = useState('MXN');
  const exchangeRate = '20.00'; // mocked exchange rate for simplicity
  
  // Step 2 State: Beneficiaries
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);
  
  // Step 3 State: Funding
  const feePct = 0.015;
  const symmetriFee = (parseFloat(amount || '0') * feePct).toFixed(2);
  const grossTotal = (parseFloat(amount || '0') + parseFloat(symmetriFee)).toFixed(2);

  // Fetch Beneficiaries
  useEffect(() => {
    if (currentStep >= 2 && beneficiaries.length === 0) {
      const fetchBens = async () => {
        setIsLoadingBeneficiaries(true);
        try {
          const res = await fetch('/api/beneficiaries');
          if (res.ok) {
            const data = await res.json();
            setBeneficiaries(data.beneficiaries || []);
            if (data.beneficiaries?.length > 0) {
              setSelectedDestinationId(data.beneficiaries[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to load beneficiaries", err);
        } finally {
          setIsLoadingBeneficiaries(false);
        }
      };
      fetchBens();
    }
  }, [currentStep, beneficiaries.length]);

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
          exchange_rate: exchangeRate
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

  const handleStep3Submit = async () => {
    if (!offerId) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adyen_stored_payment_id: "mock_adyen_token_wizard_999",
          status: "OPEN" 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to finalize Offer');
      
      // Redirect or show success
      router.push('/?success=offer_created');
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full py-12 px-4 sm:px-6 flex flex-col items-center bg-gray-50/50">
      <div className="max-w-2xl w-full space-y-8">
        
        <div className="text-center animate-fade-in-up">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount they will receive</label>
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
                          <option>MXN</option>
                          <option>GTQ</option>
                        </select>
                      </div>
                    </div>
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
                  ) : beneficiaries.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                      <p className="text-yellow-800 font-medium mb-3">You don't have any saved beneficiaries yet.</p>
                      <button className="text-blue-600 font-semibold hover:underline">Add a new beneficiary</button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                      {beneficiaries.map(ben => (
                        <div 
                          key={ben.id} 
                          onClick={() => setSelectedDestinationId(ben.id)}
                          className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${selectedDestinationId === ben.id ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 bg-white'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                {ben.first_name?.[0] || <AccountBalanceWalletIcon fontSize="small" />}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{ben.first_name} {ben.last_name}</p>
                                <p className="text-xs text-gray-500 uppercase">{ben.bank_name || 'Bank Transfer'} • {ben.country_code}</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedDestinationId === ben.id ? 'border-blue-500' : 'border-gray-300'}`}>
                              {selectedDestinationId === ben.id && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                            </div>
                          </div>
                        </div>
                      ))}
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
                <span className="font-medium text-gray-700">Sending to <span className="font-bold text-gray-900">{beneficiaries.find(b => b.id === selectedDestinationId)?.first_name || 'Selected Beneficiary'}</span></span>
              </div>
            )}
          </div>

          {/* STEP 3: The Funding */}
          <div className={`glass-light rounded-2xl overflow-hidden transition-all duration-500 ease-in-out border ${currentStep === 3 ? 'shadow-xl ring-2 ring-blue-500/20 border-blue-200' : 'border-gray-200 opacity-80'}`}>
            <div className={`px-6 py-5 flex items-center space-x-3 ${currentStep === 3 ? 'bg-white/50 border-b border-gray-100' : 'bg-gray-50/50'}`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                3
              </div>
              <h2 className={`text-xl font-semibold ${currentStep === 3 ? 'text-gray-800' : 'text-gray-400'}`}>The Funding</h2>
            </div>

            <div className={`transition-all duration-500 overflow-hidden ${currentStep === 3 ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 space-y-6">
                
                {/* Math Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b pb-2 mb-3">Transaction Receipt</h3>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Principal Amount</span>
                    <span className="font-medium text-gray-900">${amount} {sourceCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Platform Fee (1.5%)</span>
                    <span className="font-medium text-gray-900">${symmetriFee} {sourceCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 pb-2 border-b">
                    <span>Outbound Rail Fee</span>
                    <span className="font-medium text-green-600 text-right">Waived<br/><span className="text-xs text-gray-400">Included in Match</span></span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-base font-bold text-gray-900">Gross Total</span>
                    <span className="text-xl font-black text-gray-900">${grossTotal} {sourceCurrency}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 flex space-x-3 items-start">
                  <PaymentsIcon className="text-blue-600 mt-0.5" fontSize="small" />
                  <p className="text-sm text-blue-900 leading-relaxed">
                    <strong>Auth without Capture:</strong> Your card will be securely verified, but you will <strong>not be charged</strong> until another user accepts your offer.
                  </p>
                </div>

                {/* Mock Card UI */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white cursor-pointer hover:border-blue-300 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center text-white text-[10px] font-bold">VISA</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Visa ending in 4242</p>
                      <p className="text-xs text-gray-500">Expires 12/26</p>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleStep3Submit}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-extrabold text-white bg-gray-900 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
                  >
                    {isLoading ? 'Tokenizing Card...' : 'Post Offer & Leave'}
                  </button>
                </div>

              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
