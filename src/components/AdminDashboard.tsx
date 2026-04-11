import React, { useState } from 'react';

export default function AdminDashboard() {
  // Mock internal reporting state to demonstrate Phase 1 Ledger Logic
  const [metrics] = useState({
    totalVolumeProcessed: 1250000.00, // $1.25M USD Volume
    wholesaleMarginCaptured: 187500.00, // 15% aggregate mock margin
    activeVoucherSwaps: 1420
  });

  const recentTransactions = [
    {
      id: 'tx_auth_1092',
      date: '2026-04-04 14:32:00',
      principal: 100.00,
      senderFee: 0.00,
      retailer: 'Soriana',
      discountPct: 0.15,
      symmetriMargin: 15.00,
      status: 'API_GENERATED'
    },
    {
      id: 'tx_auth_1093',
      date: '2026-04-04 14:35:10',
      principal: 50.00,
      senderFee: 0.00,
      retailer: 'Chedraui',
      discountPct: 0.10,
      symmetriMargin: 5.00,  
      status: 'API_GENERATED'
    },
    {
      id: 'tx_auth_1094',
      date: '2026-04-04 14:41:22',
      principal: 200.00,
      senderFee: 0.00,
      retailer: 'Bodega Aurrera',
      discountPct: 0.12,
      symmetriMargin: 24.00,
      status: 'API_GENERATED'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Symmetri Ops Center</h1>
            <p className="text-gray-500 mt-1">Phase 1 B2B Margin Tracking</p>
          </div>
          <div className="px-4 py-2 bg-emerald-100 text-emerald-800 text-sm font-bold rounded-lg shadow-sm border border-emerald-200">
            System Status: Nominal
          </div>
        </div>

        {/* Global Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Volume Processed</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">${metrics.totalVolumeProcessed.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-sm text-gray-400">Zero-Fee Retail Swaps</p>
          </div>

          <div className="bg-indigo-600 p-6 rounded-2xl shadow-md border border-indigo-500 text-white transform hover:-translate-y-1 transition duration-200">
            <h3 className="text-sm font-medium text-indigo-200 uppercase tracking-wider flex items-center justify-between">
              Wholesale Margin Captured
              <svg className="w-5 h-5 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </h3>
            <p className="mt-2 text-3xl font-bold">${metrics.wholesaleMarginCaptured.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-sm text-indigo-200">Corporate Ledger Credit</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Voucher Swaps</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{metrics.activeVoucherSwaps.toLocaleString()}</p>
            <p className="mt-1 text-sm text-emerald-600 font-medium">99.8% API Success Rate</p>
          </div>
        </div>

        {/* Ledger Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
             <h3 className="text-lg font-semibold text-gray-800">Recent API Executions (Corporate Ledger)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left align-middle text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Target Principal</th>
                  <th className="px-6 py-4">US Sender Fee</th>
                  <th className="px-6 py-4">Discount B2B</th>
                  <th className="px-6 py-4 text-right text-indigo-700">Symmetri Gross Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{tx.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                       <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                         {tx.retailer}
                       </div>
                    </td>
                    <td className="px-6 py-4">${tx.principal.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">${tx.senderFee.toFixed(2)}</td>
                    <td className="px-6 py-4">{(tx.discountPct * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600 bg-indigo-50/30">
                      ${tx.symmetriMargin.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
