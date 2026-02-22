'use client'

import React, { useState } from 'react'
import { uploadMaterialImage } from '@/app/dashboard/materialen/actions'

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
    onUpdateName: (name: string) => Promise<void>
    onShowScans?: () => void
}

export default function LinkPropertyModal({
    isOpen,
    onClose,
    onConfirm,
    properties,
    materialName,
    currentPropertyId,
    currentImageUrl,
    onDelete,
    onUpdateImage,
    onUpdateName,
    onShowScans
}: LinkPropertyModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(currentPropertyId)
    const [isUploading, setIsUploading] = useState(false)
    const [localName, setLocalName] = useState(materialName)
    const [isUpdatingName, setIsUpdatingName] = useState(false)

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
            console.error('Upload handler error:', error)
            alert(`Fout bij bijwerken foto: ${error.message || 'Onbekende fout'}`)
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

                    {/* Image Section */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-white/5 rounded-[2rem] border border-gray-100 dark:border-white/5 flex items-center gap-4">
                        <div className="relative size-16 rounded-2xl overflow-hidden bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shrink-0">
                            {currentImageUrl ? (
                                <img src={currentImageUrl} alt={materialName} className="size-full object-cover" />
                            ) : (
                                <div className="size-full flex items-center justify-center opacity-20 text-gray-400">
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
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0df2a2] cursor-pointer hover:text-emerald-400 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                                {isUploading ? 'Uploaden...' : 'Foto wijzigen'}
                            </label>
                        </div>
                    </div>

                    {/* Name Edit Section */}
                    <div className="mb-8 space-y-3">
                        <div className="flex justify-between items-center px-2">
                            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                Materiaal Naam
                            </label>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                    onShowScans?.();
                                }}
                                className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-[0.15em]"
                            >
                                <span className="material-symbols-outlined text-[16px]">analytics</span>
                                Statistieken & Reset
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={localName}
                                onChange={(e) => setLocalName(e.target.value)}
                                placeholder="Voer nieuwe naam in..."
                                className="flex-1 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-[#0df2a2] rounded-[1.5rem] px-5 py-4 text-sm font-bold text-gray-900 dark:text-white outline-none transition-all shadow-inner"
                            />
                            {localName !== materialName && localName.trim() !== '' && (
                                <button
                                    onClick={async () => {
                                        try {
                                            setIsUpdatingName(true)
                                            await onUpdateName(localName)
                                        } catch (error: any) {
                                            alert(`Fout bij wijzigen naam: ${error.message}`)
                                        } finally {
                                            setIsUpdatingName(false)
                                        }
                                    }}
                                    disabled={isUpdatingName}
                                    className="bg-[#0df2a2] text-black h-[56px] px-6 rounded-[1.5rem] flex items-center justify-center font-black text-xs hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50 shrink-0"
                                >
                                    {isUpdatingName ? (
                                        <div className="size-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'OPSLAAN'
                                    )}
                                </button>
                            )}
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
