'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from './layout/Sidebar'
import MobileNav from './layout/MobileNav'
import MobileMenu from './layout/MobileMenu'

interface Property {
    id: string
    address: string
    city?: string
    price: number
    created_at: string
    image_url?: string
}

interface DashboardLiveViewProps {
    userEmail: string
    userId: string
    initialProperties: Property[]
    initialActiveCount: number
}

export default function DashboardLiveView({ userEmail, userId, initialProperties, initialActiveCount }: DashboardLiveViewProps) {
    const [properties, setProperties] = useState<Property[]>(initialProperties)
    const [activeCount, setActiveCount] = useState(initialActiveCount)
    const [interactions] = useState(52)

    const supabase = createClient()
    const router = useRouter()

    // --- Realtime subscription (unchanged) ---
    useEffect(() => {
        const channel = supabase
            .channel('realtime-dashboard')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'properties',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newProperty = payload.new as Property
                        if ((newProperty as any).status === 'active') {
                            setProperties(prev => [newProperty, ...prev].slice(0, 5))
                            setActiveCount(prev => prev + 1)
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        // Refresh if status changed (likely archived or activated)
                        router.refresh()
                    } else if (payload.eventType === 'DELETE') {
                        router.refresh()
                        setActiveCount(prev => Math.max(0, prev - 1))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, userId, router])

    // --- File/URL Processing Logic (unchanged) ---
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStatus, setProcessingStatus] = useState<string>('')
    const [urlInput, setUrlInput] = useState('')

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    const createPropertyAndRedirect = async (extractedData: any) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: property, error } = await supabase.from('properties').insert({
            user_id: user.id,
            address: extractedData.address || 'Adres onbekend',
            city: extractedData.city || 'Onbekend',
            price: extractedData.price || 0,
            description: extractedData.description || 'Geen beschrijving beschikbaar.',
            surface_area: extractedData.surface_area || 0,
            bedrooms: extractedData.bedrooms || 0,
            bathrooms: extractedData.bathrooms || 0,
            image_url: extractedData.image_url || null,
            images: extractedData.scraped_images || [],
            features: extractedData.features || {},
            video_url: extractedData.video_url || null,
            floorplan_url: extractedData.floorplan_url || null,
            tour_360_url: extractedData.tour_360_url || null,
            status: 'active'
        }).select().single()

        if (error) {
            console.error('Error creating property:', error)
            alert(`Fout bij opslaan: ${error.message}`)
            return
        }

        router.push(`/properties/${property.id}`)
    }

    const processFile = async (file: File) => {
        if (isProcessing) return
        setIsProcessing(true)
        setProcessingStatus('AI documenten analyseren...')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const { extractPropertyFromPdf } = await import('@/app/properties/upload-actions')
            const extractedData = await extractPropertyFromPdf(formData)

            await createPropertyAndRedirect(extractedData)

        } catch (error: any) {
            console.error('Error processing file:', error)
            alert(`Fout bij PDF verwerking: ${error.message}`)
            setIsProcessing(false)
        }
    }

    const handleUrlScrape = async () => {
        if (!urlInput) return
        if (isProcessing) return

        setIsProcessing(true)
        setProcessingStatus('De Agent bezoekt de website...')

        try {
            const { scrapeProperty } = await import('@/app/actions/scrape-property')
            const result = await scrapeProperty(urlInput)

            if (!result.success) {
                throw new Error(result.error)
            }

            await createPropertyAndRedirect(result.data)

        } catch (error: any) {
            console.error('Error scraping url:', error)
            alert(`Fout bij website bezoek: ${error.message}`)
            setIsProcessing(false)
        }
    }

    // --- Greeting based on time ---
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'
    const userName = userEmail?.split('@')[0] || 'Makelaar'

    return (
        <div className="flex min-h-screen bg-[#f5f8f7] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-[Inter,sans-serif] relative overflow-x-hidden">
            <Sidebar userEmail={userEmail} />

            {/* ===== STITCH HEADER (mobile) ===== */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-[#f5f8f7]/80 dark:bg-[#050505]/90 backdrop-blur-md border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                    <MobileMenu userEmail={userEmail} />
                    <div>
                        <h1 className="text-[10px] font-semibold tracking-wide text-gray-500 dark:text-gray-400 uppercase">VoiceRealty AI</h1>
                        <h2 className="text-lg font-bold leading-none tracking-tight">Dashboard</h2>
                    </div>
                </div>
                <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-white">
                    <span className="material-symbols-outlined text-[24px]">notifications</span>
                    <span className="absolute top-2 right-2 size-2 bg-[#0df2a2] rounded-full" />
                </button>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <main className="flex-1 md:ml-72 p-6 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 bg-[#f5f8f7] dark:bg-[#050505]">
                <div className="max-w-5xl mx-auto">

                    {/* Processing Overlay */}
                    {isProcessing && (
                        <div className="fixed inset-0 bg-white/80 dark:bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="relative h-20 w-20 mb-6">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-[#0df2a2] animate-[spin_3s_linear_infinite]" strokeWidth="8" strokeDasharray="283" strokeDashoffset="155" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#0df2a2]">AI</div>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{processingStatus}</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Moment geduld...</p>
                        </div>
                    )}

                    {/* ===== GREETING ===== */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                                {greeting}, <span className="text-[#0df2a2]">{userName}.</span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Je AI-agenten beheren momenteel {activeCount} actieve gesprekken.
                            </p>
                        </div>
                        <Link href="/shop" className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-5 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all group shrink-0 self-start">
                            <span className="material-symbols-outlined text-[#0df2a2] group-hover:scale-110 transition-transform">shopping_bag</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-900 dark:text-white">VoiceRealty Shop</span>
                                <span className="text-[10px] text-gray-500">Upgrade je account</span>
                            </div>
                        </Link>
                    </div>

                    {/* ===== GRID LAYOUT ===== */}
                    <div className="grid grid-cols-6 gap-4">

                        {/* ===== UPLOAD ZONE (full width) ===== */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`col-span-6 relative group overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${isDragging
                                ? 'border-[#0df2a2] bg-[#0df2a2]/10 scale-[1.01]'
                                : 'border-[#0df2a2]/30 dark:border-[#0df2a2]/20 bg-white dark:bg-[#1c1c1e]/50 hover:border-[#0df2a2]'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0df2a2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            {/* Desktop: 3-column layout. Mobile: stacked */}
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 py-10 px-8">

                                {/* Left: Icon + Text */}
                                <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1">
                                    <div className="size-14 rounded-full bg-[#0df2a2]/10 flex items-center justify-center mb-4 text-[#0df2a2] group-hover:scale-110 transition-transform duration-300">
                                        <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Upload Woning PDF</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px]">
                                        Sleep je brochure hierheen of tik om te zetten naar een Voice AI-agent.
                                    </p>
                                </div>

                                {/* Divider (desktop only) */}
                                <div className="hidden md:block w-px self-stretch bg-[#0df2a2]/10" />

                                {/* Right: URL Input + Button */}
                                <div className="flex flex-col items-center md:items-end gap-4 flex-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2 w-full max-w-md relative z-20">
                                        <div className="relative flex-1">
                                            <span className="material-symbols-outlined text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">link</span>
                                            <input
                                                type="url"
                                                placeholder="Of plak een Funda link..."
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && urlInput) handleUrlScrape() }}
                                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2]/30 transition-colors cursor-text"
                                            />
                                        </div>
                                        {urlInput && (
                                            <button
                                                onClick={handleUrlScrape}
                                                className="bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider hover:opacity-90 transition-all"
                                            >
                                                Importeer
                                            </button>
                                        )}
                                    </div>

                                    <label className="flex items-center gap-2 bg-[#0df2a2] hover:bg-emerald-400 text-[#050505] font-bold py-2.5 px-6 rounded-full transition-colors shadow-[0_0_20px_rgba(13,242,162,0.3)] cursor-pointer">
                                        <span className="material-symbols-outlined text-[20px]">add</span>
                                        <span>Agent aanmaken</span>
                                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ===== STAT CARD: Actieve Woningen ===== */}
                        <div className="col-span-3 rounded-2xl bg-white dark:bg-[#1c1c1e] p-5 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <span className="material-symbols-outlined text-[24px]">real_estate_agent</span>
                                </div>
                                <span className="text-xs font-medium text-[#0df2a2] bg-[#0df2a2]/10 px-2 py-1 rounded-full">+12%</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Actieve woningen</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{activeCount}</p>
                            </div>
                        </div>

                        {/* ===== STAT CARD: Interacties ===== */}
                        <div className="col-span-3 rounded-2xl bg-white dark:bg-[#1c1c1e] p-5 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col justify-between h-[160px]">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
                                </div>
                                <span className="text-xs font-medium text-[#0df2a2] bg-[#0df2a2]/10 px-2 py-1 rounded-full">+5%</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Interacties</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{interactions}</p>
                            </div>
                        </div>

                        {/* ===== SECTION HEADER: Woningoverzicht ===== */}
                        <div className="col-span-6 pt-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Woningoverzicht</h3>
                            <Link href="/properties" className="text-sm font-medium text-[#0df2a2] hover:text-emerald-300">Bekijk alles</Link>
                        </div>

                        {/* ===== PROPERTY CARDS ===== */}
                        {properties.length > 0 ? properties.map((prop, i) => (
                            <Link
                                key={prop.id}
                                href={`/properties/${prop.id}`}
                                className="col-span-6 md:col-span-2 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col h-full">
                                    {/* Image */}
                                    <div className="h-44 relative bg-gray-100 dark:bg-white/5">
                                        {prop.image_url ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url("${prop.image_url}")` }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[48px]">image</span>
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                                            <span className="material-symbols-outlined text-[#0df2a2] text-[10px] animate-pulse">fiber_manual_record</span>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">Actief</span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 flex flex-col justify-between flex-1">
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{prop.address}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                {prop.city || 'Amsterdam'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-4 mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Prijs</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white whitespace-nowrap">€{prop.price?.toLocaleString()}</span>
                                                </div>
                                                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Status</span>
                                                    <span className="text-base font-bold text-[#0df2a2]">Actief</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/properties/${prop.id}/ready`) }}
                                            className="w-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/qr border border-transparent hover:border-[#0df2a2]/50"
                                        >
                                            <span className="material-symbols-outlined text-[20px] text-[#0df2a2] group-hover/qr:scale-110 transition-transform">qr_code_2</span>
                                            <span>QR-code downloaden</span>
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-6 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 p-8 text-center">
                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[48px] mb-2">home_work</span>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Nog geen woningen gevonden. Upload je eerste PDF hierboven!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* ===== FLOATING BOTTOM NAV ===== */}
            <MobileNav />

            {/* ===== AMBIENT BACKGROUND EFFECTS ===== */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#0df2a2]/5 blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[100px]" />
            </div>
        </div>
    )
}
