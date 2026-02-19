'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { QRCodeSVG } from 'qrcode.react'

interface PublicPropertyLiveViewProps {
    property: any
    isAdmin?: boolean
}

export default function PublicPropertyLiveView({ property, isAdmin = false }: PublicPropertyLiveViewProps) {
    const { startSession, stopSession, isConnected, isListening, isSpeaking, error } = useVoiceAgent({ propertyId: property.id })
    const [activeMedia, setActiveMedia] = useState(property.image_url)
    const [showQRModal, setShowQRModal] = useState(false)
    const [showGallery, setShowGallery] = useState(false)
    const [mediaModal, setMediaModal] = useState<{ url: string, title: string } | null>(null)
    const qrRef = useRef<HTMLDivElement>(null)

    const featureLabels: Record<string, string> = {
        constructionYear: 'Bouwjaar',
        type: 'Woningtype',
        layout: 'Indeling',
        energy: 'Energie-label',
        maintenance: 'Onderhoud',
        surroundings: 'Omgeving'
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

    const isBlockedDomain = (url: string) => {
        if (!url) return false;
        const normalized = url.toLowerCase();
        const blocked = [
            'funda.nl', 'fundainbusiness.nl', 'funda.io', 'jaap.nl', 'huislijn.nl', 'pararius.nl',
            'facebook.com', 'google.com', 'linkedin.com', 'instagram.com',
            'youtube.com/watch', 'vimeo.com/'
        ];
        return blocked.some(domain => normalized.includes(domain));
    }

    const getFeature = (key: string) => (property.features as any)?.[key] || '-'

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#050606] text-slate-900 dark:text-white font-sans selection:bg-[#10b77f]/30 transition-colors duration-300">

            {/* ═══════════════════════════════════════════════
                HEADER
            ═══════════════════════════════════════════════ */}
            <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/5 sticky top-0 z-50 bg-white/80 dark:bg-[#050606]/80 backdrop-blur-md transition-colors duration-300">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-[#10b77f] flex items-center justify-center">
                        <span className="material-symbols-outlined text-black text-lg">graphic_eq</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">VOICEREALTY<span className="text-[#10b77f]">AI</span></span>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/dashboard" className="px-3 sm:px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                            <span className="hidden sm:inline">Dashboard</span>
                        </Link>
                        <button
                            onClick={() => setShowQRModal(true)}
                            className="px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                            <span className="hidden sm:inline">QR Code</span>
                        </button>
                        <Link href={`/properties/${property.id}/edit`} className="px-3 sm:px-4 py-2 rounded-xl bg-[#10b77f] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(16,183,127,0.2)]">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            <span className="hidden sm:inline">Bewerken</span>
                        </Link>
                    </div>
                )}
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* ═══════════════════════════════════════════════
                    1. VOICE AGENT — TOP HERO CARD
                ═══════════════════════════════════════════════ */}
                <section className="relative bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-[2rem] p-6 sm:p-8 overflow-hidden shadow-xl dark:shadow-none">
                    {/* Subtle glow behind */}
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#10b77f]/10 rounded-full blur-[100px] pointer-events-none" />

                    {/* Property address + price */}
                    <div className="relative mb-6">
                        <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-1 text-slate-900 dark:text-white">{property.address}</h1>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
                            <span className="material-symbols-outlined text-lg">location_on</span>
                            {property.city || "Amsterdam-Centrum"}
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
                            € {property.price?.toLocaleString()} <span className="text-base font-normal text-gray-500">k.k.</span>
                        </div>
                    </div>

                    {/* Voice CTA button */}
                    <button
                        onClick={isConnected ? stopSession : startSession}
                        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-black transition-all shadow-[0_10px_30px_rgba(16,183,127,0.2)] hover:shadow-[0_15px_40px_rgba(16,183,127,0.4)]
                            ${isConnected ? 'bg-red-500 text-white animate-pulse' : 'bg-[#10b77f] hover:bg-[#0ea371]'}
                        `}
                    >
                        <div className={`size-10 rounded-full flex items-center justify-center ${isConnected ? 'bg-white/20' : 'bg-black/10'}`}>
                            <span className="material-symbols-outlined text-2xl">{isConnected ? 'stop' : 'mic'}</span>
                        </div>
                        <span className="text-sm sm:text-base uppercase tracking-wider">{isConnected ? 'Stop Gesprek' : 'Stel een vraag aan de AI-assistent'}</span>
                    </button>

                    {/* Agent profile row */}
                    <div className="mt-5 flex items-center gap-4 px-1">
                        <div className="size-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-700 dark:to-black border border-gray-200 dark:border-white/20 flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">smart_toy</span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-900 dark:text-white">VoiceRealty AI</p>
                            <p className="text-[10px] text-[#10b77f] font-bold uppercase tracking-wide flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-[#10b77f] animate-pulse"></span>
                                Altijd online • Direct antwoord
                            </p>
                        </div>
                    </div>

                    {/* Status overlay */}
                    {isConnected && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                            <p className="text-[#10b77f] font-medium text-sm animate-pulse">
                                {isListening ? 'Ik luister naar je...' : isSpeaking ? 'Aan het spreken...' : 'Verbinden...'}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded text-center">
                            {error}
                        </div>
                    )}
                </section>

                {/* ═══════════════════════════════════════════════
                    2. HERO IMAGE
                ═══════════════════════════════════════════════ */}
                <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-[2rem] overflow-hidden group shadow-lg dark:shadow-none">
                    <Image
                        src={activeMedia || '/placeholder-house.jpg'}
                        alt={property.address}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-[#10b77f] text-black text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">Nieuwbouw</span>
                        <span className="px-3 py-1 bg-white/90 dark:bg-white/20 backdrop-blur-md text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">Luxe</span>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    3. GALLERY STRIP
                ═══════════════════════════════════════════════ */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-4">
                    {property.images && property.images.slice(0, 4).map((img: string, i: number) => (
                        <div key={i} className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-gray-200 dark:border-white/5 hover:border-gray-400 dark:hover:border-white/20 transition-all shadow-sm dark:shadow-none" onClick={() => setActiveMedia(img)}>
                            <Image src={img} alt={`Gallery ${i}`} fill className="object-cover" />
                        </div>
                    ))}
                    <button
                        onClick={() => setShowGallery(true)}
                        className="relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 flex flex-col items-center justify-center group hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all shadow-sm dark:shadow-none"
                    >
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-white mb-1 transition-colors">photo_library</span>
                        <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Alle foto's</span>
                    </button>
                </div>

                {/* ═══════════════════════════════════════════════
                    4. STATS ROW
                ═══════════════════════════════════════════════ */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 p-4 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-1 sm:gap-2 group hover:border-[#10b77f]/50 dark:hover:border-[#10b77f]/30 transition-all shadow-sm dark:shadow-none">
                        <span className="material-symbols-outlined text-[#10b77f] text-xl sm:text-2xl">bed</span>
                        <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{property.bedrooms || 0}</span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">Slaapkamers</span>
                    </div>
                    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 p-4 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-1 sm:gap-2 group hover:border-[#10b77f]/50 dark:hover:border-[#10b77f]/30 transition-all shadow-sm dark:shadow-none">
                        <span className="material-symbols-outlined text-[#10b77f] text-xl sm:text-2xl">bathtub</span>
                        <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{property.bathrooms || 0}</span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">Badkamers</span>
                    </div>
                    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 p-4 sm:p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-1 sm:gap-2 group hover:border-[#10b77f]/50 dark:hover:border-[#10b77f]/30 transition-all shadow-sm dark:shadow-none">
                        <span className="material-symbols-outlined text-[#10b77f] text-xl sm:text-2xl">crop_free</span>
                        <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{property.surface_area || 0}</span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-gray-500">m²</span>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════
                    5. MEDIA BUTTONS
                ═══════════════════════════════════════════════ */}
                {(property.video_url || property.floorplan_url || property.tour_360_url) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {property.video_url && (
                            <button
                                onClick={() => setMediaModal({ url: property.video_url, title: 'Video Tour' })}
                                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                            >
                                <span className="material-symbols-outlined text-lg">play_circle</span> Video
                            </button>
                        )}
                        {property.floorplan_url && (
                            <button
                                onClick={() => setMediaModal({ url: property.floorplan_url, title: 'Plattegrond' })}
                                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                            >
                                <span className="material-symbols-outlined text-lg">map</span> Plattegrond
                            </button>
                        )}
                        {property.tour_360_url && (
                            <button
                                onClick={() => setMediaModal({ url: property.tour_360_url, title: '360° Tour' })}
                                className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white shadow-sm dark:shadow-none"
                            >
                                <span className="material-symbols-outlined text-lg">360</span> 360° Tour
                            </button>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════
                    6. DESCRIPTION
                ═══════════════════════════════════════════════ */}
                <section className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-none">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Omschrijving</h2>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base sm:text-lg font-light">
                        {property.description || "Geen omschrijving beschikbaar."}
                    </p>
                </section>

                {/* ═══════════════════════════════════════════════
                    7. KENMERKEN / FEATURES TABLE
                ═══════════════════════════════════════════════ */}
                <section>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-slate-900 dark:text-white">Kenmerken</h2>
                    <div className="border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-[#121212] shadow-sm dark:shadow-none">
                        {/* Basic info rows */}
                        <div className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <span className="text-gray-500 font-medium">Adres</span>
                            <span className="text-slate-900 dark:text-white font-semibold">{property.address || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <span className="text-gray-500 font-medium">Stad</span>
                            <span className="text-slate-900 dark:text-white font-semibold">{property.city || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <span className="text-gray-500 font-medium">Vraagprijs</span>
                            <span className="text-slate-900 dark:text-white font-semibold">€ {property.price?.toLocaleString() || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <span className="text-gray-500 font-medium">Oppervlakte</span>
                            <span className="text-slate-900 dark:text-white font-semibold">{property.surface_area ? `${property.surface_area} m²` : '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <span className="text-gray-500 font-medium">Slaapkamers</span>
                            <span className="text-slate-900 dark:text-white font-semibold">{property.bedrooms || '-'}</span>
                        </div>
                        <div className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <span className="text-gray-500 font-medium">Badkamers</span>
                            <span className="text-slate-900 dark:text-white font-semibold">{property.bathrooms || '-'}</span>
                        </div>
                        {property.label && (
                            <div className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                <span className="text-gray-500 font-medium">Energielabel</span>
                                <span className="text-slate-900 dark:text-white font-semibold">
                                    <span className="bg-[#10b77f]/10 dark:bg-[#10b77f]/20 text-[#10b77f] px-2 py-0.5 rounded text-xs font-bold border border-[#10b77f]/20 dark:border-[#10b77f]/30">{property.label}</span>
                                </span>
                            </div>
                        )}

                        {/* Dynamic features */}
                        {Object.entries(property.features || {}).map(([key, value]) => {
                            if (!value) return null;
                            return (
                                <div key={key} className="grid grid-cols-2 p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                                    <span className="text-gray-500 font-medium">{featureLabels[key] || key}</span>
                                    <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-2">
                                        {key === 'energy' ? (
                                            <span className="bg-[#10b77f]/10 dark:bg-[#10b77f]/20 text-[#10b77f] px-2 py-0.5 rounded text-xs font-bold border border-[#10b77f]/20 dark:border-[#10b77f]/30">{value as string}</span>
                                        ) : (
                                            value as string
                                        )}
                                    </span>
                                </div>
                            );
                        })}
                        {!property.features && <p className="p-4 text-gray-500 italic">Geen kenmerken beschikbaar.</p>}
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    8. MAP / SURROUNDINGS
                ═══════════════════════════════════════════════ */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="sm:col-span-2 relative h-[220px] sm:h-[300px] rounded-2xl sm:rounded-[2rem] overflow-hidden bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 group shadow-sm dark:shadow-none">
                        <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/-122.4241,37.78,14.25,0,0/600x600?access_token=YOUR_ACCESS_TOKEN')] bg-cover opacity-50 grayscale group-hover:grayscale-0 transition-all"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent dark:from-black/80"></div>
                        <div className="absolute bottom-5 left-5">
                            <h3 className="text-lg sm:text-xl font-bold mb-1 text-slate-900 dark:text-white">In de buurt</h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium bg-white/80 dark:bg-transparent px-2 py-1 rounded-lg inline-block">9 Negen Straatjes, Anne Frank Huis, Westertoren</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 flex flex-col justify-center space-y-5 shadow-sm dark:shadow-none">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#10b77f] font-bold mb-1">Bereikbaarheid</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">9.5/10</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#10b77f] font-bold mb-1">Luchthaven</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">20 min <span className="text-sm font-normal text-gray-500">(Trein)</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-[#10b77f] font-bold mb-1">Supermarkt</p>
                            <p className="text-xl font-bold text-slate-900 dark:text-white">3 min <span className="text-sm font-normal text-gray-500">(Lopen)</span></p>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    9. CONTACT / BEZICHTIGING CTA
                ═══════════════════════════════════════════════ */}
                <section className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/5 rounded-2xl p-6 sm:p-8 text-center shadow-sm dark:shadow-none">
                    <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Interesse in deze woning?</h3>
                    <p className="text-sm text-gray-500 mb-5">Plan een bezichtiging of stel direct een vraag aan onze AI-assistent.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={isConnected ? stopSession : startSession}
                            className="px-6 py-3 rounded-xl bg-[#10b77f] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors shadow-[0_0_20px_rgba(16,183,127,0.2)] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">mic</span>
                            Vraag de AI-assistent
                        </button>
                        <button className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">calendar_month</span>
                            Plan bezichtiging
                        </button>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="mt-12 border-t border-gray-200 dark:border-white/5 py-8 sm:py-12 bg-white dark:bg-[#020202] transition-colors duration-300">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 dark:text-gray-600 text-sm">© 2026 VoiceRealty AI. Alle rechten voorbehouden.</p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacybeleid</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Voorwaarden</a>
                    </div>
                </div>
            </footer>

            {/* ═══════════════════════════════════════════════
                MODALS (unchanged)
            ═══════════════════════════════════════════════ */}

            {/* QR Marketing Modal */}
            {showQRModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[3rem] p-8 md:p-12 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="absolute top-6 right-6 size-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="text-center mb-8">
                            <div className="size-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-emerald-500 text-3xl">campaign</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Marketing QR Kit</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">Gereed voor flyers en te-koop borden</p>
                        </div>

                        <div className="bg-white p-6 rounded-[2rem] shadow-inner mb-8 flex justify-center border border-gray-100" ref={qrRef}>
                            <QRCodeSVG
                                value={`https://voicerealty.ai/woning/${property.id}`}
                                size={200}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: "/logo-icon.png",
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    const svg = qrRef.current?.querySelector('svg');
                                    if (svg) {
                                        const svgData = new XMLSerializer().serializeToString(svg);
                                        const canvas = document.createElement("canvas");
                                        const ctx = canvas.getContext("2d");
                                        const img = new window.Image();
                                        img.onload = () => {
                                            canvas.width = img.width;
                                            canvas.height = img.height;
                                            ctx?.drawImage(img, 0, 0);
                                            const pngFile = canvas.toDataURL("image/png");
                                            const downloadLink = document.createElement("a");
                                            downloadLink.download = `QR-${property.address}.png`;
                                            downloadLink.href = pngFile;
                                            downloadLink.click();
                                        };
                                        img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                    }
                                }}
                                className="w-full py-4 bg-[#10b77f] hover:bg-[#0ea371] text-black font-extrabold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Download PNG
                            </button>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="w-full py-4 text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold text-sm transition-colors"
                            >
                                Sluiten
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Photo Gallery Modal */}
            {showGallery && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-in fade-in duration-300">
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-black/80 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-white">Fotogalerij</span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-gray-400 font-bold">{property.images?.length || 0} Foto's</span>
                        </div>
                        <button
                            onClick={() => setShowGallery(false)}
                            className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12">
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 sm:gap-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">
                            {property.images?.map((img: string, i: number) => (
                                <div key={i} className="relative rounded-2xl overflow-hidden break-inside-avoid shadow-2xl border border-white/5">
                                    <img src={img} alt={`Gallery Full ${i}`} className="w-full h-auto object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Media Preview Modal */}
            {mediaModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl sm:rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
                        <div className="px-4 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="h-1 w-6 rounded-full bg-[#10b77f]/40"></div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white">{mediaModal.title}</h3>
                                <a
                                    href={mediaModal.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-4 flex items-center gap-1 text-[10px] font-bold text-[#10b77f] hover:underline"
                                >
                                    OPEN EXTERN <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                </a>
                            </div>
                            <button
                                onClick={() => setMediaModal(null)}
                                className="size-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors text-white"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-[#050606] relative overflow-hidden group">
                            <iframe
                                src={isBlockedDomain(mediaModal.url)
                                    ? `/api/proxy?url=${encodeURIComponent(mediaModal.url)}`
                                    : getEmbedUrl(mediaModal.url)}
                                className="w-full h-full border-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
