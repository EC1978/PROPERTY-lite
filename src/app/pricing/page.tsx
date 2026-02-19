'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const handleCheckout = async (planId: string) => {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planId }),
            });
            const data = await response.json();
            if (data.url) window.location.href = data.url;
            else if (data.error) alert('Checkout error: ' + data.error);
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Something went wrong initiating checkout.');
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white antialiased overflow-x-hidden min-h-screen flex flex-col relative pb-8">
            {/* Top App Bar */}
            <div className="sticky top-0 z-50 flex items-center bg-background-dark/90 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/5">
                <Link href="/" className="text-white flex size-12 shrink-0 items-center justify-start cursor-pointer transition-opacity hover:opacity-80">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </Link>
                <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Abonnementen</h2>
                <div className="flex size-12 items-center justify-end">
                    <Link href="/login" className="flex items-center justify-center text-white transition-opacity hover:opacity-80">
                        <span className="material-symbols-outlined text-2xl">account_circle</span>
                    </Link>
                </div>
            </div>

            {/* Header Content */}
            <div className="flex flex-col items-center pt-6 px-6">
                <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight text-center mb-2">Kies jouw kracht</h1>
                <p className="text-gray-400 text-sm font-medium leading-normal text-center max-w-[280px]">Schaalbare plannen voor elke makelaar. Upgrade wanneer je groeit.</p>
            </div>

            {/* Toggle Switch */}
            <div className="flex justify-center px-4 py-6 w-full">
                <div className="flex h-12 w-full max-w-[320px] items-center justify-center rounded-xl bg-surface-dark p-1 relative border border-white/5">
                    <label className={`z-10 flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-gray-400 transition-colors duration-200 ${billingPeriod === 'monthly' ? 'bg-primary shadow-lg text-white' : ''}`}>
                        <span className="text-sm font-semibold truncate">Maandelijks</span>
                        <input
                            className="peer invisible w-0 absolute"
                            name="billing-period"
                            type="radio"
                            value="monthly"
                            checked={billingPeriod === 'monthly'}
                            onChange={() => setBillingPeriod('monthly')}
                        />
                    </label>
                    <label className={`z-10 flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-gray-400 transition-all duration-300 ${billingPeriod === 'yearly' ? 'bg-primary shadow-lg text-white' : ''}`}>
                        <span className="text-sm font-semibold truncate">Jaarlijks (-20%)</span>
                        <input
                            className="peer invisible w-0 absolute"
                            name="billing-period"
                            type="radio"
                            value="yearly"
                            checked={billingPeriod === 'yearly'}
                            onChange={() => setBillingPeriod('yearly')}
                        />
                    </label>
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex flex-col gap-5 px-4 pb-4 max-w-6xl mx-auto w-full md:grid md:grid-cols-3 md:items-start">
                {/* Card 1: Essential */}
                <div className="glass-panel bg-glass rounded-2xl p-5 border border-white/10 flex flex-col gap-4 relative overflow-hidden group hover:border-white/20 transition-all duration-300 h-full">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <h3 className="text-gray-300 font-medium text-sm mb-1 uppercase tracking-wider">Startende Makelaar</h3>
                            <div className="text-2xl font-bold text-white">Essential</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                            <span className="material-symbols-outlined text-primary">mic</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                        <span className="text-3xl font-bold text-white">€{billingPeriod === 'yearly' ? '39' : '49'}</span>
                        <span className="text-gray-400 font-medium">/mnd</span>
                    </div>
                    <div className="h-px w-full bg-white/10"></div>
                    <ul className="flex flex-col gap-3 text-sm text-gray-300 flex-grow">
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                            <span>3 Woning-objecten</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                            <span>Basis Voice AI</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                            <span>PDF Import</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => handleCheckout('Essential')}
                        className="mt-2 w-full h-11 rounded-lg border border-primary/50 text-primary font-bold text-sm hover:bg-primary/10 transition-colors flex items-center justify-center"
                    >
                        Kies Essential
                    </button>
                </div>

                {/* Card 2: Professional (Highlighted) */}
                <div className="glass-panel bg-glass-highlight rounded-2xl p-0.5 relative shadow-[0_0_25px_rgba(16,185,129,0.15)] overflow-hidden scale-[1.02] transform transition-transform md:mt-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-accent to-transparent opacity-20 pointer-events-none rounded-2xl"></div>
                    <div className="bg-[#122520] h-full w-full rounded-[14px] p-5 flex flex-col gap-4 relative">
                        <div className="absolute top-0 right-0">
                            <div className="bg-accent text-background-dark text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-[14px]">
                                Meest Gekozen
                            </div>
                        </div>
                        <div className="flex justify-between items-start z-10 pt-1">
                            <div>
                                <h3 className="text-accent font-bold text-sm mb-1 uppercase tracking-wider">Professional</h3>
                                <div className="text-2xl font-bold text-white">Professional</div>
                            </div>
                            <div className="bg-accent/10 rounded-lg p-2 mt-4">
                                <span className="material-symbols-outlined text-accent">analytics</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-1 my-2">
                            <span className="text-4xl font-bold text-white">€{billingPeriod === 'yearly' ? '103' : '129'}</span>
                            <span className="text-gray-400 font-medium">/mnd</span>
                        </div>
                        <div className="h-px w-full bg-accent/20"></div>
                        <ul className="flex flex-col gap-3 text-sm text-white font-medium flex-grow">
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-accent text-[20px]">check_circle</span>
                                <span>15 Woning-objecten</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-accent text-[20px]">check_circle</span>
                                <span>Analytics Dashboard</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-accent text-[20px]">check_circle</span>
                                <span>Custom Branding</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-accent text-[20px]">check_circle</span>
                                <span>Priority Support</span>
                            </li>
                        </ul>
                        <button
                            onClick={() => handleCheckout('Professional')}
                            className="mt-2 w-full h-12 rounded-lg bg-accent text-background-dark font-bold text-base hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2"
                        >
                            Start Professional
                            <span className="material-symbols-outlined text-lg">arrow_forward</span>
                        </button>
                    </div>
                </div>

                {/* Card 3: Elite */}
                <div className="glass-panel bg-glass rounded-2xl p-5 border border-white/10 flex flex-col gap-4 relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300 h-full">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-900/20 rounded-full blur-3xl"></div>
                    <div className="flex justify-between items-start z-10">
                        <div>
                            <h3 className="text-purple-300 font-medium text-sm mb-1 uppercase tracking-wider">Marktleiders</h3>
                            <div className="text-2xl font-bold text-white">Elite</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                            <span className="material-symbols-outlined text-purple-300">diamond</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                        <span className="text-3xl font-bold text-white">€{billingPeriod === 'yearly' ? '239' : '299'}</span>
                        <span className="text-gray-400 font-medium">/mnd</span>
                    </div>
                    <div className="h-px w-full bg-white/10"></div>
                    <ul className="flex flex-col gap-3 text-sm text-gray-300 flex-grow">
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-400 text-[20px]">check_circle</span>
                            <span>Onbeperkt Objecten</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-400 text-[20px]">check_circle</span>
                            <span>Voice Cloning</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-400 text-[20px]">check_circle</span>
                            <span>CRM Integratie</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-400 text-[20px]">check_circle</span>
                            <span>API Toegang</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => handleCheckout('Elite')}
                        className="mt-2 w-full h-11 rounded-lg border border-purple-400/50 text-purple-300 font-bold text-sm hover:bg-purple-900/20 transition-colors flex items-center justify-center"
                    >
                        Kies Elite
                    </button>
                </div>
            </div>

            {/* Spacer */}
            <div className="h-6"></div>

            {/* Footer Links - Removed Backend Links for Public Page */}
            <div className="px-4 mt-auto max-w-md mx-auto w-full">
                <p className="text-center text-xs text-gray-600 mt-6 mb-2">VoiceRealty AI © 2026</p>
            </div>
        </div>
    );
}
