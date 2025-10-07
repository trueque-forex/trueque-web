import { useState } from 'react';

export default function BeneficiaryMethodHelper({ onMethodChange }) {
  const [methodType, setMethodType] = useState('');
  const [details, setDetails] = useState({});

  const handleTypeChange = (e) => {
    setMethodType(e.target.value);
    setDetails({});
    onMethodChange(''); // Clear parent value
  };

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...details, [name]: value };
    setDetails(updated);

    const formatted = formatMethod(methodType, updated);
    onMethodChange(formatted);
  };

  const formatMethod = (type, data) => {
    switch (type) {
      case 'phone':
        return `phone:${data.countryCode}-${data.number}`;
      case 'wallet':
        return `wallet:${data.address}`;
      case 'bank':
        return `bank:${data.bankName}:${data.accountNumber}`;
      case 'card':
        return `card:${data.issuer}:${data.cardNumber}`;
      default:
        return '';
    }
  };

  return (
    <div>
      <label>
        How will your beneficiary receive funds?
        <select value={methodType} onChange={handleTypeChange} required>
          <option value="">Select Method</option>
          <option value="phone">Phone (SMS or mobile money)</option>
          <option value="wallet">Wallet (crypto or digital)</option>
          <option value="bank">Bank Account</option>
          <option value="card">Card (prepaid or debit)</option>
        </select>
      </label>

      {methodType === 'phone' && (
        <>
          <label>
            Country Code:
            <input name="countryCode" onChange={handleDetailChange} required />
          </label>
          <label>
            Phone Number:
            <input name="number" onChange={handleDetailChange} required />
          </label>
        </>
      )}

      {methodType === 'wallet' && (
        <label>
          Wallet Address:
          <input name="address" onChange={handleDetailChange} required />
        </label>
      )}

      {methodType === 'bank' && (
        <>
          <label>
            Bank Name:
            <input name="bankName" onChange={handleDetailChange} required />
          </label>
          <label>
            Account Number:
            <input name="accountNumber" onChange={handleDetailChange} required />
          </label>
        </>
      )}

      {methodType === 'card' && (
        <>
          <label>
            Card Issuer:
            <input name="issuer" onChange={handleDetailChange} required />
          </label>
          <label>
            Card Number:
            <input name="cardNumber" onChange={handleDetailChange} required />
          </label>
        </>
      )}
    </div>
  );
}