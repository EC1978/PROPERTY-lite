'use client'

import { useState } from 'react'

interface RealworksModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (token: string) => Promise<void>;
    isLoading: boolean;
}

export default function RealworksModal({ isOpen, onClose, onSave, isLoading }: RealworksModalProps) {
    const [token, setToken] = useState('')

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0df2a2]">real_estate_agent</span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Realworks Koppeling</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                    Voer uw persoonlijke <strong>Realworks API Key</strong> in om uw CRM te synchroniseren met VoiceRealty.
                    Deze sleutel kunt u vinden in uw Realworks instellingen onder 'API Koppelingen'.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            API Sleutel
                        </label>
                        <input
                            type="password"
                            placeholder="Typ uw Realworks API key..."
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#0df2a2]/50 focus:ring-1 focus:ring-[#0df2a2]/50 transition-all font-mono text-sm"
                            autoComplete="off"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-50"
                        >
                            Annuleren
                        </button>
                        <button
                            onClick={() => onSave(token)}
                            disabled={isLoading || !token.trim()}
                            className="flex-1 py-3 rounded-xl font-bold bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-black shadow-[0_0_15px_rgba(13,242,162,0.2)] hover:shadow-[0_0_20px_rgba(13,242,162,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                                'Opslaan'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
