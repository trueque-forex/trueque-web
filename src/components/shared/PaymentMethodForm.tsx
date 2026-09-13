import React, { useState, useEffect } from 'react';
import PaymentsIcon from '@mui/icons-material/Payments';

export interface PaymentGateway {
  id: string;
  label: string;
  pct: number;
  fixed: number;
}

export interface PaymentData {
  methodId: string;
  accountHolderName: string;
  token?: string; // Secure token from processor
  maskedNumber?: string;
  // For banks
  routingNumber?: string; 
  accountNumber?: string;
}

interface PaymentMethodFormProps {
  gateways: PaymentGateway[];
  selectedMethodId?: string | null;
  initialData?: PaymentData | null;
  onMethodSelect: (methodId: string) => void;
  onDataChange: (isValid: boolean, data: PaymentData) => void;
}

export default function PaymentMethodForm({
  gateways,
  selectedMethodId,
  initialData,
  onMethodSelect,
  onDataChange,
}: PaymentMethodFormProps) {
  const [accountHolderName, setAccountHolderName] = useState(initialData?.accountHolderName || '');
  
  // Bank fields
  const [routingNumber, setRoutingNumber] = useState(initialData?.routingNumber || '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  
  // Mock Adyen Card State
  const [isCardVerified, setIsCardVerified] = useState(!!initialData?.token);
  
  useEffect(() => {
    // Validate based on method type
    let isValid = false;
    let data: PaymentData = { methodId: selectedMethodId as string, accountHolderName };

    if (selectedMethodId?.includes('card')) {
      // For cards, we need the secure token (simulated by isCardVerified) and name
      isValid = accountHolderName.length > 0 && isCardVerified;
      if (isValid) {
        data.token = "adyen_tok_" + Math.random().toString(36).substring(7);
        data.maskedNumber = "1234";
      }
    } else if (selectedMethodId === 'zelle') {
      isValid = accountHolderName.length > 0 && routingNumber.length > 0;
      if (isValid) {
        data.routingNumber = routingNumber;
      }
    } else {
      // For banks, we need routing and account
      isValid = accountHolderName.length > 0 && routingNumber.length > 0 && accountNumber.length > 0;
      if (isValid) {
        data.routingNumber = routingNumber;
        data.accountNumber = accountNumber;
        data.maskedNumber = accountNumber.slice(-4);
      }
    }
    
    onDataChange(isValid, data);
  }, [selectedMethodId, accountHolderName, routingNumber, accountNumber, isCardVerified]);

  return (
    <div className="space-y-3">
      {gateways.map((method) => (
        <div
          key={method.id}
          className={`border rounded-xl p-4 transition-colors ${
            selectedMethodId === method.id
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-gray-200 bg-white hover:border-blue-300'
          }`}
        >
          <div
            onClick={() => {
              onMethodSelect(method.id);
              setIsCardVerified(false); // Reset verification on switch
            }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="text-2xl">💳</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{method.label}</p>
              {(method.pct > 0 || method.fixed > 0) && (
                <div className="text-xs text-gray-500 flex items-center space-x-1">
                  <span>
                    {(() => {
                      if (method.id === 'debit_card') {
                        return `Fee: ${((method.pct + 0.005) * 100).toFixed(2)}% + $${method.fixed.toFixed(2)} (Includes 0.50% Liquidity Cost)`;
                      } else if (method.id === 'credit_card') {
                        return `Fee: ${((method.pct + 0.015) * 100).toFixed(2)}% + $${method.fixed.toFixed(2)} (Includes 1.50% Liquidity Cost)`;
                      }
                      return `Fee: ${(method.pct * 100).toFixed(2)}% ${method.fixed > 0 ? `+ $${method.fixed.toFixed(2)}` : ''}`;
                    })()}
                  </span>
                  {(method.id === 'debit_card' || method.id === 'credit_card') && (
                    <span 
                      className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold cursor-help"
                      title="Covers the cost of advancing funds instantly while the card network settles the transaction."
                    >
                      i
                    </span>
                  )}
                </div>
              )}
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethodId === method.id ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              {selectedMethodId === method.id && (
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>

          {selectedMethodId === method.id && (
            <div className="mt-4 pt-4 border-t border-blue-100 space-y-3 animate-fade-in-up">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              {method.id.includes('card') ? (
                <div className="space-y-3">
                  {/* Secure Tokenized Input Mock */}
                  <div className="border border-gray-300 bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-bl uppercase tracking-wider">
                      PCI Compliant iFrame
                    </div>
                    {!isCardVerified ? (
                      <>
                        <div className="w-full flex space-x-2">
                          <input type="text" placeholder="Card Number" className="w-full text-sm rounded border-gray-200 bg-white focus:ring-blue-500 focus:border-blue-500" />
                          <input type="text" placeholder="MM/YY" className="w-20 text-sm rounded border-gray-200 bg-white focus:ring-blue-500 focus:border-blue-500" />
                          <input type="text" placeholder="CVV" className="w-16 text-sm rounded border-gray-200 bg-white focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <button
                          onClick={() => setIsCardVerified(true)}
                          className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-black transition-colors"
                        >
                          Verify & Tokenize Card
                        </button>
                      </>
                    ) : (
                      <div className="w-full bg-white border border-green-200 rounded-lg p-3 flex items-center space-x-3 text-green-700">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">✅</div>
                        <div>
                          <p className="text-sm font-bold">Card Verified</p>
                          <p className="text-xs text-green-600">Secure token generated (•••• 1234)</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-white border border-blue-200 rounded-xl p-3 flex space-x-3 items-start">
                    <PaymentsIcon className="text-blue-600 mt-0.5" fontSize="small" />
                    <p className="text-xs text-blue-900 leading-relaxed">
                      <strong>Auth without Capture:</strong> Your card is securely verified and tokenized. You will <strong>not be charged</strong> until another user accepts your offer.
                    </p>
                  </div>
                </div>
              ) : method.id === 'zelle' ? (
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Zelle Email or Phone Number
                    </label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Routing Number / Identifier
                    </label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="000000000"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Account details..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
