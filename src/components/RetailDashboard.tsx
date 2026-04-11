import React, { useState } from 'react';

interface RetailDashboardProps {
  onSelectionChange: (selection: string | null) => void;
}

export default function RetailDashboard({ onSelectionChange }: RetailDashboardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    onSelectionChange(optionId);
  };

  const options = [
    {
      id: 'soriana',
      label: 'Purchase Soriana Voucher',
      details: 'Instant QR Code generation at checkout. Sent directly via SMS.',
      fee: '$0.00 Fee',
      badge: 'Zero-Fee Retail Swap'
    },
    {
      id: 'chedraui',
      label: 'Send Chedraui Store Credit',
      details: 'Directly fund a Chedraui Wallet payload for family groceries.',
      fee: '$0.00 Fee',
      badge: '100% Value Pass-Through'
    },
    {
      id: 'bodega',
      label: 'Purchase Bodega Aurrera Credit',
      details: 'Digital redemption code valid at all Bodega Aurrera locations.',
      fee: '$0.00 Fee',
      badge: 'Immediate Delivery'
    }
  ];

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Select Retail Destination</h2>
        <p className="text-sm text-gray-500 mt-2">Choose an instant digital store credit option for your recipient.</p>
      </div>

      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => handleSelect(option.id)}
          className={`flex flex-col p-4 border-2 rounded-xl text-left transition-all duration-200 ${
            selectedOption === option.id 
              ? 'border-indigo-600 bg-indigo-50 shadow-md transform scale-[1.02]' 
              : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm bg-white'
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <h3 className="font-semibold text-lg text-gray-900">{option.label}</h3>
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
              {option.fee}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">{option.details}</p>
          <div className="mt-3 inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-100/50 px-2.5 py-1 rounded-full w-fit">
            ✓ {option.badge}
          </div>
        </button>
      ))}

      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-xs text-gray-500 flex items-start gap-2">
        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Phase 1 exclusively supports E-commerce digital vouchers. Direct transmission features are unavailable in this interface.</p>
      </div>
    </div>
  );
}
