import React from 'react';

const MatchStatus = () => {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 font-sans">
      
      {/* The Header */}
      <div className="flex items-center justify-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Match Found!</h2>
      </div>

      {/* The Counterparty */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-center">
        <p className="text-blue-800 text-lg font-medium">
          Matching with: <span className="font-bold">Graciela</span> 
          <span className="inline-flex items-center ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ✓ Verified User
          </span>
        </p>
      </div>

      {/* The Mirror Math - Split Screen */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        
        {/* Left Side (Werner) */}
        <div className="flex-1 bg-gray-50 rounded-xl p-5 border border-gray-100 relative">
          <div className="absolute -top-3 left-4 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
            You
          </div>
          <p className="text-gray-500 text-sm font-medium mt-2">You Send</p>
          <p className="text-3xl font-extrabold text-gray-900 mb-4">$1,000.00 <span className="text-lg font-medium text-gray-500">USD</span></p>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Symmetri Fee</span>
              <span className="text-gray-900 font-semibold">$15.00 USD</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-gray-600 font-medium">Net Swapped</span>
              <span className="text-gray-900 font-semibold">$985.00 USD</span>
            </div>
          </div>
        </div>

        {/* The VS / Swap Icon in middle */}
        <div className="hidden md:flex items-center justify-center">
          <div className="bg-gray-100 rounded-full p-2">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>

        {/* Right Side (Graciela) */}
        <div className="flex-1 bg-emerald-50 rounded-xl p-5 border border-emerald-100 relative">
          <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
            Beneficiary
          </div>
          <p className="text-emerald-700 text-sm font-medium mt-2">Family Receives</p>
          <p className="text-3xl font-extrabold text-emerald-900 mb-4">19,700.00 <span className="text-lg font-medium text-emerald-700">MXN</span></p>
          
          <div className="border-t border-emerald-200 pt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-emerald-700 font-medium">Effective Rate</span>
              <span className="text-emerald-900 font-semibold">20.00 <span className="text-xs">MXN/USD</span></span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-emerald-700 font-medium">Speed</span>
              <span className="text-emerald-900 font-semibold">Instant (SPEI)</span>
            </div>
          </div>
        </div>

      </div>

      {/* The Action */}
      <button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-300">
        Authorize Swap
      </button>
      <p className="text-center text-xs text-gray-400 mt-4 font-medium tracking-wide border-t border-gray-100 pt-3">
        SECURED BY SYMMETRI ZERO-CUSTODY PROTOCOL
      </p>
    </div>
  );
};

export default MatchStatus;
