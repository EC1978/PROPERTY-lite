'use client'

import Link from 'next/link'
import { useState, useTransition, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { verifyTotp } from '@/app/auth/actions'
import toast from 'react-hot-toast'
import React, { Suspense } from 'react'

function Verify2FAForm() {
    const searchParams = useSearchParams()
    const factorId = searchParams.get('factorId') ?? ''
    const challengeId = searchParams.get('challengeId') ?? ''

    const [code, setCode] = useState('')
    const [isPending, startTransition] = useTransition()
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length !== 6) {
            toast.error('Voer een 6-cijferige code in.')
            return
        }

        const formData = new FormData()
        formData.append('factorId', factorId)
        formData.append('challengeId', challengeId)
        formData.append('code', code)

        startTransition(async () => {
            const result = await verifyTotp(formData)
            if (result?.error) {
                toast.error(result.error)
                setCode('')
            }
        })
    }

    return (
        <div className="bg-background-dark font-display text-white min-h-screen flex flex-col relative overflow-hidden antialiased selection:bg-primary selection:text-black">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-[#000]"></div>
                <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full premium-blur opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full premium-blur opacity-50"></div>
            </div>

            {/* Header */}
            <header className="relative z-20 w-full px-6 py-8 flex justify-between items-center max-w-[480px] mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-800 flex items-center justify-center shadow-[0_0_10px_rgba(16,183,127,0.2)]">
                        <span className="material-symbols-outlined text-black font-bold text-lg">graphic_eq</span>
                    </div>
                    <span className="text-white text-sm font-bold tracking-tight">VoiceRealty AI</span>
                </div>
                <Link href="/login" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
                    Annuleren
                </Link>
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12 w-full max-w-[480px] mx-auto">
                <div className="w-full glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 relative">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>security</span>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-black" style={{ fontSize: '10px' }}>lock</span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">2-Staps Verificatie</h1>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed">
                            Open je Authenticator-app en voer de 6-cijferige code in om door te gaan.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-[0.15em]">Verificatiecode</label>
                            <div className="relative group">
                                <input
                                    ref={inputRef}
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                    className="w-full bg-[#0a0c0b]/60 border border-white/5 rounded-2xl px-5 h-20 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300 text-center text-3xl font-mono tracking-[0.5em] disabled:opacity-50"
                                    placeholder="000000"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                            <p className="text-center text-[10px] text-gray-600 tracking-wider">
                                {code.length}/6 cijfers
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isPending || code.length !== 6}
                            className="mt-4 w-full h-16 bg-primary hover:bg-emerald-400 active:scale-[0.98] rounded-2xl text-black font-extrabold text-base shadow-[0_10px_25px_rgba(16,183,127,0.15)] hover:shadow-[0_15px_35px_rgba(16,183,127,0.3)] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                    <span>Verifiëren...</span>
                                </>
                            ) : (
                                <>
                                    <span>Code bevestigen</span>
                                    <span className="material-symbols-outlined font-bold" style={{ fontSize: '20px' }}>verified</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                        <p className="text-xs text-gray-500 text-center leading-relaxed">
                            <span className="material-symbols-outlined align-middle mr-1" style={{ fontSize: '14px' }}>info</span>
                            Geen toegang meer tot je Authenticator-app?{' '}
                            <Link href="/support" className="text-primary/80 hover:text-primary transition-colors font-semibold">
                                Neem contact op
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default function Verify2FAPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#000] flex items-center justify-center"><span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
            <Verify2FAForm />
        </Suspense>
    )
}
