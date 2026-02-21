'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { QRCodeSVG } from 'qrcode.react'

interface PublicPropertyLiveViewProps {
    property: Record<string, any>
    isAdmin?: boolean
}

export default function PublicPropertyLiveView({ property, isAdmin = false }: PublicPropertyLiveViewProps) {
    const { startSession, stopSession, isConnected, isListening, isSpeaking, error } = useVoiceAgent({ propertyId: property.id })

    const allImages: string[] = property.images?.length
        ? property.images
        : property.image_url
            ? [property.image_url]
            : []

    const [activeIndex, setActiveIndex] = useState(0)
    const [showQRModal, setShowQRModal] = useState(false)
    const [showGallery, setShowGallery] = useState(false)
    const [mediaModal, setMediaModal] = useState<{ url: string; title: string } | null>(null)
    const qrRef = useRef<HTMLDivElement>(null)

    const featureLabels: Record<string, string> = {
        constructionYear: 'Bouwjaar',
        type: 'Woningtype',
        layout: 'Indeling',
        energy: 'Energielabel',
        maintenance: 'Onderhoud',
        surroundings: 'Omgeving',
    }

    const features = property.features || {}

    // Stat cards for top (short values only)
    const statCards = [
        property.surface_area && { label: 'Woonoppervlak', value: `${property.surface_area} m²` },
        property.bedrooms && { label: 'Slaapkamers', value: property.bedrooms },
        property.bathrooms && { label: 'Badkamers', value: property.bathrooms },
        features.energy && { label: 'Energielabel', value: features.energy.length <= 6 ? features.energy : features.energy.charAt(0) },
        features.constructionYear && { label: 'Bouwjaar', value: features.constructionYear },
        features.type && { label: 'Woningtype', value: features.type },
    ].filter(Boolean) as { label: string; value: string | number }[]

    const mediaLinks = [
        { icon: 'smart_display', label: 'Video', value: property.video_url },
        { icon: 'architecture', label: 'Plattegrond', value: property.floorplan_url },
        { icon: 'view_in_ar', label: '360° Tour', value: property.tour_360_url },
        ...(property.custom_links || []).map((l: any) => ({ icon: 'link', label: l.label, value: l.url })),
    ].filter(m => m.value)

    const getEmbedUrl = (url: string) => {
        if (!url) return url
        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/)
        if (ytMatch?.[1]) return `https://www.youtube.com/embed/${ytMatch[1].split('&')[0]}`
        const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(.+)/)
        if (vimeoMatch?.[1]) return `https://player.vimeo.com/video/${vimeoMatch[1]}`
        return url
    }

    const isBlockedDomain = (url: string) => {
        if (!url) return false
        const blocked = ['funda.nl', 'jaap.nl', 'huislijn.nl', 'pararius.nl', 'facebook.com', 'google.com', 'linkedin.com', 'instagram.com']
        return blocked.some(d => url.toLowerCase().includes(d))
    }

    const isVoiceActive = isConnected || isListening || isSpeaking
    const addressParts = property.address?.split(',') || []
    const streetName = addressParts[0]?.trim() || property.address

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#0df2a2]/20">

            {/* ── HEADER ── */}
            <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-[#0df2a2] flex items-center justify-center">
                        <span className="material-symbols-outlined text-black text-lg">graphic_eq</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">
                        VOICEREALTY<span className="text-[#0df2a2]">AI</span>
                    </span>
                </div>
                {isAdmin && (
                    <div className="flex items-center gap-3">
                        <Link href={`/properties/${property.id}`} className="px-4 py-2 rounded-xl bg-[#0df2a2] text-black font-bold text-sm hover:bg-emerald-400 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            <span className="hidden sm:inline">Woning Bewerken</span>
                        </Link>
                        <button onClick={() => setShowQRModal(true)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm font-bold text-gray-400 hover:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
                            <span className="hidden sm:inline">QR Code</span>
                        </button>
                    </div>
                )}
            </header>

            {/* ── MAIN HERO: TWO-COLUMN ── */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                    {/* ── LEFT: GALLERY ── */}
                    <div className="flex-1 lg:max-w-[58%]">
                        {/* Main photo */}
                        <div
                            className="relative rounded-3xl overflow-hidden bg-[#111] aspect-[4/3] cursor-pointer group"
                            onClick={() => allImages.length > 0 && setShowGallery(true)}
                        >
                            {allImages.length > 0 ? (
                                <img
                                    src={allImages[activeIndex]}
                                    alt={property.address}
                                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-600 text-[80px]">image</span>
                                </div>
                            )}
                            {/* Badge */}
                            <div className="absolute top-5 left-5">
                                <span className="bg-[#0df2a2] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                                    {property.status === 'active' ? 'Actief Aanbod' : 'Beschikbaar'}
                                </span>
                            </div>
                            {/* All photos button */}
                            {allImages.length > 1 && (
                                <div className="absolute bottom-5 right-5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 group-hover:bg-[#0df2a2] group-hover:text-black transition-all">
                                    <span className="material-symbols-outlined text-[14px]">photo_library</span>
                                    {allImages.length} foto's
                                </div>
                            )}
                        </div>

                        {/* Thumbnails — grid on mobile, flex on desktop */}
                        {allImages.length > 1 && (
                            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 mt-4">
                                {allImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        className={`rounded-xl overflow-hidden transition-all border-2 h-14 w-20 flex-shrink-0 ${i === activeIndex
                                            ? 'border-[#0df2a2] ring-2 ring-[#0df2a2]/20'
                                            : 'border-transparent opacity-50 hover:opacity-80'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Media links */}
                        {mediaLinks.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-5">
                                {mediaLinks.map((m, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setMediaModal({ url: getEmbedUrl(m.value), title: m.label })}
                                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#0df2a2]/40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">{m.icon}</span>
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: INFO ── */}
                    <div className="lg:w-[42%] flex flex-col gap-6">

                        {/* Title + price */}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
                                {features.type || 'Woning'}
                            </h1>
                            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-[#0df2a2] mt-1">
                                {streetName}
                            </h2>
                            <p className="text-gray-400 text-sm mt-2 italic">{property.address}{property.city ? `, ${property.city}` : ''}</p>
                            {property.price > 0 && (
                                <p className="text-3xl font-bold text-[#0df2a2] mt-4">
                                    € {property.price?.toLocaleString()} <span className="text-gray-400 text-base font-normal">k.k.</span>
                                </p>
                            )}
                        </div>

                        {/* Stat cards */}
                        {statCards.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                {statCards.slice(0, 3).map((stat, i) => (
                                    <div key={i} className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-widest leading-tight">{stat.label}</span>
                                        <span className="text-xl font-bold text-white mt-1">{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {statCards.length > 3 && (
                            <div className="grid grid-cols-3 gap-3 -mt-3">
                                {statCards.slice(3, 6).map((stat, i) => (
                                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
                                        <span className="text-[10px] uppercase text-gray-600 font-semibold tracking-widest leading-tight">{stat.label}</span>
                                        <span className="text-base font-bold text-white mt-0.5">{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* AI AGENT CARD */}
                        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center gap-4">
                            <button
                                onClick={isVoiceActive ? stopSession : startSession}
                                className={`size-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isVoiceActive
                                    ? 'bg-red-500 hover:bg-red-400 shadow-red-500/30 animate-pulse'
                                    : 'bg-[#0df2a2] hover:bg-emerald-400 shadow-[#0df2a2]/30'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-black text-[28px]">
                                    {isSpeaking ? 'record_voice_over' : 'mic'}
                                </span>
                            </button>

                            <div>
                                <h3 className="text-xl font-bold text-white">Praat met onze AI Makelaar</h3>
                                <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                                    {isVoiceActive
                                        ? isSpeaking ? 'AI Makelaar spreekt...' : isListening ? 'Luisteren...' : 'Verbonden!'
                                        : 'Vraag naar verbouwingsopties, buurtinformatie of plan direct een bezichtiging.'}
                                </p>
                            </div>

                            <button
                                onClick={isVoiceActive ? stopSession : startSession}
                                className={`w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 ${isVoiceActive
                                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                                    : 'bg-[#0df2a2] text-black hover:bg-emerald-400 shadow-[0_0_30px_rgba(13,242,162,0.2)]'
                                    }`}
                            >
                                {isVoiceActive
                                    ? 'Gesprek Beëindigen'
                                    : <><span>Start AI Conversatie</span><span className="material-symbols-outlined text-[20px]">arrow_forward</span></>
                                }
                            </button>

                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-[#0df2a2] animate-pulse" />
                                <span className="text-xs text-gray-400">{isVoiceActive ? 'Gesprek actief' : 'AI is online en klaar om te helpen'}</span>
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl w-full text-center">{error}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    ALL INFO BELOW — dark cards in new style
                ══════════════════════════════════════ */}
                <div className="mt-14 space-y-6">

                    {/* Description */}
                    {property.description && (
                        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="size-8 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">notes</span>
                                </div>
                                <h3 className="text-base font-bold text-white">Omschrijving</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">{property.description}</p>
                        </div>
                    )}

                    {/* Details table */}
                    <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
                        <div className="flex items-center gap-3 p-6 pb-4 border-b border-white/5">
                            <div className="size-8 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">home</span>
                            </div>
                            <h3 className="text-base font-bold text-white">Woningdetails</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                { label: 'Adres', value: property.address },
                                { label: 'Stad', value: property.city },
                                { label: 'Vraagprijs', value: property.price ? `€ ${property.price.toLocaleString()}` : null },
                                { label: 'Oppervlakte', value: property.surface_area ? `${property.surface_area} m²` : null },
                                { label: 'Slaapkamers', value: property.bedrooms },
                                { label: 'Badkamers', value: property.bathrooms },
                                ...Object.entries(features).map(([key, value]) => ({
                                    label: featureLabels[key] || key,
                                    value: value as string,
                                    isEnergy: key === 'energy',
                                })),
                            ].filter(r => r.value).map((row, i) => (
                                <div key={i} className="flex flex-col sm:grid sm:grid-cols-2 px-6 py-5 gap-1 sm:gap-0 hover:bg-white/[0.02] transition-colors">
                                    <span className="text-xs sm:text-sm text-gray-500 font-bold sm:font-medium uppercase sm:normal-case tracking-wider sm:tracking-normal">{row.label}</span>
                                    <span className="text-sm text-white font-semibold">
                                        {(row as any).isEnergy ? (
                                            <span className="inline-block bg-[#0df2a2]/10 text-[#0df2a2] border border-[#0df2a2]/30 px-2 py-0.5 rounded-lg text-xs font-bold">
                                                {row.value}
                                            </span>
                                        ) : row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bezichtiging CTA */}
                    <div className="bg-gradient-to-br from-[#0df2a2]/10 to-transparent border border-[#0df2a2]/20 rounded-3xl p-8 text-center">
                        <h3 className="text-xl font-bold text-white mb-2">Interesse in deze woning?</h3>
                        <p className="text-gray-400 text-sm mb-6">Plan een bezichtiging of stel direct een vraag aan onze AI Makelaar.</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={isVoiceActive ? stopSession : startSession}
                                className="flex items-center justify-center gap-2 bg-[#0df2a2] hover:bg-emerald-400 text-black font-bold px-8 py-3.5 rounded-2xl transition-all shadow-[0_0_30px_rgba(13,242,162,0.2)]"
                            >
                                <span className="material-symbols-outlined text-[20px]">mic</span>
                                {isVoiceActive ? 'Gesprek Beëindigen' : 'Stel een Vraag via AI'}
                            </button>
                            {isAdmin && (
                                <Link
                                    href={`/properties/${property.id}`}
                                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all"
                                >
                                    <span className="material-symbols-outlined text-[20px] text-[#0df2a2]">edit</span>
                                    Woning Bewerken
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/5 mt-16 px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-600 text-xs">
                <p>© {new Date().getFullYear()} VoiceRealty AI. Alle rechten voorbehouden.</p>
                <div className="flex gap-6">
                    <a href="#" className="hover:text-gray-400 transition-colors uppercase tracking-wider">Privacy</a>
                    <a href="#" className="hover:text-gray-400 transition-colors uppercase tracking-wider">Voorwaarden</a>
                    <a href="#" className="hover:text-gray-400 transition-colors uppercase tracking-wider">Contact</a>
                </div>
            </footer>

            {/* ── QR MODAL ── */}
            {showQRModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowQRModal(false)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-5 shadow-[0_0_60px_rgba(13,242,162,0.1)]" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <div className="size-8 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">campaign</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">Marketing QR Code</h3>
                        </div>
                        <p className="text-xs text-gray-500 text-center">Gereed voor flyers en te-koop borden</p>
                        <div ref={qrRef} className="bg-white p-5 rounded-2xl shadow-inner">
                            <QRCodeSVG
                                value={`https://voicerealty.ai/woning/${property.id}`}
                                size={200}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: '/logo-icon.png',
                                    x: undefined, y: undefined,
                                    height: 40, width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <div className="w-full space-y-3">
                            <button
                                onClick={() => {
                                    const svg = qrRef.current?.querySelector('svg')
                                    if (svg) {
                                        const svgData = new XMLSerializer().serializeToString(svg)
                                        const canvas = document.createElement('canvas')
                                        const ctx = canvas.getContext('2d')
                                        const img = new window.Image()
                                        img.onload = () => {
                                            canvas.width = img.width; canvas.height = img.height
                                            ctx?.drawImage(img, 0, 0)
                                            const link = document.createElement('a')
                                            link.download = `QR-${property.address}.png`
                                            link.href = canvas.toDataURL('image/png')
                                            link.click()
                                        }
                                        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
                                    }
                                }}
                                className="w-full py-3.5 bg-[#0df2a2] hover:bg-emerald-400 text-black font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Download PNG
                            </button>
                            <button onClick={() => setShowQRModal(false)} className="w-full py-3 text-gray-500 hover:text-white font-bold text-sm transition-colors">
                                Sluiten
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ── FULLSCREEN LIGHTBOX GALLERY ── */}
            {showGallery && (
                <div className="fixed inset-0 z-[100] flex bg-black/95 backdrop-blur-sm">
                    {/* Left: vertical thumbnail strip */}
                    <div className="hidden md:flex flex-col gap-2 p-4 overflow-y-auto w-28 bg-black/60 border-r border-white/5 shrink-0">
                        {allImages.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIndex(i)}
                                className={`rounded-xl overflow-hidden border-2 aspect-[4/3] w-full shrink-0 transition-all ${i === activeIndex ? 'border-[#0df2a2] ring-2 ring-[#0df2a2]/20' : 'border-transparent opacity-40 hover:opacity-80'
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    {/* Right: main image area */}
                    <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <span className="text-sm font-bold text-white">{activeIndex + 1} / {allImages.length}</span>
                            <span className="text-sm text-gray-400 hidden sm:block">{property.address}</span>
                            <button onClick={() => setShowGallery(false)} className="size-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Image + arrows */}
                        <div className="flex-1 relative flex items-center justify-center p-4">
                            <img
                                src={allImages[activeIndex]}
                                alt={`Foto ${activeIndex + 1}`}
                                className="max-h-full max-w-full object-contain rounded-2xl"
                            />
                            {activeIndex > 0 && (
                                <button
                                    onClick={() => setActiveIndex(i => i - 1)}
                                    className="absolute left-6 size-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                            )}
                            {activeIndex < allImages.length - 1 && (
                                <button
                                    onClick={() => setActiveIndex(i => i + 1)}
                                    className="absolute right-6 size-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile thumbnails */}
                        <div className="md:hidden flex gap-2 p-3 overflow-x-auto bg-black/40 border-t border-white/5">
                            {allImages.map((img, i) => (
                                <button key={i} onClick={() => setActiveIndex(i)} className={`shrink-0 h-12 w-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-[#0df2a2]' : 'border-transparent opacity-50'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}


            {/* ── MEDIA MODAL ── */}
            {mediaModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl" onClick={() => setMediaModal(null)}>
                    <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl border border-white/10 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-bold text-white">{mediaModal.title}</h3>
                                <a href={mediaModal.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[#0df2a2] hover:underline flex items-center gap-1">
                                    OPEN EXTERN <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                </a>
                            </div>
                            <button onClick={() => setMediaModal(null)} className="size-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <iframe
                            src={isBlockedDomain(mediaModal.url) ? `/api/proxy?url=${encodeURIComponent(mediaModal.url)}` : mediaModal.url}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={mediaModal.title}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
