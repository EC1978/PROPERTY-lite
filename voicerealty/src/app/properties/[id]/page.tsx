
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ImageGallery from '@/components/ImageGallery'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!property) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Woning niet gevonden</h1>
                    <Link href="/dashboard" className="text-[#10b77f] hover:underline mt-4 block">Terug naar Dashboard</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#10b77f]/30">

            {/* Mobile Navigation Overlay */}
            <div className="fixed top-6 left-6 z-30 md:hidden">
                <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/40 transition-all">
                    <span className="material-symbols-outlined text-white">arrow_back</span>
                </Link>
            </div>

            {/* LEFT COLUMN: HERO IMAGE */}
            <div className="relative w-full h-[60vh] md:h-screen md:w-[60%] shrink-0 @container">
                <div className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-gray-800">
                    {property.image_url ? (
                        <Image
                            src={property.image_url}
                            alt={property.address}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30">
                            Geen afbeelding
                        </div>
                    )}
                </div>

                {/* Floating AI Badge */}
                <div className="absolute top-6 right-6 z-20">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b77f] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b77f]"></span>
                        </span>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white/90">Live AI</span>
                    </div>
                </div>

                {/* Mobile Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent z-10 md:hidden"></div>

                {/* Mobile Property Info Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20 md:hidden">
                    <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-1">
                        {property.address}
                    </h1>
                    <p className="text-2xl font-semibold text-[#10b77f]/90">
                        € {property.price?.toLocaleString()} k.k.
                    </p>
                    {property.city && <p className="text-sm text-white/50 mt-1 uppercase tracking-wider font-bold">{property.city}</p>}
                </div>
            </div>

            {/* RIGHT COLUMN: CONTENT SCROLL */}
            <div className="flex flex-col w-full md:w-[40%] md:h-screen md:overflow-y-auto bg-[#0A0A0A] relative border-l border-white/10">

                <div className="p-6 md:p-10 flex flex-col gap-8">

                    {/* Desktop Header */}
                    <div className="hidden md:flex items-center justify-between mb-2">
                        <Link href="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide group">
                            <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">arrow_back</span>
                            Terug
                        </Link>
                        {property.city && <span className="text-xs font-bold uppercase tracking-widest text-[#10b77f] bg-[#10b77f]/10 px-2 py-1 rounded">{property.city}</span>}
                    </div>

                    {/* Desktop Title Block */}
                    <div className="hidden md:block">
                        <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-2 text-white">{property.address}</h1>
                        <p className="text-3xl font-semibold text-[#10b77f]">€ {property.price?.toLocaleString()} <span className="text-lg text-white/40 font-normal">k.k.</span></p>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-3 gap-4 border-y border-white/10 py-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10">
                                <span className="material-symbols-outlined text-white/70">bed</span>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold">{property.bedrooms || '-'}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40">Slaapkamers</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10">
                                <span className="material-symbols-outlined text-white/70">bathtub</span>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold">{property.bathrooms || '-'}</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40">Badkamers</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10">
                                <span className="material-symbols-outlined text-white/70">square_foot</span>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold">{property.surface_area || '-'}m²</p>
                                <p className="text-[10px] uppercase tracking-wider text-white/40">Woonoppervlak</p>
                            </div>
                        </div>
                    </div>

                    {/* Media Tours & Links */}
                    {(property.video_url || property.floorplan_url || property.tour_360_url) && (
                        <div className="mb-8 flex flex-wrap gap-4">
                            {property.video_url && (
                                <a href={property.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors">
                                    <span className="material-symbols-outlined">play_circle</span>
                                    Video
                                </a>
                            )}
                            {property.tour_360_url && (
                                <a href={property.tour_360_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                                    <span className="material-symbols-outlined">360</span>
                                    360° Tour
                                </a>
                            )}
                            {property.floorplan_url && (
                                <a href={property.floorplan_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
                                    <span className="material-symbols-outlined">map</span>
                                    Plattegrond
                                </a>
                            )}
                        </div>
                    )}

                    {/* Image Gallery */}
                    {property.images && property.images.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#10b77f]">photo_library</span>
                                Galerij
                            </h2>
                            <ImageGallery images={property.images} />
                        </div>
                    )}

                    {/* Voice CTA */}
                    <div className="flex flex-col items-center justify-center py-4 md:py-8 gap-6 bg-white/5 rounded-3xl border border-white/5 p-6 shadow-innner">
                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium text-white/60">Heb je een vraag over deze woning?</p>
                        </div>
                        <Link href={`/woning/${property.id}`} className="group relative flex flex-col items-center justify-center w-full max-w-[280px] md:max-w-[240px] aspect-square rounded-3xl bg-[#10b77f] text-[#0A0A0A] shadow-[0_0_40px_rgba(16,183,127,0.3)] transition-transform active:scale-95 hover:scale-105">
                            <div className="mb-4">
                                <span className="material-symbols-outlined !text-5xl md:!text-6xl font-light">graphic_eq</span>
                            </div>
                            <span className="text-lg md:text-xl font-extrabold leading-tight text-center px-6">
                                Start Voice Assistant
                            </span>
                            <div className="mt-4 flex gap-1">
                                <span className="w-1 h-3 bg-[#0A0A0A]/40 rounded-full group-hover:animate-bounce"></span>
                                <span className="w-1 h-5 bg-[#0A0A0A]/60 rounded-full group-hover:animate-bounce [animation-delay:-0.2s]"></span>
                                <span className="w-1 h-2 bg-[#0A0A0A]/40 rounded-full group-hover:animate-bounce [animation-delay:-0.4s]"></span>
                            </div>

                            <div className="absolute inset-0 rounded-3xl border-2 border-[#10b77f] opacity-0 group-hover:opacity-100 group-hover:animate-ping -z-10"></div>
                        </Link>
                        <p className="text-[10px] text-white/30 italic text-center max-w-[240px]">
                            Direct antwoord op vragen over financiering, specificaties en bezichtigingen.
                        </p>
                    </div>

                    {/* Description Section */}
                    {property.description && (
                        <div className="py-4">
                            <h3 className="text-lg font-bold mb-4 text-white">Omschrijving</h3>
                            <p className="text-sm md:text-base text-white/70 leading-relaxed whitespace-pre-wrap">
                                {property.description}
                            </p>
                        </div>
                    )}

                    {/* Secondary Actions */}
                    <div className="mt-auto pt-4 flex flex-col gap-3">
                        <button className="flex items-center justify-center w-full h-14 rounded-xl border border-white/20 bg-white/5 text-white font-bold tracking-wide hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined mr-2">photo_library</span>
                            Bekijk alle foto's
                        </button>
                        <button className="flex items-center justify-center w-full h-14 rounded-xl bg-white text-black font-bold tracking-wide hover:bg-gray-200 transition-colors md:hidden">
                            <span className="material-symbols-outlined mr-2">calendar_today</span>
                            Bezichtiging Plannen
                        </button>
                    </div>

                    {/* Mobile Location Hint */}
                    <div className="flex items-center justify-center gap-2 opacity-30 pb-6 md:hidden">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{property.address}, {property.city || 'Nederland'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
