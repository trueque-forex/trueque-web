import React from 'react';

export interface TransactionSummaryProps {
  amount: string;
  sourceCurrency: string;
  amountReceived: string;
  targetCurrency: string;
  beneficiaryName: string;
  fundingMethodName: string;
  symmetriFee: string;
  inboundFee?: string;
  outboundFee: string;
  additionalFees?: {label: string, amount: string}[];
  totalFees: string;
  effectiveRate: string;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  hideHeader?: boolean;
}

export default function TransactionSummary({
  amount,
  sourceCurrency,
  amountReceived,
  targetCurrency,
  beneficiaryName,
  fundingMethodName,
  symmetriFee,
  inboundFee,
  outboundFee,
  additionalFees,
  totalFees,
  effectiveRate,
  title = "Offer Summary",
  subtitle = "Review your terms before posting.",
  stepNumber,
  hideHeader = false,
}: TransactionSummaryProps) {
  const isFeeZero = (fee: string | undefined) => !fee || parseFloat(fee) === 0;

  const showSymmetriFee = !isFeeZero(symmetriFee);
  const showInboundFee = !isFeeZero(inboundFee);
  const showOutboundFee = !isFeeZero(outboundFee);
  const validAdditionalFees = additionalFees?.filter(f => !isFeeZero(f.amount)) || [];
  
  const showAnyFees = showSymmetriFee || showInboundFee || showOutboundFee || validAdditionalFees.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      {!hideHeader && (
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {stepNumber !== undefined && (
              <div className="flex flex-shrink-0 items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold border-2 border-blue-600">
                {stepNumber}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div><span className="text-gray-500">Offered Amount</span><br /><strong className="text-gray-900">${amount} {sourceCurrency}</strong></div>
          <div><span className="text-gray-500">Amount Wanted</span><br /><strong className="text-gray-900">${amountReceived} {targetCurrency}</strong></div>
          <div><span className="text-gray-500">Beneficiary</span><br /><strong className="text-gray-900">{beneficiaryName || '-'}</strong></div>
          <div><span className="text-gray-500">Funding Method</span><br /><strong className="text-gray-900">{fundingMethodName || '-'}</strong></div>
        </div>

        {showAnyFees && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Fee Breakdown</h4>
            {showSymmetriFee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Symmetri Platform Fee (1.5%)</span>
                <span className="font-medium text-gray-900">${symmetriFee}</span>
              </div>
            )}
            {showInboundFee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Funding Method Fee</span>
                <span className="font-medium text-gray-900">${inboundFee}</span>
              </div>
            )}
            {showOutboundFee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Outbound Delivery</span>
                <span className="font-medium text-gray-900">${outboundFee}</span>
              </div>
            )}
            {validAdditionalFees.map((fee, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{fee.label}</span>
                <span className="font-medium text-gray-900">${fee.amount}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
              <span className="text-gray-900">Total Fees</span>
              <span className="text-gray-900">${totalFees}</span>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-center">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-blue-900">Effective Exchange Rate</span>
            <span className="text-lg font-black text-blue-900">
              1 {sourceCurrency} = {effectiveRate} {targetCurrency}
            </span>
          </div>
          {parseFloat(amount) > 0 && parseFloat(totalFees) > 0 && (
            <div className="flex justify-between items-center mt-1 text-xs text-blue-700/80">
              <span>Total Cost Increase</span>
              <span className="font-semibold text-blue-800 bg-blue-100/50 px-2 py-0.5 rounded">
                + {((parseFloat(totalFees) / parseFloat(amount)) * 100).toFixed(2)}% from mid-market
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
