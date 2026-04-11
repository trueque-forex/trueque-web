import React from 'react';

interface AdjusterModalProps {
  isOpen: boolean;
  adjustedAmount: number;
  onSnapAndExecute: () => void;
  onClose: () => void;
}

export default function AdjusterModal({ isOpen, adjustedAmount, onSnapAndExecute, onClose }: AdjusterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 text-center space-y-6">
          
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-900">Partial Liquidity Available</h3>
            <p className="mt-2 text-gray-600">
              Instant liquidity is capped at <span className="font-bold text-gray-900">${adjustedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> right now.
            </p>
          </div>

          <button
            onClick={onSnapAndExecute}
            className="w-full inline-flex justify-center rounded-xl border border-transparent bg-amber-600 px-4 py-4 text-lg font-bold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors"
          >
            Snap to ${adjustedAmount.toLocaleString()} & Execute
          </button>
          
          <button
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Cancel Order
          </button>

        </div>
      </div>
    </div>
  );
}
