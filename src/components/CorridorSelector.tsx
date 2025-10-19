import { useState, useEffect } from 'react'

type Country = {
  name: string
  iso: string // ISO 3166-1 numeric
  flag: string
}

type Corridor = {
  name: string
  code: string // Internal corridor code
  targetIso: string
}

const countries: Country[] = [
  { name: 'Brazil', iso: '076', flag: '🇧🇷' },
  { name: 'Argentina', iso: '032', flag: '🇦🇷' },
  { name: 'Mexico', iso: '484', flag: '🇲🇽' },
  { name: 'Colombia', iso: '170', flag: '🇨🇴' },
  { name: 'Venezuela', iso: '862', flag: '🇻🇪' },
  { name: 'Spain', iso: '724', flag: '🇪🇸' },
  { name: 'Portugal', iso: '620', flag: '🇵🇹' },
  { name: 'United States', iso: '840', flag: '🇺🇸' },
  { name: 'Nigeria', iso: '566', flag: '🇳🇬' },
  { name: 'Ghana', iso: '288', flag: '🇬🇭' },
  { name: 'Guatemala', iso: '320', flag: '🇬🇹' },
  { name: 'Ecuador', iso: '218', flag: '🇪🇨' },
]

const corridorMap: Record<string, Corridor[]> = {
  '076': [
    { name: 'Send to United States', code: '01', targetIso: '840' },
    { name: 'Send to Mexico', code: '02', targetIso: '484' },
    { name: 'Send to Spain', code: '03', targetIso: '724' },
    { name: 'Send to Portugal', code: '04', targetIso: '620' },
  ],
  '032': [
    { name: 'Send to Spain', code: '05', targetIso: '724' },
  ],
  '484': [
    { name: 'Send to United States', code: '06', targetIso: '840' },
    { name: 'Send to Spain', code: '07', targetIso: '724' },
  ],
  '170': [
    { name: 'Send to Spain', code: '08', targetIso: '724' },
    { name: 'Send to Ecuador', code: '09', targetIso: '218' },
  ],
  '862': [
    { name: 'Send to Colombia', code: '10', targetIso: '170' },
  ],
  '724': [
    { name: 'Send to Brazil', code: '11', targetIso: '076' },
    { name: 'Send to Argentina', code: '12', targetIso: '032' },
    { name: 'Send to Mexico', code: '13', targetIso: '484' },
    { name: 'Send to Colombia', code: '14', targetIso: '170' },
  ],
  '566': [
    { name: 'Send to Ghana', code: '15', targetIso: '288' },
  ],
  '288': [
    { name: 'Send to Nigeria', code: '16', targetIso: '566' },
  ],
  '840': [
    { name: 'Send to Mexico', code: '17', targetIso: '484' },
  ],
  '320': [
    { name: 'Send to Mexico', code: '18', targetIso: '484' },
  ],
}

export default function CorridorSelector({
  onSelect,
}: {
  onSelect: (params: {
    fromIso: string
    toIso: string
    corridorCode: string
  }) => void
}) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [availableCorridors, setAvailableCorridors] = useState<Corridor[]>([])
  const [selectedCorridor, setSelectedCorridor] = useState<Corridor | null>(null)

  useEffect(() => {
    if (selectedCountry) {
      setAvailableCorridors(corridorMap[selectedCountry.iso] || [])
      setSelectedCorridor(null)
    }
  }, [selectedCountry])

  const handleConfirm = () => {
    if (selectedCountry && selectedCorridor) {
      onSelect({
        fromIso: selectedCountry.iso,
        toIso: selectedCorridor.targetIso,
        corridorCode: selectedCorridor.code,
      })
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        Select your country:
        <select
          value={selectedCountry?.iso || ''}
          onChange={(e) =>
            setSelectedCountry(
              countries.find((c) => c.iso === e.target.value) || null
            )
          }
          className="mt-1 block w-full border rounded px-2 py-1"
        >
          <option value="">-- Choose a country --</option>
          {countries.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </label>

      {availableCorridors.length > 0 && (
        <label className="block">
          Select a corridor:
          <select
            value={selectedCorridor?.code || ''}
            onChange={(e) =>
              setSelectedCorridor(
                availableCorridors.find((corr) => corr.code === e.target.value) || null
              )
            }
            className="mt-1 block w-full border rounded px-2 py-1"
          >
            <option value="">-- Choose a corridor --</option>
            {availableCorridors.map((corr) => (
              <option key={corr.code} value={corr.code}>
                {corr.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selectedCountry || !selectedCorridor}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Confirm Corridor
      </button>
    </div>
  )
}
