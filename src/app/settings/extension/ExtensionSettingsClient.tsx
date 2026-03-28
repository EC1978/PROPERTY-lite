'use client'

import { useState, useTransition } from 'react'
import { regenerateExtensionToken } from './actions'
import toast from 'react-hot-toast'

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Flow & Download */}
            <div className="lg:col-span-12 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1 — Download */}
                    <div className="bg-white dark:bg-[#121212]/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-sm group hover:border-[#10b77f]/20 transition-all duration-500">
                        <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-[#10b77f] text-2xl">download</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Download</h2>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed mb-6">
                            Pak de bestanden uit en installeer in Chrome via de Ontwikkelaarsmodus.
                        </p>
                        <a
                            href="/voicerealty-funda-extension.zip"
                            download
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#10b77f] text-[#050505] font-bold text-xs uppercase tracking-widest hover:bg-[#0df2a2] hover:shadow-[0_0_20px_rgba(16,183,127,0.3)] transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">zip_box</span>
                            Extensie .ZIP
                        </a>
                    </div>

                    {/* Step 2 — Configure */}
                    <div className="bg-white dark:bg-[#121212]/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-sm group hover:border-[#10b77f]/20 transition-all duration-500">
                        <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-[#10b77f] text-2xl">key</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. Token & URL</h2>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed mb-6">
                            Kopieer de URL en je persoonlijke token naar de extensie-instellingen.
                        </p>
                        <div className="space-y-2">
                            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 font-mono text-[10px] text-gray-500 truncate text-center">
                                {APP_URL}
                            </div>
                        </div>
                    </div>

                    {/* Step 3 — Success */}
                    <div className="bg-white dark:bg-[#121212]/40 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-white/5 shadow-sm group hover:border-[#10b77f]/20 transition-all duration-500">
                        <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-[#10b77f] text-2xl">auto_awesome</span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Gebruik</h2>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                            Bezoek een Funda advertentie en klik op de VoiceRealty knop om direct te importeren.
                        </p>
                    </div>
                </div>

                {/* Token Section */}
                <div className="bg-white dark:bg-[#121212] rounded-[32px] p-8 md:p-10 border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <span className="material-symbols-outlined text-[120px] text-white">vpn_key</span>
                    </div>

                    <div className="relative z-10 space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Jouw API Koppeling</h2>
                            <p className="text-sm text-slate-500 dark:text-gray-400">Gebruik dit token om de extensie veilig te verbinden met jouw account.</p>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                                <span className="material-symbols-outlined">error</span>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Server URL</label>
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/80 border border-gray-200 dark:border-white/10 font-mono text-sm text-gray-400 truncate">
                                    {APP_URL}
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(APP_URL);
                                        toast.success('URL gekopieerd');
                                    }}
                                    className="w-full sm:w-fit px-6 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-all active:scale-95 text-sm font-bold shrink-0"
                                >
                                    Kopieer URL
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Persoonlijk Token</label>
                            {token ? (
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <div className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/80 border border-gray-200 dark:border-white/10 font-mono text-sm text-[#10b77f] truncate">
                                        {token}
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className="w-full sm:w-fit px-6 py-4 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 hover:bg-[#10b77f]/20 text-[#10b77f] transition-all active:scale-95 text-sm font-bold shrink-0"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined text-lg">{copied ? 'check' : 'content_copy'}</span>
                                            {copied ? 'Gekopieerd!' : 'Kopieer Token'}
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="px-6 py-4 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-500 italic text-sm">
                                    Nog geen token beschikbaar...
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/5 gap-4">
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                <span className="material-symbols-outlined text-base">security</span>
                                Beveiligd met SSL
                            </div>
                            <button
                                onClick={handleRegenerate}
                                disabled={isPending}
                                className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-base">{isPending ? 'progress_activity' : 'refresh'}</span>
                                {isPending ? 'Nieuw token genereren...' : 'Regenereer nieuw token'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Installation Guide Footer */}
                <div className="p-8 rounded-3xl bg-gray-100 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-start gap-6">
                    <div className="size-14 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-[#10b77f] text-3xl">menu_book</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Beknopte Installatie Guide</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-[11px] text-slate-500 dark:text-gray-400 font-medium">
                            <p>• Pak het ZIP-bestand uit op een bekende plek.</p>
                            <p>• Open <code className="bg-gray-200 dark:bg-white/5 px-1.5 py-0.5 rounded text-gray-400">chrome://extensions</code></p>
                            <p>• Zet "Ontwikkelaarsmodus" AAN rechtsboven.</p>
                            <p>• Klik op "Uitgepakte extensie laden".</p>
                            <p>• Selecteer de map van stap 1.</p>
                            <p>• Klik op de puzzel-icon & "Pin" VoiceRealty.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
