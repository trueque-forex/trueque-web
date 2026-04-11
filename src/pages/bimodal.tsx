import React, { useState } from 'react';
import Head from 'next/head';
import { usePersona } from '@/context/PersonaContext';
import RetailDashboard from '@/components/RetailDashboard';
import BusinessDashboard from '@/components/BusinessDashboard';
import AdjusterModal from '@/components/AdjusterModal';

export default function BimodalSwapInterface() {
  const { userPersona, setPersona } = usePersona();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Modal State
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);
  const [adjustedAmount, setAdjustedAmount] = useState(0);

  const handleSelectionChange = (selection: string | null) => {
    setSelectedOption(selection);
  };

  const attemptBusinessSwap = (amount: number) => {
    // Mocking an API response where liquidity is capped at $4,000 for demo purposes
    const MOCK_LIQUIDITY_CAP = 4000;
    
    if (amount > MOCK_LIQUIDITY_CAP) {
      setAdjustedAmount(MOCK_LIQUIDITY_CAP);
      setIsAdjusterOpen(true);
    } else {
      alert(`Successfully executed ${amount} swap!`);
    }
  };

  const executeSnapSwap = () => {
    setIsAdjusterOpen(false);
    alert(`Successfully snapped to and executed ${adjustedAmount} swap!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-12 pb-24 items-center">
      <Head>
        <title>Symmetri Bimodal UI</title>
      </Head>

      {/* Demo Persona Toggle Box */}
      <div className="mb-10 w-full max-w-sm flex bg-white border border-gray-200 rounded-full p-1 shadow-sm">
        <button
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            userPersona === 'RETAIL' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => {
            setPersona('RETAIL');
            setSelectedOption(null); // Reset choice actively
          }}
        >
          Phase 1: Retail
        </button>
        <button
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            userPersona === 'BUSINESS' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => {
            setPersona('BUSINESS');
            setSelectedOption(null);
          }}
        >
          Phase 2: Business
        </button>
      </div>

      {/* Bimodal View Loader */}
      <div className="w-full px-4">
        {userPersona === 'RETAIL' ? (
          <RetailDashboard onSelectionChange={handleSelectionChange} />
        ) : (
          <BusinessDashboard 
            onSelectionChange={handleSelectionChange} 
            onAttemptSwap={attemptBusinessSwap} 
          />
        )}
      </div>

      {/* Global Continue Action (Only shown for Retail since Business handles its own Execute) */}
      {userPersona === 'RETAIL' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-center z-40">
          <button
            disabled={!selectedOption}
            onClick={() => alert(`Continuing with choice: ${selectedOption}`)}
            className="w-full max-w-md bg-indigo-600 text-white text-lg font-bold py-4 px-4 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            Continue
          </button>
        </div>
      )}

      {/* Adjuster Modal Fallback Engine */}
      <AdjusterModal
        isOpen={isAdjusterOpen}
        adjustedAmount={adjustedAmount}
        onSnapAndExecute={executeSnapSwap}
        onClose={() => setIsAdjusterOpen(false)}
      />

    </div>
  );
}
