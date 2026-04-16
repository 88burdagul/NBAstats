'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function EmailGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (localStorage.getItem('hm_gate_v1')) setUnlocked(true)
    setChecking(false)
  }, [])

  useEffect(() => {
    if (!checking && !unlocked) setTimeout(() => inputRef.current?.focus(), 150)
  }, [checking, unlocked])

  const unlock = () => {
    setExiting(true)
    localStorage.setItem('hm_gate_v1', '1')
    setTimeout(() => setUnlocked(true), 700)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.')
      return
    }
    setLoading(true)
    setError('')

    try {
      await supabase.from('EMAILS').insert({ text: email })
    } catch (_) {
      // Don't block access on DB error
    }

    unlock()
  }

  if (checking) return <div className="fixed inset-0 z-[10000] bg-[#0A0A0B]" />
  if (unlocked) return <>{children}</>

  return (
    <>
      <div className="invisible pointer-events-none">{children}</div>

      <div
        className="fixed inset-0 z-[10000] bg-[#0A0A0B] flex flex-col select-none"
        style={{
          transition: 'opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: exiting ? 0 : 1,
          pointerEvents: exiting ? 'none' : 'auto',
        }}
      >
        {/* Top rule */}
        <div className="h-px bg-[#1A1A1D]" />

        {/* Logo */}
        <div className="flex items-center justify-center py-5">
          <span className="text-[#FF6B00] text-xs font-extrabold tracking-[0.25em]">HOOPMARKET</span>
        </div>

        <div className="h-px bg-[#1A1A1D]" />

        {/* Main */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="text-center mb-12">
            <h1
              className="text-[#F5F5F7] font-extrabold leading-[0.88] tracking-[-0.04em] uppercase mb-8"
              style={{ fontSize: 'clamp(3.5rem, 16vw, 10rem)' }}
            >
              EVERY<br />PLAYER.<br />
              <span className="text-accent-gradient">RATED.</span>
            </h1>

            <div className="flex items-center justify-center gap-3">
              <div className="h-px bg-[#1A1A1D] flex-1 max-w-[50px]" />
              <p className="text-[#5A5A5E] text-[9px] tracking-[0.3em] uppercase font-mono">
                Enter your email to access
              </p>
              <div className="h-px bg-[#1A1A1D] flex-1 max-w-[50px]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-[360px] space-y-3">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              placeholder="your@email.com"
              autoComplete="email"
              spellCheck={false}
              className="w-full bg-transparent border border-[#2A2A2E] text-[#F5F5F7] text-sm tracking-wide placeholder:text-[#3A3A3F] px-4 py-4 rounded-xl focus:outline-none focus:border-[#FF6B00] transition-colors duration-200"
            />

            {error && (
              <p className="text-[#FF3B30] text-xs">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B00] text-white font-semibold text-sm tracking-wide py-4 rounded-xl transition-all duration-200 hover:bg-[#CC5500] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex gap-1.5">
                  <span className="animate-pulse">·</span>
                  <span className="animate-pulse" style={{ animationDelay: '150ms' }}>·</span>
                  <span className="animate-pulse" style={{ animationDelay: '300ms' }}>·</span>
                </span>
              ) : 'Get Access'}
            </button>

            <p className="text-center text-[#3A3A3F] text-[10px] tracking-wider pt-1">
              No spam — just early access.
            </p>
          </form>
        </div>

        <div className="h-px bg-[#1A1A1D]" />

        {/* Ticker */}
        <div className="py-3 overflow-hidden">
          <div className="ticker-content text-[#1A1A1D] text-[9px] font-mono tracking-[0.2em] whitespace-nowrap">
            {'HOOPMARKET · NBA PLAYER INTELLIGENCE · EVERY PLAYER RATED · '.repeat(8)}
          </div>
        </div>

        <div className="h-px bg-[#1A1A1D]" />
      </div>
    </>
  )
}
