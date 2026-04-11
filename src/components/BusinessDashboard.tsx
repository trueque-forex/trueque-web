import React, { useState } from 'react';

interface BusinessDashboardProps {
  onSelectionChange: (selection: string | null) => void;
  onAttemptSwap: (amount: number) => void;
}

export default function BusinessDashboard({ onSelectionChange, onAttemptSwap }: BusinessDashboardProps) {
  const [amount, setAmount] = useState<string>('5000');

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    // Any valid input constitutes an active state for the global Continue/Swap flow
    if (e.target.value && Number(e.target.value) > 0) {
      onSelectionChange('business_swap_intent');
    } else {
      onSelectionChange(null);
    }
  };

  const parsedAmount = Number(amount) || 0;
  const blendedFee = parsedAmount * 0.01;
  const midMarketRate = 20.00;
  const targetPayout = parsedAmount * midMarketRate;

  return (
    <div className="flex flex-col space-y-6 w-full max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Execute OTC Swap</h2>
        <p className="text-sm text-gray-500 mt-1">Institutional routing with dynamic 1.0% blended fee</p>
      </div>

      <div className="space-y-4">
        {/* Input Block */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (USD)</label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-lg font-medium">$</span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              className="block w-full rounded-xl border-gray-300 pl-8 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-2xl py-3 shadow-inner bg-gray-50"
              placeholder="0.00"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">USD</span>
            </div>
          </div>
        </div>

        {/* Real-time Math Display */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Execution Rate</span>
            <span className="font-semibold text-gray-900">{midMarketRate.toFixed(2)} Mid-Market</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Blended OTC Fee (1.0%)</span>
            <span className="font-semibold text-red-600">${blendedFee.toFixed(2)}</span>
          </div>
          <div className="pt-3 border-t border-slate-200 flex justify-between">
            <span className="text-sm font-medium text-gray-700">Target Payout</span>
            <span className="text-lg font-bold text-emerald-600">{targetPayout.toLocaleString(undefined, { minimumFractionDigits: 2 })} MXN</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onAttemptSwap(parsedAmount)}
        disabled={parsedAmount <= 0}
        className="w-full bg-indigo-600 text-white text-lg font-bold py-4 px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        Execute Swap
      </button>
    </div>
  );
}
