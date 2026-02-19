'use client';

import Link from 'next/link';
import { signup } from '@/app/auth/actions';
import { useState, useTransition } from 'react';

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

function RegisterForm() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            // If plan is present, append it to formData
            if (plan) {
                formData.append('plan', plan);
            }
            const result = await signup(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    };

    return (
        <div className="bg-background-dark font-display text-white min-h-screen flex flex-col relative overflow-hidden antialiased selection:bg-primary selection:text-black">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#050505] to-[#000]"></div>
                <div className="absolute top-[-5%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full premium-blur opacity-60"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full premium-blur opacity-50"></div>
            </div>
            <header className="relative z-20 w-full px-6 py-8 flex justify-between items-center max-w-[480px] mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-800 flex items-center justify-center shadow-[0_0_10px_rgba(16,183,127,0.2)]">
                        <span className="material-symbols-outlined text-black font-bold text-lg">graphic_eq</span>
                    </div>
                    <span className="text-white text-sm font-bold tracking-tight">VoiceRealty AI</span>
                </div>
                <a className="text-xs font-semibold text-gray-400 hover:text-white transition-colors" href="#">HELP</a>
            </header>
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-12 w-full max-w-[480px] mx-auto">
                <div className="w-full glass-card rounded-[2.5rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Account aanmaken</h1>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed">
                            Start direct met het transformeren van je woningaanbod.
                        </p>
                    </div>

                    <form action={handleSubmit} className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-[0.15em]">Volledige Naam</label>
                            <div className="relative group">
                                <input name="fullName" className="w-full bg-[#0a0c0b]/60 border border-white/5 rounded-2xl px-5 h-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300 font-normal" placeholder="John Doe" type="text" required />
                                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-300" style={{ fontSize: '22px' }}>person</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 ml-1 uppercase tracking-[0.15em]">E-mailadres</label>
                            <div className="relative group">
                                <input name="email" className="w-full bg-[#0a0c0b]/60 border border-white/5 rounded-2xl px-5 h-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300 font-normal" placeholder="agent@voicerealty.ai" type="email" required />
                                <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-300" style={{ fontSize: '22px' }}>mail</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">Wachtwoord</label>
                            </div>
                            <div className="relative group">
                                <input name="password" className="w-full bg-[#0a0c0b]/60 border border-white/5 rounded-2xl px-5 h-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all duration-300 font-normal pr-14" placeholder="••••••••" type={showPassword ? "text" : "password"} required />
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
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium text-center">
                                {error}
                            </div>
                        )}

                        <button disabled={isPending} className="mt-4 w-full h-16 bg-primary hover:bg-emerald-400 active:scale-[0.98] rounded-2xl text-black font-extrabold text-base shadow-[0_10px_25px_rgba(16,183,127,0.15)] hover:shadow-[0_15px_35px_rgba(16,183,127,0.3)] transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span>{isPending ? 'Bezig met registreren...' : 'Registreren'}</span>
                            {!isPending && <span className="material-symbols-outlined font-bold" style={{ fontSize: '20px' }}>arrow_forward</span>}
                        </button>
                    </form>
                    <div className="mt-10 text-center">
                        <p className="text-gray-500 text-sm font-medium">
                            Al een account?
                            <Link className="text-white hover:text-primary font-bold transition-all ml-1 border-b border-white/20 hover:border-primary" href={`/login${plan ? `?plan=${plan}` : ''}`}>Inloggen</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterForm />
        </Suspense>
    );
}
