'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { resetPassword } from '@/app/auth/actions'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [isPending, startTransition] = useTransition()

    const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
    const strengthLabel = ['', 'Zwak', 'Redelijk', 'Sterk']
    const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-primary']

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (password !== confirm) {
            toast.error('Wachtwoorden komen niet overeen.')
            return
        }
        if (password.length < 8) {
            toast.error('Wachtwoord moet minimaal 8 karakters bevatten.')
            return
        }

        const formData = new FormData()
        formData.append('password', password)

        startTransition(async () => {
            const result = await resetPassword(formData)
            if (result?.error) {
                toast.error(result.error)
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
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12 w-full max-w-[480px] mx-auto">
                <div className="w-full glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    <div className="text-center mb-10">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>key</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Nieuw wachtwoord</h1>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed">
                            Kies een sterk wachtwoord van minimaal 8 karakters.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {/* New password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-[0.15em]">Nieuw Wachtwoord</label>
                            <div className="relative group" suppressHydrationWarning>
                                <input
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-[#0a0c0b]/60 border border-white/5 rounded-2xl px-5 h-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300 font-normal pr-14"
                                    placeholder="••••••••"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    suppressHydrationWarning
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                                        {showPassword ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                            {/* Strength bar */}
                            {password.length > 0 && (
                                <div className="flex items-center gap-2 px-1 mt-1">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength ? strengthColor[passwordStrength] : 'bg-white/10'}`}
                                            />
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${passwordStrength === 1 ? 'text-red-400' : passwordStrength === 2 ? 'text-yellow-400' : 'text-primary'}`}>
                                        {strengthLabel[passwordStrength]}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-[0.15em]">Bevestig Wachtwoord</label>
                            <div className="relative group" suppressHydrationWarning>
                                <input
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    className={`w-full bg-[#0a0c0b]/60 border rounded-2xl px-5 h-16 text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-all duration-300 font-normal pr-14 ${confirm && confirm !== password ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20' : 'border-white/5 focus:border-primary/50 focus:ring-primary/20'}`}
                                    placeholder="••••••••"
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    suppressHydrationWarning
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                                        {showConfirm ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                            {confirm && confirm !== password && (
                                <p className="text-red-400 text-xs ml-1">Wachtwoorden komen niet overeen</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isPending || password.length < 8 || password !== confirm}
                            className="mt-4 w-full h-16 bg-primary hover:bg-emerald-400 active:scale-[0.98] rounded-2xl text-black font-extrabold text-base shadow-[0_10px_25px_rgba(16,183,127,0.15)] hover:shadow-[0_15px_35px_rgba(16,183,127,0.3)] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                    <span>Opslaan...</span>
                                </>
                            ) : (
                                <>
                                    <span>Wachtwoord instellen</span>
                                    <span className="material-symbols-outlined font-bold" style={{ fontSize: '20px' }}>check_circle</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}
