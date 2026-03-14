'use client'

import React, { useState, useEffect } from 'react'
import ImageUpload from '@/components/ImageUpload'

interface LandingSettingsFormProps {
    currentImage: string | null
    trustedTitle: string
    trustedLogos: string[]
    updateAction: (formData: FormData) => Promise<void>
}

export default function LandingSettingsForm({ 
    currentImage, 
    trustedTitle, 
    trustedLogos, 
    updateAction 
}: LandingSettingsFormProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [logos, setLogos] = useState<string[]>(trustedLogos)
    const [mounted, setMounted] = useState(false)

    // Ensure we only render state-dependent parts on the client to avoid hydration errors
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="animate-pulse h-96 bg-white/5 rounded-3xl" />
    }

    const addLogo = (url: string) => {
        setLogos([...logos, url])
    }

    const removeLogo = (index: number) => {
        setLogos(logos.filter((_, i) => i !== index))
    }

    return (
        <form action={updateAction} className="space-y-10">
            {/* Hero Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">image</span>
                    <label className="block text-sm font-bold uppercase tracking-widest text-white">Hero Afbeelding</label>
                </div>
                <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
                    Deze afbeelding wordt als achtergrond gebruikt in de bovenste sectie van de landingspagina.
                </p>

                <div className="max-w-xl">
                    <ImageUpload
                        defaultValue={currentImage || ''}
                        onUploading={setIsUploading}
                    />
                </div>
            </div>

            {/* Trusted By Section */}
            <div className="space-y-6 pt-10 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-500">verified</span>
                        <label className="block text-sm font-bold uppercase tracking-widest text-white">"Vertrouwd Door" Sectie</label>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sectie Titel</label>
                        <input 
                            name="trusted_title"
                            type="text"
                            defaultValue={trustedTitle}
                            className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                            placeholder="Bijv. VERTROUWD DOOR"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Logos</label>
                        
                        {/* Logo Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {logos.map((logo, index) => {
                                const isUrl = logo.startsWith('http') || logo.startsWith('/');
                                return (
                                    <div key={index} className="group relative aspect-video bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-4 hover:border-emerald-500/30 transition-all">
                                        {isUrl ? (
                                            <img 
                                                src={logo} 
                                                alt={`Logo ${index}`} 
                                                className="max-w-full max-h-full object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all" 
                                            />
                                        ) : (
                                            <span className="text-zinc-500 font-bold text-sm tracking-widest uppercase group-hover:text-white transition-colors">
                                                {logo}
                                            </span>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={() => removeLogo(index)}
                                            className="absolute top-2 right-2 size-8 bg-black/60 hover:bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center shadow-xl backdrop-blur-md"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                );
                            })}
                            
                            {/* Add Logo Button */}
                            <div className="aspect-video relative">
                                <ImageUpload 
                                    compact 
                                    onUpload={addLogo}
                                    onUploading={setIsUploading}
                                />
                                <div className="absolute inset-x-0 -bottom-6 text-center">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Logo toevoegen</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Hidden Input to send logos as comma-separated string */}
            <input type="hidden" name="trusted_logos" value={logos.join(',')} />

            <div className="flex justify-end pt-8">
                <button
                    type="submit"
                    disabled={isUploading}
                    className={`
                        font-bold py-4 px-10 rounded-2xl transition-all active:scale-[0.98] shadow-2xl
                        ${isUploading
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-[#0df2a2] hover:bg-emerald-400 text-[#0A0A0A] shadow-[#0df2a2]/20'}
                    `}
                >
                    {isUploading ? (
                        <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></span>
                            Wachten op upload...
                        </span>
                    ) : (
                        'Wijzigingen Opslaan'
                    )}
                </button>
            </div>
        </form>
    )
}


