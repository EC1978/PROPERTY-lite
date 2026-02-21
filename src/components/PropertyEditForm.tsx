'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'

interface PropertyEditFormProps {
    property: any
    voices: any[]
    myVoices?: any[]
    updateAction: (formData: FormData) => Promise<void>
    deleteAction: () => Promise<void>
}

export default function PropertyEditForm({ property, voices, myVoices = [], updateAction, deleteAction }: PropertyEditFormProps) {
    const [mainImageUrl, setMainImageUrl] = useState(property.image_url || '')
    const [images, setImages] = useState<string[]>(property.images || [])
    const [isDeleting, setIsDeleting] = useState(false)

    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewTitle, setPreviewTitle] = useState('')

    const [customLinks, setCustomLinks] = useState<{ label: string, url: string }[]>(property.custom_links || [])
    const [customFeatures, setCustomFeatures] = useState<{ label: string, value: string }[]>(() => {
        const fixedKeys = ['constructionYear', 'type', 'layout', 'energy', 'maintenance', 'surroundings']
        const feats = property.features || {}
        return Object.entries(feats)
            .filter(([key]) => !fixedKeys.includes(key))
            .map(([label, value]) => ({ label, value: value as string }))
    })
    const [basicFeatures, setBasicFeatures] = useState<{ label: string, value: string }[]>([])

    // Helper to safely get feature values
    const getFeature = (key: string) => (property.features as any)?.[key] || ''

    const handleThumbnailClick = (url: string) => {
        setMainImageUrl(url)
    }

    const handleAddImage = (url: string) => {
        setImages(prev => [...prev, url])
        if (!mainImageUrl) setMainImageUrl(url)
    }

    const isBlockedDomain = (url: string) => {
        if (!url) return false;
        const normalized = url.toLowerCase();
        const blocked = [
            'funda.nl', 'fundainbusiness.nl', 'jaap.nl', 'huislijn.nl', 'pararius.nl',
            'facebook.com', 'google.com', 'linkedin.com', 'instagram.com'
        ];
        return blocked.some(domain => normalized.includes(domain));
    }

    const getEmbedUrl = (url: string) => {
        if (!url) return url;
        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
        if (ytMatch && ytMatch[1]) {
            return `https://www.youtube.com/embed/${ytMatch[1].split('&')[0]}`;
        }
        const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(.+)/);
        if (vimeoMatch && vimeoMatch[1]) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        return url;
    }

    const openPreview = (url: string, title: string) => {
        if (!url) return
        let targetUrl = getEmbedUrl(url)
        if (isBlockedDomain(url)) {
            targetUrl = `/api/proxy?url=${encodeURIComponent(url)}`
        }
        setPreviewUrl(targetUrl)
        setPreviewTitle(title)
    }

    useEffect(() => {
        if (previewUrl) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault()
                e.returnValue = ''
                return ''
            }
            window.addEventListener('beforeunload', handleBeforeUnload)
            return () => window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [previewUrl])

    return (
        <>
            <form action={updateAction} className="space-y-8">
                <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 dark:opacity-5 group-hover:opacity-10 transition-opacity">
                        <span className="material-symbols-outlined text-[100px] text-slate-900 dark:text-white" style={{ fontVariationSettings: "'wght' 100" }}>home</span>
                    </div>

                    <div className="relative z-10 space-y-10">
                        <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/5 pb-6">
                            <div className="size-12 bg-[#10b77f]/10 rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#10b77f]">info</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Basisinfo</h2>
                        </div>

                        <div className="space-y-8">
                            <div className="group/input">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1 group-focus-within/input:text-[#10b77f] transition-colors">Adres</label>
                                <input
                                    type="text"
                                    name="address"
                                    defaultValue={property.address}
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all duration-300"
                                    suppressHydrationWarning
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1 flex justify-between items-center">
                                    <span>Hoofdafbeelding</span>
                                    {mainImageUrl && (
                                        <span className="text-[10px] text-[#10b77f] font-medium uppercase">Klik op een thumbnail om deze te selecteren</span>
                                    )}
                                </label>

                                <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.01]">
                                    <ImageUpload
                                        key={mainImageUrl}
                                        defaultValue={mainImageUrl}
                                        onUpload={(url) => setMainImageUrl(url)}
                                    />
                                </div>

                                {images && images.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-600 text-sm">photo_library</span>
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-600 uppercase tracking-widest">Gevonden foto's ({images.length})</span>
                                        </div>
                                        <div className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-hide">
                                            {images.map((img: string, i: number) => (
                                                <div key={i} className="relative group/img-wrapper">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleThumbnailClick(img)}
                                                        className={`
                                                            relative size-24 shrink-0 rounded-2xl overflow-hidden border transition-all duration-300
                                                            ${mainImageUrl === img
                                                                ? 'border-[#10b77f] ring-2 ring-[#10b77f]/20 scale-[0.98]'
                                                                : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30'}
                                                        `}
                                                    >
                                                        <img src={img} className="size-full object-cover" alt={`Gallery ${i}`} />
                                                        {mainImageUrl === img && (
                                                            <div className="absolute inset-0 bg-[#10b77f]/20 flex items-center justify-center">
                                                                <div className="size-8 bg-[#10b77f] rounded-full flex items-center justify-center shadow-lg">
                                                                    <span className="material-symbols-outlined text-white text-lg font-bold">check</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newImages = images.filter((_, index) => index !== i);
                                                            setImages(newImages);
                                                            if (mainImageUrl === img) {
                                                                setMainImageUrl(newImages[0] || '');
                                                            }
                                                        }}
                                                        className="absolute -top-2 -right-2 size-6 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover/img-wrapper:opacity-100 transition-opacity z-10 hover:bg-red-600 hover:scale-110 active:scale-95"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                                    </button>
                                                </div>
                                            ))}

                                            <div className="size-24 shrink-0">
                                                <ImageUpload
                                                    onUpload={handleAddImage}
                                                    compact
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <input type="hidden" name="all_images" value={JSON.stringify(images || [])} />
                                <input type="hidden" name="image_url" value={mainImageUrl || ''} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="group/input">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1">Vraagprijs (€)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        defaultValue={property.price}
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all"
                                    />
                                </div>
                                <div className="group/input">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1">Woonoppervlakte (m²)</label>
                                    <input
                                        type="number"
                                        name="surface_area"
                                        defaultValue={property.surface_area}
                                        className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Custom Features Section within Basic Info */}
                            <div className="pt-6 border-t border-white/5 space-y-4">
                                {basicFeatures.map((feat, index) => (
                                    <div key={index} className="group/input animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div className="flex items-center justify-between mb-3 px-1">
                                            <input
                                                type="text"
                                                placeholder="Label (bijv. Tuin)"
                                                value={feat.label}
                                                onChange={(e) => {
                                                    const newFeats = [...basicFeatures];
                                                    newFeats[index].label = e.target.value;
                                                    setBasicFeatures(newFeats);
                                                }}
                                                className="bg-transparent border-none text-xs font-bold text-gray-500 uppercase tracking-widest focus:outline-none focus:text-primary w-1/2"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setBasicFeatures(prev => prev.filter((_, i) => i !== index))}
                                                className="text-[10px] text-red-500/50 hover:text-red-500 font-bold uppercase tracking-widest transition-colors"
                                            >
                                                Verwijderen
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={feat.value}
                                            onChange={(e) => {
                                                const newFeats = [...basicFeatures];
                                                newFeats[index].value = e.target.value;
                                                setBasicFeatures(newFeats);
                                            }}
                                            placeholder="Waarde"
                                            className="w-full px-6 py-4 rounded-2xl bg-[#0a0c0b]/60 border border-white/5 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setBasicFeatures(prev => [...prev, { label: 'Nieuw kenmerk', value: '' }])}
                                    className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-3 group/add"
                                >
                                    <div className="size-8 rounded-full bg-white/5 flex items-center justify-center group-hover/add:bg-primary group-hover/add:text-black transition-all">
                                        <span className="material-symbols-outlined text-lg">add</span>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 group-hover/add:text-white transition-colors">Kenmerk toevoegen</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Agent / Voice Selection */}
                <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none group">
                    <div className="flex items-center gap-4 mb-10 border-b border-gray-200 dark:border-white/5 pb-6">
                        <div className="size-12 bg-[#10b77f]/10 rounded-2xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#10b77f]">graphic_eq</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kies AI Agent</h2>
                    </div>

                    <div className="group/input">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1">Selecteer Stem voor Presentatie</label>
                        <div className="relative">
                            <select
                                name="voice_id"
                                defaultValue={property.voice_id || ''}
                                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white appearance-none focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all cursor-pointer"
                                suppressHydrationWarning
                            >
                                <option value="" className="bg-[#050606] text-gray-400">Geen specifieke stem (Standaard)</option>

                                {myVoices && myVoices.length > 0 && (
                                    <optgroup label="Mijn Bibliotheek" className="bg-[#050606] text-gray-400 font-bold">
                                        {myVoices.map((voice) => (
                                            <option key={voice.id} value={voice.url} className="bg-[#050606] text-white font-normal">
                                                {voice.name}
                                                {voice.url === property.voice_id ? ' (Huidig)' : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}

                                {voices && voices.length > 0 && (
                                    <optgroup label="Collega's" className="bg-[#050606] text-gray-400 font-bold">
                                        {voices.map((voice) => (
                                            <option key={voice.id} value={voice.cloned_voice_id} className="bg-[#050606] text-white font-normal">
                                                {voice.full_name || voice.email}
                                                {voice.cloned_voice_id === property.voice_id ? ' (Huidig)' : ''}
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">expand_more</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-3 px-1">
                            Kies welke AI-stem deze woning presenteert aan bezoekers. Je kunt kiezen uit je eigen stem of die van collega's.
                        </p>
                    </div>
                </div>

                {/* Kenmerken Card */}
                <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-4 mb-10 border-b border-gray-200 dark:border-white/5 pb-6">
                        <div className="size-12 bg-[#10b77f]/10 rounded-2xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#10b77f]">manage_search</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gedetailleerde Kenmerken</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { name: 'feature_constructionYear', label: 'Bouwjaar', key: 'constructionYear', placeholder: 'Bijv. 1880' },
                            { name: 'feature_type', label: 'Woningtype', key: 'type', placeholder: 'Bijv. Kantoorvilla' },
                            { name: 'feature_energy', label: 'Energie & Isolatie', key: 'energy', placeholder: 'Label A...' },
                            { name: 'feature_maintenance', label: 'Onderhoud', key: 'maintenance', placeholder: 'Bijv. Gemoderniseerd' },
                            { name: 'feature_layout', label: 'Indeling', key: 'layout', placeholder: 'Bijv. 4 bouwlagen...', full: true },
                            { name: 'feature_surroundings', label: 'Ligging', key: 'surroundings', placeholder: 'Bijv. Woonwijk...', full: true }
                        ].map((field) => (
                            <div key={field.name} className={`group/input ${field.full ? 'md:col-span-2' : ''}`}>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1">{field.label}</label>
                                <input
                                    type="text"
                                    name={field.name}
                                    defaultValue={getFeature(field.key)}
                                    placeholder={field.placeholder}
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all"
                                />
                            </div>
                        ))}

                        {/* Custom Features List (Detailed) */}
                        {customFeatures.map((feat, index) => (
                            <div key={index} className="md:col-span-2 group/input animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <input
                                        type="text"
                                        placeholder="Label (bijv. Erfpacht)"
                                        value={feat.label}
                                        onChange={(e) => {
                                            const newFeats = [...customFeatures];
                                            newFeats[index].label = e.target.value;
                                            setCustomFeatures(newFeats);
                                        }}
                                        className="bg-transparent border-none text-xs font-bold text-gray-500 uppercase tracking-widest focus:outline-none focus:text-primary w-1/2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCustomFeatures(prev => prev.filter((_, i) => i !== index))}
                                        className="text-[10px] text-red-500/50 hover:text-red-500 font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Verwijderen
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={feat.value}
                                    onChange={(e) => {
                                        const newFeats = [...customFeatures];
                                        newFeats[index].value = e.target.value;
                                        setCustomFeatures(newFeats);
                                    }}
                                    placeholder="..."
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all"
                                />
                            </div>
                        ))}

                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={() => setCustomFeatures(prev => [...prev, { label: 'Nieuw kenmerk', value: '' }])}
                                className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/5 hover:border-[#10b77f]/30 hover:bg-[#10b77f]/5 transition-all flex items-center justify-center gap-3 group/add"
                            >
                                <div className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover/add:bg-[#10b77f] group-hover/add:text-white transition-all">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 group-hover/add:text-slate-900 dark:group-hover/add:text-white transition-colors">Kenmerk toevoegen</span>
                            </button>
                        </div>
                    </div>
                </div>
                <input type="hidden" name="custom_features" value={JSON.stringify([...customFeatures, ...basicFeatures])} />

                {/* Media Links Card */}
                <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-4 mb-10 border-b border-gray-200 dark:border-white/5 pb-6">
                        <div className="size-12 bg-[#10b77f]/10 rounded-2xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#10b77f]">perm_media</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Media Links</h2>
                    </div>

                    <div className="space-y-8">
                        {[
                            { name: 'video_url', label: 'Video URL', icon: 'smart_display', placeholder: 'https://youtube.com/...' },
                            { name: 'floorplan_url', label: 'Plattegrond URL', icon: 'architecture', placeholder: 'https://...' },
                            { name: 'tour_360_url', label: '360° Tour URL', icon: 'view_in_ar', placeholder: 'https://...' }
                        ].map((field) => (
                            <div key={field.name} className="group/input">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 px-1">{field.label}</label>
                                <div className="relative group/url">
                                    <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-600 group-focus-within/input:text-[#10b77f] transition-colors">{field.icon}</span>
                                    <input
                                        type="url"
                                        id={field.name}
                                        name={field.name}
                                        defaultValue={(property as any)[field.name]}
                                        placeholder={field.placeholder}
                                        className="w-full pl-16 pr-32 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const el = document.getElementById(field.name) as HTMLInputElement;
                                            if (el?.value) openPreview(el.value, field.label);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        Preview
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Custom Links List */}
                        {customLinks.map((link, index) => (
                            <div key={index} className="group/input animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <input
                                        type="text"
                                        placeholder="Label (bijv. Matterport)"
                                        value={link.label}
                                        onChange={(e) => {
                                            const newLinks = [...customLinks];
                                            newLinks[index].label = e.target.value;
                                            setCustomLinks(newLinks);
                                        }}
                                        className="bg-transparent border-none text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest focus:outline-none focus:text-[#10b77f] w-1/2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setCustomLinks(prev => prev.filter((_, i) => i !== index))}
                                        className="text-[10px] text-red-500/50 hover:text-red-500 font-bold uppercase tracking-widest transition-colors"
                                    >
                                        Verwijderen
                                    </button>
                                </div>
                                <div className="relative group/url">
                                    <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-600">link</span>
                                    <input
                                        type="url"
                                        value={link.url}
                                        onChange={(e) => {
                                            const newLinks = [...customLinks];
                                            newLinks[index].url = e.target.value;
                                            setCustomLinks(newLinks);
                                        }}
                                        placeholder="https://..."
                                        className="w-full pl-16 pr-32 py-4 rounded-2xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 focus:outline-none focus:border-[#10b77f]/50 focus:ring-1 focus:ring-[#10b77f]/20 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => openPreview(link.url, link.label)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        Preview
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() => setCustomLinks(prev => [...prev, { label: 'Extra Media', url: '' }])}
                            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/5 hover:border-[#10b77f]/30 hover:bg-[#10b77f]/5 transition-all flex items-center justify-center gap-3 group/add"
                        >
                            <div className="size-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover/add:bg-[#10b77f] group-hover/add:text-white transition-all">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 group-hover/add:text-slate-900 dark:group-hover/add:text-white transition-colors">Media link toevoegen</span>
                        </button>
                    </div>
                </div>
                <input type="hidden" name="custom_links" value={JSON.stringify(customLinks)} />

                {/* Omschrijving Card */}
                <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 md:p-12 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none relative group">
                    <div className="flex items-center gap-4 mb-10 border-b border-gray-200 dark:border-white/5 pb-6">
                        <div className="size-12 bg-[#10b77f]/10 rounded-2xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#10b77f]">notes</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Omschrijving</h2>
                    </div>
                    <div className="group/input">
                        <textarea
                            name="description"
                            rows={8}
                            defaultValue={property.description}
                            className="w-full px-8 py-6 rounded-3xl bg-gray-50 dark:bg-[#0a0c0b]/60 border border-gray-200 dark:border-white/5 text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-700 outline-none focus:border-[#10b77f]/40 focus:ring-1 focus:ring-[#10b77f]/20 transition-all resize-none leading-relaxed"
                        ></textarea>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12">
                    <button
                        type="button"
                        onClick={async () => {
                            if (confirm('Weet je zeker dat je deze woning wilt verwijderen?')) {
                                setIsDeleting(true)
                                await deleteAction()
                            }
                        }}
                        disabled={isDeleting}
                        className="flex items-center gap-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 font-bold uppercase text-[10px] tracking-[0.2em] px-6 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/5 transition-all disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        {isDeleting ? 'Verwijderen...' : 'Woning Verwijderen'}
                    </button>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Link href="/dashboard" className="flex-1 md:flex-none px-10 py-5 rounded-2xl border border-gray-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-center">
                            Annuleren
                        </Link>
                        <button type="submit" className="flex-1 md:flex-none bg-[#10b77f] hover:bg-emerald-400 active:scale-95 text-white font-extrabold py-5 px-12 rounded-2xl transition-all shadow-lg hover:shadow-emerald-500/20">
                            Opslaan & Genereren
                        </button>
                    </div>
                </div>
            </form>

            {/* Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                    <div className="absolute inset-0 bg-[#050606]/90 backdrop-blur-xl" onClick={() => setPreviewUrl(null)}></div>
                    <div className="relative w-full max-w-6xl aspect-video bg-black rounded-[2.5rem] border border-white/10 overflow-hidden shadow-[0_0_100px_rgba(16,183,127,0.1)] flex flex-col">
                        <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="h-1 w-6 rounded-full bg-[#10b77f]/40"></div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">{previewTitle} Preview</h3>
                            </div>
                            <button
                                onClick={() => setPreviewUrl(null)}
                                className="size-10 rounded-full hover:bg-white/5 flex items-center justify-center text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-[#050606] relative">
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-20 pointer-events-none text-white">
                                <span className="material-symbols-outlined text-[80px] mb-4">public_off</span>
                                <p className="text-xl font-bold mb-2">Externe Website</p>
                                <p className="text-sm max-w-md">Sommige websites (zoals Funda) staan niet toe dat ze binnen een andere app worden getoond.</p>
                            </div>

                            <iframe
                                src={previewUrl}
                                className="relative z-10 w-full h-full border-none bg-white"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                title="Media Preview"
                            ></iframe>
                        </div>
                        <div className="px-8 py-4 border-t border-white/10 bg-white/[0.01] flex justify-between items-center">
                            <p className="text-[10px] text-gray-500 font-medium truncate max-w-md">{previewUrl}</p>
                            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#10b77f] font-bold hover:underline flex items-center gap-1">
                                Open in nieuw tabblad <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
