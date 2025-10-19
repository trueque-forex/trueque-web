import { useState, useEffect } from 'react'

type Rate = {
  from: string
  to: string
  rate: number
}

export default function ExchangePreview() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Replace with real fetch logic once backend is ready
    const fetchRates = async () => {
      setLoading(true)
      try {
        // Simulated data for now
        const mockRates: Rate[] = [
          { from: 'USD', to: 'MXN', rate: 17.23 },
          { from: 'EUR', to: 'USD', rate: 1.06 },
          { from: 'GBP', to: 'NGN', rate: 1532.45 },
        ]
        setRates(mockRates)
      } catch (error) {
        console.error('Failed to fetch rates:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [])

  return (
    <section className="bg-gray-100 p-6 rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Live Exchange Preview</h2>
      {loading ? (
        <p className="text-gray-600">Loading rates...</p>
      ) : (
        <ul className="space-y-2">
          {rates.map((rate, index) => (
            <li key={index} className="text-gray-800">
              {rate.from} → {rate.to}: <strong>{rate.rate.toFixed(2)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
