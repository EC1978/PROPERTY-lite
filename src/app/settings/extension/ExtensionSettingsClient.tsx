'use client'

import { useState, useTransition } from 'react'
import { regenerateExtensionToken } from './actions'

interface Props {
    initialToken: string | null
}

const APP_URL = 'https://property-lite-mocha.vercel.app'

export default function ExtensionSettingsClient({ initialToken }: Props) {
    const [token, setToken] = useState(initialToken)
    const [copied, setCopied] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleCopy = () => {
        if (!token) return
        navigator.clipboard.writeText(token)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRegenerate = () => {
        if (!confirm('Weet je zeker dat je een nieuw token wilt genereren? Je oude token werkt dan niet meer.')) return

        startTransition(async () => {
            setError(null)
            const result = await regenerateExtensionToken()
            if (result.error) {
                setError(result.error)
            } else if (result.token) {
                setToken(result.token)
            }
        })
    }

    return (
        <div className="space-y-6">

            {/* Step 1 — Download */}
            <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="size-10 rounded-2xl bg-[#10b77f]/10 flex items-center justify-center shrink-0">
                        <span className="font-black text-[#10b77f] text-lg">1</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">Download de extensie</h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Pak de bestanden uit en installeer in Chrome</p>
                    </div>
                </div>

                <a
                    href="/voicerealty-funda-extension.zip"
                    download
                    className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 hover:bg-[#10b77f]/20 transition-all group w-fit"
                >
                    <span className="material-symbols-outlined text-[#10b77f]">download</span>
                    <span className="font-bold text-[#10b77f]">voicerealty-funda-extension.zip</span>
                    <span className="material-symbols-outlined text-[#10b77f] text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </a>

                <div className="mt-6 space-y-3 text-sm text-slate-500 dark:text-gray-400">
                    <p className="font-semibold text-slate-700 dark:text-gray-300">Installatie in Chrome:</p>
                    <ol className="space-y-2 list-none">
                        {[
                            'Pak het ZIP bestand uit naar een vaste map op je computer',
                            'Ga naar chrome://extensions in je browser',
                            'Schakel "Ontwikkelaarsmodus" in (rechts bovenin)',
                            'Klik op "Uitgepakte extensie laden" en selecteer de uitgepakte map',
                            'Het VoiceRealty icoon verschijnt in je browserbalk ✅'
                        ].map((step, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="size-5 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 text-[10px] font-black text-slate-600 dark:text-gray-400 mt-0.5">
                                    {i + 1}
                                </span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>

            {/* Step 2 — Token */}
            <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="size-10 rounded-2xl bg-[#10b77f]/10 flex items-center justify-center shrink-0">
                        <span className="font-black text-[#10b77f] text-lg">2</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">Koppel je account</h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Kopieer dit token naar de extensie instellingen</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Jouw persoonlijke API token
                    </label>

                    {token ? (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 font-mono text-sm text-slate-700 dark:text-gray-300 truncate">
                                {token}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="px-5 py-4 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 hover:bg-[#10b77f]/20 text-[#10b77f] transition-all flex items-center gap-2 font-bold text-sm shrink-0"
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {copied ? 'check' : 'content_copy'}
                                </span>
                                {copied ? 'Gekopieerd!' : 'Kopieer'}
                            </button>
                        </div>
                    ) : (
                        <div className="px-5 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-dashed border-gray-300 dark:border-white/10 text-gray-400 dark:text-gray-600 text-sm italic">
                            Nog geen token aangemaakt — klik op "Genereer token" hieronder.
                        </div>
                    )}

                    <button
                        onClick={handleRegenerate}
                        disabled={isPending}
                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors mt-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-base">
                            {isPending ? 'progress_activity' : 'refresh'}
                        </span>
                        {token ? (isPending ? 'Regenereren...' : 'Nieuw token genereren') : (isPending ? 'Genereren...' : 'Genereer token')}
                    </button>
                </div>
            </div>

            {/* Step 3 — Use it */}
            <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="size-10 rounded-2xl bg-[#10b77f]/10 flex items-center justify-center shrink-0">
                        <span className="font-black text-[#10b77f] text-lg">3</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 dark:text-white">Klaar voor gebruik!</h2>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-0.5">Bezoek een Funda woningpagina en import met één klik</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#10b77f]/5 to-transparent border border-[#10b77f]/10">
                    <span className="material-symbols-outlined text-[#10b77f] mt-0.5">tips_and_updates</span>
                    <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                        Ga naar een woning op <strong className="text-slate-900 dark:text-white">funda.nl</strong>, klik op het VoiceRealty icoon in je browser en kies <strong className="text-slate-900 dark:text-white">"Importeer naar VoiceRealty"</strong>. De woning wordt direct aangemaakt en je wordt doorgestuurd naar de bewerkpagina.
                    </p>
                </div>
            </div>
        </div>
    )
}
