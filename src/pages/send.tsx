import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { generateTid } from '../utils/transaction'

export default function SendPage() {
  const router = useRouter()
  const [user, setUser] = useState<any | null>(null)
  const [tid, setTid] = useState('')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [form, setForm] = useState({
    fromCountry: '',
    toCountry: '',
    amount: '',
    deliveryMethod: '',
  })
  const [formError, setFormError] = useState('')

  const corridorRates: Record<string, number> = {
    'BR-ES': 0.18,
    'MX-ES': 0.052,
    'NG-ES': 0.0015,
    'GH-ES': 0.077,
  }

  const truequeFee = 0.52
  const transmitterFee = 0.25

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem('authToken')
      if (!token) {
        router.push('/signin')
        return
      }

      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          // If token invalid or profile fetch fails, redirect to signin
          router.push('/signin')
          return
        }

        const profile = await res.json()
        setUser(profile)
        // Generate a local display TID using the user's timezone
        setTid(generateTid('T'))
      } catch (err) {
        router.push('/signin')
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    const { fromCountry, toCountry, amount, deliveryMethod } = form

    if (!fromCountry || !toCountry || !amount || !deliveryMethod) {
      setFormError('❌ Please complete all fields.')
      return
    }

    const corridorKey = `${fromCountry}-${toCountry}`
    const marketRate = corridorRates[corridorKey]

    if (!marketRate) {
      setFormError('❌ Corridor not supported.')
      return
    }

    const amountSender = parseFloat(amount)
    if (Number.isNaN(amountSender) || amountSender <= 0) {
      setFormError('❌ Enter a valid amount.')
      return
    }

    const totalFees = truequeFee + transmitterFee
    const totalCost = amountSender + totalFees
    const recipientAmount = amountSender * marketRate
    const costIncrease = (totalFees / amountSender) * 100

    // Push only essential transaction preview data; do not pass user profile or authoritative TID via query
    router.push({
      pathname: '/preview',
      query: {
        from: fromCountry,
        to: toCountry,
        amountSender: amountSender.toFixed(2),
        delivery: deliveryMethod,
        marketRate: marketRate.toFixed(4),
        truequeFee: truequeFee.toFixed(2),
        transmitterFee: transmitterFee.toFixed(2),
        totalCost: totalCost.toFixed(2),
        recipientAmount: recipientAmount.toFixed(2),
        costIncrease: costIncrease.toFixed(2),
        // include display tid for convenience only (server should issue authoritative TID on submit)
        displayTid: tid,
      },
    })
  }

  if (loadingProfile) return null
  if (!user) return null

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">💸 Send Money</h1>
      <p>
        Welcome, {user.name || user.fullName || 'friend'}! Your Trueque ID is{' '}
        <strong>{user.truequeId || tid}</strong>
      </p>

      {formError && <p className="text-red-600 text-sm font-semibold">{formError}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <select
          name="fromCountry"
          value={form.fromCountry}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">From Country</option>
          <option value="BR">Brazil</option>
          <option value="MX">Mexico</option>
          <option value="NG">Nigeria</option>
          <option value="GH">Ghana</option>
        </select>

        <select
          name="toCountry"
          value={form.toCountry}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">To Country</option>
          <option value="ES">Spain</option>
        </select>

        <input
          name="amount"
          type="number"
          placeholder="Amount in sender currency"
          value={form.amount}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <select
          name="deliveryMethod"
          value={form.deliveryMethod}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">Delivery Method</option>
          <option value="bank">Bank Deposit</option>
          <option value="cash">Cash Pickup</option>
          <option value="wallet">Mobile Wallet</option>
        </select>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Preview Transaction
        </button>
      </form>
    </main>
  )
}
