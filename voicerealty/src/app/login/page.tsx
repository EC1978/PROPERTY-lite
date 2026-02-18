'use client';

import Link from 'next/link';
import { login } from '@/app/auth/actions';
import { useState, useTransition } from 'react';

import { useSearchParams } from 'next/navigation';
import React, { Suspense } from 'react';

function LoginForm() {
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
            const result = await login(formData);
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
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Welkom terug.</h1>
                        <p className="text-gray-400 text-sm font-medium leading-relaxed">
                            Log in op uw premium dashboard voor exclusieve vastgoed AI-tools.
                        </p>
                    </div>

                    <form action={handleSubmit} className="flex flex-col gap-6">
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
                                <a className="text-[11px] font-semibold text-primary/80 hover:text-primary transition-colors" href="#">Wachtwoord vergeten?</a>
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
                            <span>{isPending ? 'Bezig met inloggen...' : 'Inloggen'}</span>
                            {!isPending && <span className="material-symbols-outlined font-bold" style={{ fontSize: '20px' }}>arrow_forward</span>}
                        </button>
                    </form>

                    <div className="my-10 flex items-center gap-4 px-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Snelle toegang</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                    </div>
                    <button className="w-full group flex flex-col items-center gap-4 outline-none">
                        <div className="w-20 h-20 rounded-[2rem] border border-white/5 bg-white/[0.03] flex items-center justify-center group-hover:bg-white/[0.06] group-hover:border-primary/30 group-hover:scale-105 transition-all duration-500">
                            <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors" style={{ fontSize: '40px', fontVariationSettings: "'wght' 200" }}>face_unlock</span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-300 uppercase tracking-widest transition-colors">Face ID Gebruiken</span>
                    </button>
                </div>
                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm font-medium">
                        Geen toegang?
                        <Link className="text-white hover:text-primary font-bold transition-all ml-1 border-b border-white/20 hover:border-primary" href={`/register${plan ? `?plan=${plan}` : ''}`}>Vraag demo aan</Link>
                    </p>
                </div>
            </main>
            <div className="fixed bottom-0 left-0 right-0 h-32 flex items-end justify-center gap-[4px] pb-8 pointer-events-none z-0 opacity-20">
                <div className="w-1 bg-primary/20 rounded-t-full h-6"></div>
                <div className="w-1 bg-primary/30 rounded-t-full h-12"></div>
                <div className="w-1 bg-primary/40 rounded-t-full h-20"></div>
                <div className="w-1 bg-primary/50 rounded-t-full h-10"></div>
                <div className="w-1 bg-primary/60 rounded-t-full h-16"></div>
                <div className="w-1 bg-primary/70 rounded-t-full h-24 shadow-[0_0_15px_rgba(16,183,127,0.5)]"></div>
                <div className="w-1 bg-primary/80 rounded-t-full h-12"></div>
                <div className="w-1 bg-primary/90 rounded-t-full h-18 shadow-[0_0_15px_rgba(16,183,127,0.5)]"></div>
                <div className="w-1 bg-primary rounded-t-full h-28 shadow-[0_0_20px_rgba(16,183,127,0.6)]"></div>
                <div className="w-1 bg-primary/90 rounded-t-full h-14"></div>
                <div className="w-1 bg-primary/80 rounded-t-full h-22 shadow-[0_0_15px_rgba(16,183,127,0.5)]"></div>
                <div className="w-1 bg-primary/70 rounded-t-full h-8"></div>
                <div className="w-1 bg-primary/60 rounded-t-full h-16"></div>
                <div className="w-1 bg-primary/50 rounded-t-full h-10"></div>
                <div className="w-1 bg-primary/40 rounded-t-full h-6"></div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
