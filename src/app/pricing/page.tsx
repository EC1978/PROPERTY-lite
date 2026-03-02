'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const featureLabels: Record<string, string> = {
    has_properties: 'Woningen beheren',
    has_agenda: 'Agenda & Planning',
    has_leads: 'Leads Management',
    has_materials: 'Materialen bibliotheek',
    has_archive: 'Archief',
    has_statistics: 'Statistieken & Analytics',
    has_reviews: 'Klantbeoordelingen',
    has_webshop: 'Webshop toegang',
    has_billing: 'Facturatie module',
    has_voice: 'Voice AI Assistent',
}

const tierAccent = [
    { border: 'border-white/10', accent: 'text-[#0df2a2]', btnClass: 'border border-[#0df2a2]/50 text-[#0df2a2] hover:bg-[#0df2a2]/10' },
    { border: 'border-[#0df2a2]', accent: 'text-[#0df2a2]', btnClass: 'bg-[#0df2a2] text-black hover:bg-[#0bc081] shadow-lg shadow-[#0df2a2]/20' },
    { border: 'border-purple-500/30', accent: 'text-purple-300', btnClass: 'border border-purple-400/50 text-purple-300 hover:bg-purple-900/20' },
]

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
    const [packages, setPackages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/packages')
            .then(r => r.json())
            .then(data => { setPackages(data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const handleCheckout = async (planId: string) => {
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planId }),
            })
            const data = await response.json()
            if (data.url) window.location.href = data.url
            else if (data.error) alert('Checkout error: ' + data.error)
        } catch {
            alert('Something went wrong initiating checkout.')
        }
    }

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

            <div className="flex flex-col items-center pt-6 px-6">
                <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight text-center mb-2">Kies jouw kracht</h1>
                <p className="text-gray-400 text-sm font-medium leading-normal text-center max-w-[280px]">Schaalbare plannen voor elke makelaar. Upgrade wanneer je groeit.</p>
            </div>

            {/* Toggle */}
            <div className="flex justify-center px-4 py-6 w-full">
                <div className="flex h-12 w-full max-w-[320px] items-center justify-center rounded-xl bg-surface-dark p-1 relative border border-white/5">
                    {(['monthly', 'yearly'] as const).map(period => (
                        <label key={period} className={`z-10 flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-gray-400 transition-all duration-300 ${billingPeriod === period ? 'bg-primary shadow-lg text-white' : ''}`}>
                            <span className="text-sm font-semibold truncate">{period === 'monthly' ? 'Maandelijks' : 'Jaarlijks (-20%)'}</span>
                            <input className="peer invisible w-0 absolute" name="billing-period" type="radio" value={period} checked={billingPeriod === period} onChange={() => setBillingPeriod(period)} />
                        </label>
                    ))}
                </div>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-2 border-[#0df2a2] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="flex flex-col gap-5 px-4 pb-4 max-w-6xl mx-auto w-full md:grid md:grid-cols-3 md:items-start">
                    {packages.map((pkg, i) => {
                        const cls = tierAccent[Math.min(i, tierAccent.length - 1)]
                        const price = billingPeriod === 'yearly'
                            ? Math.round(pkg.annual_price / 12)
                            : pkg.monthly_price

                        const includedFeatures = Object.entries(featureLabels)
                            .filter(([key]) => pkg[key])
                            .map(([, label]) => label)

                        const propertyText = pkg.property_limit >= 999
                            ? 'Onbeperkt woningen'
                            : `Max ${pkg.property_limit} woningen`

                        return (
                            <div key={pkg.id} className={`glass-panel rounded-2xl p-5 border ${cls.border} ${i === 1 || pkg.is_popular ? 'bg-[#122520] relative shadow-[0_0_25px_rgba(16,185,129,0.15)]' : 'bg-glass'} flex flex-col gap-4 relative overflow-hidden group transition-all duration-300 h-full`}>
                                {(i === 1 || pkg.is_popular) && (
                                    <div className="absolute top-0 right-0 bg-[#0df2a2] text-black text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-[14px]">
                                        Meest Gekozen
                                    </div>
                                )}
                                <div className="z-10 pt-1">
                                    <h3 className={`${cls.accent} font-bold text-sm mb-1 uppercase tracking-wider`}>{pkg.id}</h3>
                                    <div className="text-2xl font-bold text-white">{pkg.name}</div>
                                    <p className="text-gray-400 text-xs mt-1">{pkg.description}</p>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">€{price}</span>
                                    <span className="text-gray-400 font-medium">/mnd</span>
                                    {billingPeriod === 'yearly' && <span className="text-[10px] text-[#0df2a2] ml-1">(-20%)</span>}
                                </div>
                                <div className="h-px w-full bg-white/10"></div>
                                {/* Property limit highlight */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0df2a2]/5 border border-[#0df2a2]/15">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-[16px]">home</span>
                                    <span className="text-[13px] font-bold text-[#0df2a2]">{propertyText}</span>
                                </div>
                                <ul className="flex flex-col gap-2 text-sm text-gray-300 flex-grow">
                                    {includedFeatures.filter(f => f !== 'Woningen beheren').map((feature, j) => (
                                        <li key={j} className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined ${cls.accent} text-[18px]`}>check_circle</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleCheckout(pkg.id)}
                                    className={`mt-2 w-full h-11 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${cls.btnClass}`}
                                >
                                    {i >= 2 ? `Upgrade naar ${pkg.name}` : `Kies ${pkg.name}`}
                                    {(i === 1 || pkg.is_popular) && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="h-6"></div>
            <div className="px-4 mt-auto max-w-md mx-auto w-full">
                <p className="text-center text-xs text-gray-600 mt-6 mb-2">VoiceRealty AI © 2026</p>
            </div>
        </div>
    )
}
