import React, { useEffect } from 'react'

type CountryOption = {
  code: string
  name: string
}

type Props = {
  corridor: string
  rate?: number
  fromCountry: string
  toCountry: string
  availableFromCountries?: CountryOption[]
  availableToCountries?: CountryOption[]
  onFromCountryChange: (value: string) => void
  onToCountryChange: (value: string) => void
  onContinue: () => void
}

export default function CountrySelector({
  corridor,
  rate,
  fromCountry,
  toCountry,
  availableFromCountries = [],
  availableToCountries = [],
  onFromCountryChange,
  onToCountryChange,
  onContinue,
}: Props) {
  useEffect(() => {
    console.log('✅ CountrySelector mounted')
    console.log('✅ availableFromCountries:', availableFromCountries)
    console.log('✅ availableToCountries:', availableToCountries)
  }, [availableFromCountries, availableToCountries])

  const formattedRate = rate !== undefined ? `$${rate.toFixed(2)}/BRL` : null
  const inverseRate = rate !== undefined ? `BRL${(1 / rate).toFixed(2)}/$` : null

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Send via {corridor || '...'}</h3>

      <div className="bg-gray-50 p-4 rounded shadow-sm space-y-4">
        {rate !== undefined && (
          <p className="text-sm text-gray-600">
            💱 Market Rate: <strong>{formattedRate}</strong> or <strong>{inverseRate}</strong>
          </p>
        )}

        <div className="flex justify-between space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">From</label>
            <select
              value={fromCountry}
              onChange={e => onFromCountryChange(e.target.value)}
              className="mt-1 block w-full border rounded px-2 py-1"
            >
              <option value="">Select country</option>
              {availableFromCountries.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">To</label>
            <select
              value={toCountry}
              onChange={e => onToCountryChange(e.target.value)}
              className="mt-1 block w-full border rounded px-2 py-1"
              disabled={!fromCountry}
            >
              <option value="">Select country</option>
              {availableToCountries.map(({ code, name }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        disabled={!fromCountry || !toCountry}
        className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  )
}
