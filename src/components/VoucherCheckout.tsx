import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface VoucherCheckoutProps {
  voucherAmount: number;
  retailerName: string;
  onPurchase?: (methodId: string) => void;
}

export default function VoucherCheckout({ voucherAmount, retailerName, onPurchase }: VoucherCheckoutProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'ach' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Constants
  const cardFeePct = 0.029;
  const cardFixedFee = 0.30;
  
  // Dynamic Math
  const processorFee = selectedMethod === 'card' 
    ? (voucherAmount * cardFeePct) + cardFixedFee 
    : 0.00;
    
  const totalToPay = voucherAmount + processorFee;

  const handleExecutePurchase = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);
    
    try {
      // 1. Trigger Parent State if requested
      if (onPurchase) onPurchase(selectedMethod);

      // 2. Mock Ping to Partner Retailer API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate generation
      
      const generatedVoucherId = `v_${Date.now()}`;
      
      // 3. Immediate Redirect to Activity Ledger with Auto-Trigger Share params
      router.push(`/activity-ledger?autoOpen=${generatedVoucherId}&highlightShare=true`);
      
    } catch (error) {
      console.error("Voucher Generation Failed", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
        <p className="text-sm text-gray-500 mt-1">Select how you'd like to fund your {retailerName} voucher.</p>
      </div>

      {/* Payment Options (Clean List) */}
      <div className="space-y-4 mb-8">
        {/* Option 1: ACH */}
        <button
          onClick={() => setSelectedMethod('ach')}
          className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
            selectedMethod === 'ach' 
              ? 'border-indigo-600 bg-indigo-50/30' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${selectedMethod === 'ach' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block font-semibold text-gray-900">Bank Account (ACH)</span>
              <span className="block text-sm text-emerald-600 font-medium">$0.00 Processing Fee</span>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'ach' ? 'border-indigo-600' : 'border-gray-300'}`}>
            {selectedMethod === 'ach' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
          </div>
        </button>

        {/* Option 2: Card */}
        <button
          onClick={() => setSelectedMethod('card')}
          className={`w-full flex justify-between items-center p-4 rounded-xl border-2 transition-all ${
            selectedMethod === 'card' 
              ? 'border-indigo-600 bg-indigo-50/30' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-full ${selectedMethod === 'card' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="block font-semibold text-gray-900">Debit/Credit Card</span>
              <span className="block text-sm text-gray-500 font-medium">Processor fee applies (e.g., ${(voucherAmount * cardFeePct + cardFixedFee).toFixed(2)})</span>
            </div>
          </div>
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'card' ? 'border-indigo-600' : 'border-gray-300'}`}>
            {selectedMethod === 'card' && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
          </div>
        </button>
      </div>

      {/* Glass Box Fee Breakdown */}
      <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-xl p-5 space-y-3 mb-6">
        <div className="flex justify-between items-center text-gray-600">
          <span>{retailerName} Voucher Value</span>
          <span className="font-semibold text-gray-900">${voucherAmount.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center text-gray-600">
          <span>Processing Fee</span>
          <span className="font-semibold text-gray-900">
            {selectedMethod === null 
              ? '—' 
              : `$${processorFee.toFixed(2)}`
            }
          </span>
        </div>
        
        <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
          <span className="font-medium text-gray-800">Total You Pay</span>
          <span className="text-2xl font-bold text-gray-900">
            {selectedMethod === null 
              ? '—' 
              : `$${totalToPay.toFixed(2)}`
            }
          </span>
        </div>
      </div>

      {/* Action Button */}
      <button
        disabled={selectedMethod === null || isProcessing}
        onClick={handleExecutePurchase}
        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Generating Voucher...' : 'Purchase Voucher'}
      </button>

    </div>
  );
}
