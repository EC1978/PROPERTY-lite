'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface PropertyDetailsClientProps {
    property: any
}

export default function PropertyDetailsClient({ property }: PropertyDetailsClientProps) {
    const [activeMedia, setActiveMedia] = useState({
        type: 'image',
        url: property.image_url
    })

    const getFeature = (key: string) => (property.features as any)?.[key] || '-'

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

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#10b77f]/30">

            {/* LEFT COLUMN: DYNAMIC MEDIA PLAYER */}
            <div className="relative w-full h-[60vh] md:h-screen md:w-[60%] shrink-0 @container bg-[#050606]">
                {activeMedia.type === 'image' ? (
                    activeMedia.url ? (
                        <Image
                            src={activeMedia.url}
                            alt={property.address}
                            fill
                            className="object-cover animate-in fade-in duration-700"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30">
                            Geen afbeelding
                        </div>
                    )
                ) : (
                    <div className="w-full h-full relative">
                        {/* Detection for links that likely block iframing (Funda, etc) */}
                        {activeMedia.url?.includes('funda.nl') || activeMedia.url?.includes('fundainbusiness.nl') ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-[#050606]">
                                <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                    <span className="material-symbols-outlined text-primary text-4xl">open_in_new</span>
                                </div>
                                <h3 className="text-xl font-bold mb-3">Externe Media</h3>
                                <p className="text-white/40 text-sm max-w-sm mb-8 leading-relaxed">
                                    Deze website staat niet toe om direct getoond te worden. Klik op de knop hieronder om de media te bekijken in een veilig venster.
                                </p>
                                <a
                                    href={activeMedia.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_10px_30px_rgba(16,183,127,0.2)]"
                                >
                                    Open Externe Media
                                </a>
                            </div>
                        ) : (
                            <iframe
                                src={getEmbedUrl(activeMedia.url)}
                                className="w-full h-full border-none animate-in zoom-in-95 duration-500"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        )}
                    </div>
                )}

                {/* Floating AI Badge */}
                <div className="absolute top-6 right-6 z-20">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b77f] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b77f]"></span>
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">Live AI</span>
                    </div>
                </div>

                {/* Back Button Overlay */}
                <div className="absolute top-6 left-6 z-20">
                    <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-all group">
                        <span className="material-symbols-outlined text-white transition-transform group-hover:-translate-x-0.5">arrow_back</span>
                    </Link>
                </div>

                {/* Overlay for Image Mode */}
                {activeMedia.type === 'image' && (
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10 md:hidden"></div>
                )}

                {/* MOBILE ONLY: QUICK MEDIA & GALLERY (UNDER PHOTO) */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 md:hidden bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-transparent pt-20">
                    <div className="flex flex-col gap-6">
                        {/* Media Links (Video, 360, etc) */}
                        <div className="flex flex-wrap gap-2">
                            {property.video_url && (
                                <button onClick={() => setActiveMedia({ type: 'video', url: property.video_url })} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] transition-all border ${activeMedia.type === 'video' ? 'bg-red-500 text-white border-red-500' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                    <span className="material-symbols-outlined text-base">play_circle</span> VIDEO
                                </button>
                            )}
                            {property.tour_360_url && (
                                <button onClick={() => setActiveMedia({ type: '360', url: property.tour_360_url })} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] transition-all border ${activeMedia.type === '360' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                    <span className="material-symbols-outlined text-base">360</span> 360° TOUR
                                </button>
                            )}
                            {property.floorplan_url && (
                                <button onClick={() => setActiveMedia({ type: 'floorplan', url: property.floorplan_url })} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] transition-all border ${activeMedia.type === 'floorplan' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'}`}>
                                    <span className="material-symbols-outlined text-base">map</span> PLATTEGROND
                                </button>
                            )}
                            {property.custom_links?.map((link: { label: string, url: string }, i: number) => (
                                <button key={i} onClick={() => setActiveMedia({ type: 'custom', url: link.url })} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] transition-all border ${activeMedia.url === link.url ? 'bg-primary text-black border-primary' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                    <span className="material-symbols-outlined text-base">link</span> {link.label.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Gallery Thumbnails (Mobile Swipe) */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x">
                            {property.images.map((img: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveMedia({ type: 'image', url: img })}
                                    className={`relative flex-shrink-0 size-16 rounded-xl overflow-hidden border transition-all snap-center ${activeMedia.type === 'image' && activeMedia.url === img ? 'border-primary ring-2 ring-primary/20 scale-90' : 'border-white/10'}`}
                                >
                                    <Image src={img} alt="" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: CONTENT SCROLL */}
            <div className="flex flex-col w-full md:w-[40%] md:h-screen md:overflow-y-auto bg-[#0A0A0A] relative border-l border-white/10 scrollbar-hide">

                <div className="p-6 md:p-10 flex flex-col gap-8">

                    {/* Header Info */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            {property.city && <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#10b77f] bg-[#10b77f]/10 px-3 py-1 rounded-full">{property.city}</span>}
                            <Link
                                href={`/properties/${property.id}/edit`}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all text-white/60 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Bewerken
                            </Link>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white">{property.address}</h1>
                        <p className="text-3xl font-semibold text-[#10b77f]">€ {property.price?.toLocaleString()} <span className="text-lg text-white/40 font-normal ml-1">k.k.</span></p>
                    </div>

                    {/* Quick Specs Grid */}
                    <div className="grid grid-cols-3 gap-3 border-y border-white/5 py-8">
                        <div className="flex flex-col items-center gap-3">
                            <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/60">bed</span>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-bold text-white">{property.bedrooms || '-'}</p>
                                <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold">Kamers</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/60">bathtub</span>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-bold text-white">{property.bathrooms || '-'}</p>
                                <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold">Badkamers</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <div className="size-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/60">square_foot</span>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-bold text-white">{property.surface_area || '-'} m²</p>
                                <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold">Oppervlak</p>
                            </div>
                        </div>
                    </div>

                    {/* Media Buttons (DESKTOP ONLY) */}
                    <div className="hidden md:flex flex-wrap gap-3">
                        {property.video_url && (
                            <button
                                onClick={() => setActiveMedia({ type: 'video', url: property.video_url })}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all border ${activeMedia.type === 'video' ? 'bg-red-500 text-white border-red-500' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
                            >
                                <span className="material-symbols-outlined text-lg">play_circle</span>
                                VIDEO
                            </button>
                        )}
                        {property.tour_360_url && (
                            <button
                                onClick={() => setActiveMedia({ type: '360', url: property.tour_360_url })}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all border ${activeMedia.type === '360' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'}`}
                            >
                                <span className="material-symbols-outlined text-lg">360</span>
                                360° TOUR
                            </button>
                        )}
                        {property.floorplan_url && (
                            <button
                                onClick={() => setActiveMedia({ type: 'floorplan', url: property.floorplan_url })}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all border ${activeMedia.type === 'floorplan' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20'}`}
                            >
                                <span className="material-symbols-outlined text-lg">map</span>
                                PLATTEGROND
                            </button>
                        )}
                        {property.custom_links?.map((link: { label: string, url: string }, i: number) => (
                            <button
                                key={i}
                                onClick={() => setActiveMedia({ type: 'custom', url: link.url })}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all border ${activeMedia.url === link.url ? 'bg-primary text-black border-primary' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}
                            >
                                <span className="material-symbols-outlined text-lg">link</span>
                                {link.label.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Gallery Thumbnails (DESKTOP ONLY) */}
                    {property.images && property.images.length > 0 && (
                        <div className="hidden md:block space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <span className="material-symbols-outlined text-[#10b77f] text-lg">photo_library</span>
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Galerij ({property.images.length})</span>
                            </div>

                            <div className="grid md:grid-cols-5 gap-3 px-1">
                                {property.images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveMedia({ type: 'image', url: img })}
                                        className={`relative aspect-square rounded-2xl overflow-hidden border transition-all ${activeMedia.type === 'image' && activeMedia.url === img ? 'border-primary ring-4 ring-primary/20 scale-90 shadow-2xl' : 'border-white/10 hover:border-primary/50'}`}
                                    >
                                        <Image src={img} alt={`Thumbnail ${i}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Voice CTA Section */}
                    <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 rounded-[2rem] p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <span className="material-symbols-outlined text-[120px]">graphic_eq</span>
                        </div>
                        <div className="text-center space-y-2 relative z-10">
                            <h3 className="text-lg font-bold">Stel een vraag aan AI</h3>
                            <p className="text-xs text-white/40 max-w-[200px] mx-auto leading-relaxed">Vraag direct naar de buurt, erfpacht, energiekosten of plan een bezichtiging.</p>
                        </div>
                        <Link href={`/woning/${property.id}`} className="relative group/btn flex flex-col items-center justify-center size-44 rounded-full bg-primary text-black shadow-[0_0_50px_rgba(16,183,127,0.3)] hover:shadow-[0_0_70px_rgba(16,183,127,0.5)] transition-all hover:scale-105 active:scale-95">
                            <span className="material-symbols-outlined !text-4xl mb-1">mic</span>
                            <span className="text-xs font-black uppercase tracking-widest">Start Voice</span>
                            <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20 pointer-events-none"></div>
                        </Link>
                    </div>

                    {/* Kenmerken / Features Section (THE MISSING DATA) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-base">manage_search</span>
                            </div>
                            <h3 className="font-bold text-white uppercase tracking-wider text-sm">Woningkenmerken</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { label: 'Bouwjaar', value: getFeature('constructionYear'), icon: 'event' },
                                { label: 'Woningtype', value: getFeature('type'), icon: 'home' },
                                { label: 'Energielabel', value: getFeature('energy'), icon: 'bolt' },
                                { label: 'Onderhoud', value: getFeature('maintenance'), icon: 'build_circle' },
                                { label: 'Ligging', value: getFeature('surroundings'), icon: 'location_on' },
                                { label: 'Indeling', value: getFeature('layout'), icon: 'account_tree' }
                            ].map((f, i) => (
                                <div key={i} className="flex gap-4">
                                    <span className="material-symbols-outlined text-white/20 text-xl">{f.icon}</span>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{f.label}</p>
                                        <p className="text-sm text-white/80 leading-relaxed">{f.value}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Custom Features */}
                            {Object.entries(property.features || {})
                                .filter(([key]) => !['constructionYear', 'type', 'energy', 'maintenance', 'surroundings', 'layout'].includes(key))
                                .map(([label, value], i) => (
                                    <div key={i} className="flex gap-4">
                                        <span className="material-symbols-outlined text-white/20 text-xl">info</span>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</p>
                                            <p className="text-sm text-white/80 leading-relaxed">{value as string}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Description */}
                    {property.description && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">notes</span>
                                Omschrijving
                            </h3>
                            <p className="text-sm md:text-base text-white/60 leading-relaxed whitespace-pre-wrap">
                                {property.description}
                            </p>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-10 flex flex-col gap-3">
                        <button className="h-16 rounded-2xl bg-white text-black font-extrabold tracking-widest uppercase text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">calendar_today</span>
                            Bezichtiging Plannen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
