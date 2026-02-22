'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function UnlinkedQRContent() {
    const searchParams = useSearchParams()
    const reason = searchParams.get('reason')
    const materialId = searchParams.get('id')
    const isNotFound = reason === 'not_found'

    return (
        <div className="max-w-md w-full text-center">
            <div className="size-24 bg-white dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/5 ring-1 ring-gray-100 dark:ring-white/10 animate-bounce">
                <span className="material-symbols-outlined text-[#0df2a2] text-[48px]">
                    {isNotFound ? 'error' : 'qr_code_2'}
                </span>
            </div>

            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                {isNotFound ? 'Onbekende Code' : 'QR Code Actief'}
            </h1>

            <p className="text-gray-500 dark:text-gray-400 font-bold mb-10 leading-relaxed text-sm">
                {isNotFound
                    ? `De gescande code "${materialId || 'onbekend'}" is niet gevonden in ons systeem.`
                    : 'Deze QR-code is succesvol gescand, maar is momenteel nog niet gekoppeld aan een actieve woning.'
                }
            </p>

            <div className="space-y-4">
                <div className="p-6 bg-white dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 text-left">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-[#0df2a2]" />
                        {isNotFound ? 'Wat te doen?' : 'Wat betekent dit?'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {isNotFound
                            ? 'Controleer of de QR-code correct is of neem contact op met je makelaar.'
                            : 'Het bord of de sticker is geregistreerd in ons systeem, maar de makelaar moet deze nog toewijzen aan een specifiek adres.'
                        }
                    </p>
                </div>

                <Link
                    href="/"
                    className="block w-full bg-gray-900 dark:bg-white text-white dark:text-black font-black py-5 rounded-[1.5rem] transition-all active:scale-[0.98] text-sm uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:shadow-emerald-500/10"
                >
                    Terug naar Home
                </Link>
            </div>

            <p className="mt-12 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Powered by VoiceRealty.ai
            </p>
        </div>
    )
}

export default function UnlinkedQRPage() {
    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#050505] flex items-center justify-center p-6 text-slate-800 dark:text-slate-100 font-sans">
            <Suspense fallback={
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-[#0df2a2] border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Laden...</p>
                </div>
            }>
                <UnlinkedQRContent />
            </Suspense>
        </div>
    )
}
