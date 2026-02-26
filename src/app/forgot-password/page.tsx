'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { forgotPassword } from '@/app/auth/actions'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
    const [sent, setSent] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (formData: FormData) => {
        console.log('Form submission started...')
        startTransition(async () => {
            const result = await forgotPassword(formData)
            if (result?.error) {
                console.error('Action returned error:', result.error)
                toast.error(result.error)
            } else {
                console.log('Action success, showing check inbox state')
                setSent(true)
                toast.success('Herstelmail verstuurd!')
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
                    Terug naar login
                </Link>
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12 w-full max-w-[480px] mx-auto">
                <div className="w-full glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    {!sent ? (
                        <>
                            <div className="text-center mb-10">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>lock_reset</span>
                                </div>
                                <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Wachtwoord vergeten?</h1>
                                <p className="text-gray-400 text-sm font-medium leading-relaxed">
                                    Voer je e-mailadres in. We sturen je een herstellink waarmee je een nieuw wachtwoord kunt instellen.
                                </p>
                            </div>

                            <form action={handleSubmit} className="flex flex-col gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-[0.15em]">E-mailadres</label>
                                    <div className="relative group">
                                        <input
                                            name="email"
                                            className="w-full bg-[#0a0c0b]/60 border border-white/5 rounded-2xl px-5 h-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300 font-normal"
                                            placeholder="agent@voicerealty.ai"
                                            type="email"
                                            required
                                        />
                                        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-300" style={{ fontSize: '22px' }}>mail</span>
                                    </div>
                                </div>

                                <button
                                    disabled={isPending}
                                    className="mt-4 w-full h-16 bg-primary hover:bg-emerald-400 active:scale-[0.98] rounded-2xl text-black font-extrabold text-base shadow-[0_10px_25px_rgba(16,183,127,0.15)] hover:shadow-[0_15px_35px_rgba(16,183,127,0.3)] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? (
                                        <>
                                            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                            <span>Verzenden...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Stuur herstelmail</span>
                                            <span className="material-symbols-outlined font-bold" style={{ fontSize: '20px' }}>send</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>mark_email_read</span>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-white mb-3">Check je inbox!</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8">
                                Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een herstellink.
                                Controleer ook je spam-map.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-emerald-400 transition-colors"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                                Terug naar login
                            </Link>
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm font-medium">
                            Weet je het wachtwoord weer?{' '}
                            <Link className="text-white hover:text-primary font-bold transition-all border-b border-white/20 hover:border-primary" href="/login">
                                Inloggen
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    )
}
