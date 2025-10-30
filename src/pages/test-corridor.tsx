import React, { useState } from 'react'
import CountrySelector from '../components/CountrySelector'

type CountryOption = {
  code: string
  name: string
}

const allCountries: CountryOption[] = [
  { code: 'BR', name: 'Brazil' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ES', name: 'Spain' },
  { code: 'CO', name: 'Colombia' },
  { code: 'US', name: 'United States' },
  { code: 'MX', name: 'Mexico' },
  { code: 'GT', name: 'Guatemala' },
]

const corridors = [
  { from: 'BR', to: 'PT' },
  { from: 'AR', to: 'ES' },
  { from: 'AR', to: 'CO' },
  { from: 'BR', to: 'ES' },
  { from: 'BR', to: 'US' },
  { from: 'MX', to: 'US' },
  { from: 'MX', to: 'GT' },
]

export default function TestCorridor() {
  const [fromCountry, setFromCountry] = useState('')
  const [toCountry, setToCountry] = useState('')
  const [rate, setRate] = useState<number | undefined>(undefined)

  console.log('✅ allCountries in test-corridor:', allCountries)

  const getDestinationsForOrigin = (origin: string): CountryOption[] => {
    const validToCodes = corridors
      .filter(c => c.from === origin)
      .map(c => c.to)
    return allCountries.filter(c => validToCodes.includes(c.code))
  }

  const handleFromChange = (code: string) => {
    setFromCountry(code)
    setToCountry('')
    setRate(undefined)
  }

  const handleToChange = (code: string) => {
    setToCountry(code)
    const corridorKey = `${fromCountry}-${code}`
    const mockRates: Record<string, number> = {
      'BR-US': 0.18,
      'BR-PT': 0.21,
      'BR-ES': 0.19,
      'AR-ES': 0.22,
      'AR-CO': 0.15,
      'MX-US': 0.17,
      'MX-GT': 0.13,
    }
    setRate(mockRates[corridorKey])
  }

  const handleContinue = () => {
    alert(`Selected corridor: ${fromCountry} → ${toCountry}`)
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <CountrySelector
        corridor={fromCountry && toCountry ? `${fromCountry}-${toCountry}` : ''}
        rate={rate}
        fromCountry={fromCountry}
        toCountry={toCountry}
	availableFromCountries={[
	  { code: 'BR', name: 'Brazil' },
	  { code: 'AR', name: 'Argentina' },
	  { code: 'MX', name: 'Mexico' },
	]}
	availableToCountries={fromCountry ? 	getDestinationsForOrigin(fromCountry) : []}        	onFromCountryChange={handleFromChange}
        onToCountryChange={handleToChange}
        onContinue={handleContinue}
      />
    </div>
  )
}
