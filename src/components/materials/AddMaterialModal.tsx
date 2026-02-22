'use client'

import React, { useState, useRef } from 'react'
import { uploadMaterialImage } from '@/app/dashboard/materialen/actions'

interface AddMaterialModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (data: { id: string, name: string, type: string, image_url: string }) => void
}

export default function AddMaterialModal({ isOpen, onClose, onConfirm }: AddMaterialModalProps) {
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        type: 'Tuinbord',
        image_url: ''
    })
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            const publicUrl = await uploadMaterialImage(formDataUpload)
            setFormData(prev => ({ ...prev, image_url: publicUrl }))
        } catch (error: any) {
            console.error('File upload error:', error)
            alert(`Fout bij uploaden: ${error.message || 'Onbekende fout'}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.id || !formData.name || isUploading) return
        onConfirm(formData)
        setFormData({ id: '', name: '', type: 'Tuinbord', image_url: '' })
    }

    return (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#111] w-full max-w-lg rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Nieuw Materiaal</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Voeg een fysiek item toe aan je inventaris.</p>
                        </div>
                        <button type="button" onClick={onClose} className="size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    <div className="space-y-6 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Material ID */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Uniek ID</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.id}
                                    onChange={e => setFormData({ ...formData, id: e.target.value })}
                                    placeholder="bijv. bord-01"
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold transition-all outline-none"
                                />
                            </div>

                            {/* Type */}
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Type</label>
                                <div className="relative">
                                    <select
                                        value={formData.type.includes('Anders:') ? 'Anders' : formData.type}
                                        onChange={e => {
                                            const val = e.target.value
                                            if (val === 'Anders') {
                                                setFormData(prev => ({ ...prev, type: 'Anders: ' }))
                                            } else {
                                                setFormData(prev => ({ ...prev, type: val }))
                                            }
                                        }}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold transition-all outline-none appearance-none cursor-pointer"
                                        style={{ colorScheme: 'dark' }} // Force background for options on some browsers
                                    >
                                        <option value="Tuinbord" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Tuinbord</option>
                                        <option value="Stoepbord" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Stoepbord</option>
                                        <option value="Raamsticker" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Raamsticker</option>
                                        <option value="V-bord" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">V-bord</option>
                                        <option value="Anders" className="bg-white dark:bg-[#111] text-gray-900 dark:text-white">Anders...</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        keyboard_arrow_down
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Custom Type Input */}
                        {formData.type.startsWith('Anders:') && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-black uppercase text-emerald-500 tracking-widest px-1">Specificeer Type</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.type.replace('Anders: ', '')}
                                    onChange={e => setFormData({ ...formData, type: `Anders: ${e.target.value}` })}
                                    placeholder="bijv. Beachflag"
                                    className="w-full bg-emerald-500/5 border border-emerald-500/20 focus:border-emerald-500 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold transition-all outline-none"
                                    autoFocus
                                />
                            </div>
                        )}

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Naam van het item</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="bijv. Stoepbord Ingang"
                                className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-emerald-500/50 rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold transition-all outline-none"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Afbeelding</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`group/drop relative h-40 w-full rounded-[2rem] border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${formData.image_url
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : 'border-gray-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                    }`}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="size-8 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Uploaden...</span>
                                    </div>
                                ) : formData.image_url ? (
                                    <>
                                        <img src={formData.image_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                        <div className="absolute inset-0 bg-black/20 group-hover/drop:bg-black/40 transition-colors flex flex-col items-center justify-center">
                                            <span className="material-symbols-outlined text-white text-[32px] mb-1">refresh</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Wijzig Afbeelding</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="size-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-3 group-hover/drop:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-gray-400 group-hover/drop:text-emerald-500 text-[24px]">add_a_photo</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-400 group-hover/drop:text-emerald-500">Klik om een foto te uploaden</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading || !formData.id || !formData.name}
                        className="w-full bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] mb-4"
                    >
                        Materiaal Toevoegen
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 text-gray-400 dark:text-gray-500 font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Annuleren
                    </button>
                </form>
            </div>
        </div>
    )
}
