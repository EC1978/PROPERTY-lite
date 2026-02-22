'use client'

import React, { useState } from 'react'

interface Property {
    id: string
    address: string
}

interface LinkPropertyModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (propertyId: string | null) => void
    properties: Property[]
    materialName: string
    currentPropertyId: string | null
}

export default function LinkPropertyModal({
    isOpen,
    onClose,
    onConfirm,
    properties,
    materialName,
    currentPropertyId
}: LinkPropertyModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(currentPropertyId)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Materiaal Koppelen</h2>
                        <button onClick={onClose} className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                        Koppel <span className="font-bold text-gray-900 dark:text-white">"{materialName}"</span> aan een actieve woning of plaats het terug in de opslag.
                    </p>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar mb-8">
                        {/* Opslag option */}
                        <button
                            onClick={() => setSelectedId(null)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedId === null
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-[#0df2a2]'
                                    : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                                <span className="font-bold">Terug naar opslag</span>
                            </div>
                            {selectedId === null && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
                        </button>

                        <div className="py-2 flex items-center gap-4">
                            <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Beschikbare Woningen</span>
                            <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                        </div>

                        {properties.map((prop) => (
                            <button
                                key={prop.id}
                                onClick={() => setSelectedId(prop.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedId === prop.id
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-[#0df2a2]'
                                        : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="material-symbols-outlined text-[24px]">home_work</span>
                                    <span className="font-bold truncate">{prop.address}</span>
                                </div>
                                {selectedId === prop.id && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => onConfirm(selectedId)}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] mb-4"
                    >
                        Wijziging Opslaan
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-4 text-gray-400 dark:text-gray-500 font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Annuleren
                    </button>
                </div>
            </div>
        </div>
    )
}
