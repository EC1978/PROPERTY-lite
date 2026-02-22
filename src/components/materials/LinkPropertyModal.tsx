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
    currentImageUrl?: string
    onDelete: () => void
    onUpdateImage: (url: string) => Promise<void>
}

import { uploadMaterialImage } from '@/app/dashboard/materialen/actions'

export default function LinkPropertyModal({
    isOpen,
    onClose,
    onConfirm,
    properties,
    materialName,
    currentPropertyId,
    currentImageUrl,
    onDelete,
    onUpdateImage
}: LinkPropertyModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(currentPropertyId)
    const [isUploading, setIsUploading] = useState(false)

    if (!isOpen) return null

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)
            const formData = new FormData()
            formData.append('file', file)
            const url = await uploadMaterialImage(formData)
            await onUpdateImage(url)
        } catch (error: any) {
            alert(`Fout bij uploaden: ${error.message || 'Onbekende fout'}`)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#111] w-full max-w-md rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Beheer Materiaal</h2>
                        <button onClick={onClose} className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* Image Management Section */}
                    <div className="mb-8 p-4 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="relative size-20 rounded-2xl overflow-hidden bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shrink-0">
                                {currentImageUrl ? (
                                    <img src={currentImageUrl} alt={materialName} className="size-full object-cover" />
                                ) : (
                                    <div className="size-full flex items-center justify-center opacity-20">
                                        <span className="material-symbols-outlined">image</span>
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                        <div className="size-4 border-2 border-[#0df2a2] border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-sm text-gray-900 dark:text-white mb-1">{materialName}</h3>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="modal-image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={isUploading}
                                    />
                                    <label
                                        htmlFor="modal-image-upload"
                                        className="text-[10px] font-black uppercase tracking-widest text-[#0df2a2] cursor-pointer hover:text-emerald-400 transition-colors"
                                    >
                                        {isUploading ? 'Uploaden...' : 'Afbeelding wijzigen'}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Koppel dit materiaal aan een actieve woning of stel de status in op opslag.
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
                        onClick={() => {
                            if (confirm('Weet je zeker dat je dit materiaal wilt verwijderen?')) {
                                onDelete()
                            }
                        }}
                        className="w-full py-4 text-red-500 hover:text-red-600 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Materiaal Verwijderen
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-3 text-gray-400 dark:text-gray-500 font-bold text-xs hover:text-gray-900 dark:hover:text-white transition-colors uppercase tracking-widest"
                    >
                        Sluiten
                    </button>
                </div>
            </div>
        </div>
    )
}
