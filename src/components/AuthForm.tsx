import React, { useState } from 'react'

type Mode = 'signup' | 'signin'

type Props = {
  mode: Mode
  initialEmail?: string
  onSubmit: (payload: { name?: string; email: string; password: string }) => Promise<void> | void
  submitLabel?: string
  loading?: boolean
}

export default function AuthForm({ mode, initialEmail = '', onSubmit, submitLabel, loading = false }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isSignup = mode === 'signup'
  const label = submitLabel ?? (isSignup ? 'Create account' : 'Sign in')

  const validate = () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return false
    }
    if (!password || password.length < 8) {
      setError(isSignup ? 'Passwords must be at least 8 characters.' : 'Please enter your password.')
      return false
    }
    if (isSignup && !name.trim()) {
      setError('Please provide your full name.')
      return false
    }
    setError(null)
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: isSignup ? name.trim() : undefined, email: email.trim(), password })
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
      {isSignup && (
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Full name</span>
          <input
            aria-label="Full name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 block w-full rounded border px-3 py-2"
            required={isSignup}
          />
        </label>
      )}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Email</span>
        <input
          aria-label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mt-1 block w-full rounded border px-3 py-2"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Password</span>
        <div className="mt-1 relative">
          <input
            aria-label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full rounded border px-3 py-2"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
            aria-pressed={showPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {mode === 'signup' && (
          <p className="text-xs text-gray-500 mt-1">Use 8 or more characters for a stronger password.</p>
        )}
      </label>

      {error && (
        <div role="alert" className="text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          disabled={submitting || loading}
        >
          {submitting || loading ? `${label}…` : label}
        </button>

        {mode === 'signin' ? (
          <a href="/forgot-password" className="text-sm text-blue-600 underline">
            Forgot password?
          </a>
        ) : (
          <span className="text-sm text-gray-500">Already have an account? <a href="/signin" className="text-blue-600 underline">Sign in</a></span>
        )}
      </div>
    </form>
  )
}
