'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await signUp(email, password)
    if (error) { setError(error.message); setLoading(false) }
    else { setSuccess(true); setLoading(false); setTimeout(() => router.push('/login'), 2000) }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-surface-0 flex items-center justify-center px-6">
        <div className="text-center animate-fade-in">
          <h2 className="text-headline text-text-primary mb-2">Account created</h2>
          <p className="text-sm text-text-secondary">Check your email to confirm. Redirecting...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-surface-0 flex items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <button onClick={() => router.push('/')} className="text-accent text-xl font-extrabold tracking-tight">HOOPMARKET</button>
          <h1 className="text-headline text-text-primary mt-6">Sign up</h1>
          <p className="text-sm text-text-secondary mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-label text-text-tertiary uppercase mb-2 block">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
              placeholder="you@email.com" />
          </div>
          <div>
            <label htmlFor="password" className="text-label text-text-tertiary uppercase mb-2 block">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
              placeholder="••••••••" />
            <p className="text-xs text-text-tertiary mt-1">Min 6 characters</p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-label text-text-tertiary uppercase mb-2 block">Confirm Password</label>
            <input id="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary"
              placeholder="••••••••" />
          </div>

          {error && (
            <div className="bg-negative/10 border border-negative/20 rounded-xl p-3 text-negative text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent-dim transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-tertiary mt-6">
          Have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-accent hover:underline">Log in</button>
        </p>
        <p className="text-center mt-3">
          <button onClick={() => router.push('/')} className="text-xs text-text-tertiary hover:text-text-secondary transition-colors">Back to home</button>
        </p>
      </div>
    </main>
  )
}
