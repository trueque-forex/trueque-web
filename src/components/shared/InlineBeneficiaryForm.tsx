import React, { useState } from 'react';
import { Contacts } from '@capacitor-community/contacts';

export interface InlineBeneficiaryFormProps {
  targetCurrency: string;
  onSuccess: (savedBeneficiary: any) => void;
  onCancel: () => void;
}

export default function InlineBeneficiaryForm({ targetCurrency, onSuccess, onCancel }: InlineBeneficiaryFormProps) {
  const [newBenName, setNewBenName] = useState('');
  const [newBenPhone, setNewBenPhone] = useState('');
  const [newBenMethod, setNewBenMethod] = useState('bank_rtp');
  const [newBenBank, setNewBenBank] = useState('');
  const [newBenAccount, setNewBenAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickContact = async () => {
    try {
      if (typeof window !== 'undefined' && !window.hasOwnProperty('Capacitor')) {
         alert("Contact picking is only available on the native mobile app.");
         return;
      }
      const permission = await Contacts.requestPermissions();
      if (permission.contacts === 'granted') {
        const result = await Contacts.pickContact({ projection: { name: true, phones: true } });
        if (result && result.contact) {
          const contact = result.contact;
          setNewBenName(contact.name?.display || '');
          setNewBenPhone(contact.phones?.[0]?.number || '');
        }
      } else {
        alert("Contacts permission denied.");
      }
    } catch (e) {
      console.warn("Contacts API not available, falling back to manual entry", e);
      alert("Contacts feature is not supported in this environment.");
    }
  };

  const handleSaveNewBeneficiary = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBenName,
          method: newBenMethod,
          country: targetCurrency === 'MXN' ? 'MX' : 'GT',
          identifiers: {
            phone_number: newBenPhone,
            ...(newBenMethod !== 'retail_voucher' ? {
              bank_name: newBenBank,
              account_number: newBenAccount,
            } : {}),
            account_type: newBenMethod === 'retail_voucher' ? 'voucher' : (newBenMethod.includes('card') || newBenMethod === 'visa_direct' ? 'card' : 'bank')
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to save beneficiary');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border border-blue-200 rounded-xl bg-blue-50/30 space-y-4">
      {errorMsg && <div className="text-red-500 text-sm font-semibold">{errorMsg}</div>}
      
      <button 
        onClick={handlePickContact} 
        className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50"
      >
        📱 Choose from Contacts
      </button>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" value={newBenName} onChange={e => setNewBenName(e.target.value)} className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Maria Lopez" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
          <input type="text" value={newBenPhone} onChange={e => setNewBenPhone(e.target.value)} className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="+52 123 456 7890" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Method</label>
          <select value={newBenMethod} onChange={e => setNewBenMethod(e.target.value)} className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500">
            <option value="bank_rtp">Bank Deposit</option>
            <option value="visa_direct">Debit Card (Push)</option>
            <option value="retail_voucher">Retail Voucher (Phone Only)</option>
          </select>
        </div>
        
        {newBenMethod === 'visa_direct' ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" value={newBenAccount} onChange={e => setNewBenAccount(e.target.value)} className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="•••• •••• •••• ••••" />
            </div>
            {/* Minimal card details for push, maybe CVV/Expiry is not heavily required for receiving, but keeping for consistency if backend uses it */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Expiry (MM/YY)</label>
                <input type="text" className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="MM/YY" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">CVV</label>
                <input type="text" className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="123" />
              </div>
            </div>
          </>
        ) : newBenMethod === 'retail_voucher' ? null : (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name / Identifier</label>
              <input type="text" value={newBenBank} onChange={e => setNewBenBank(e.target.value)} className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="BBVA Bancomer" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Number / CLABE</label>
              <input type="text" value={newBenAccount} onChange={e => setNewBenAccount(e.target.value)} className="w-full text-sm rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="012345678901234567" />
            </div>
          </>
        )}

        <div className="flex space-x-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors">Cancel</button>
          <button onClick={handleSaveNewBeneficiary} disabled={isLoading || !newBenName || (newBenMethod !== 'retail_voucher' && !newBenAccount) || (newBenMethod === 'retail_voucher' && !newBenPhone)} className="flex-1 py-2 text-white bg-blue-600 rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors">
            {isLoading ? 'Saving...' : 'Save Beneficiary'}
          </button>
        </div>
      </div>
    </div>
  );
}
