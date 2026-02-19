'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from './layout/Sidebar'
import MobileNav from './layout/MobileNav'

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
    // Stats from Stitch Design B1
    const [interactions] = useState('1.2k')

    // Activity mockup (aligned with Stitch "Interactions" or similar activity log if needed, but B1 focuses on stats/upload)

    const supabase = createClient()
    const router = useRouter()

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
                        setProperties(prev => [newProperty, ...prev].slice(0, 5)) // Increased limit slightly
                        setActiveCount(prev => prev + 1)
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

        router.push(`/properties/${property.id}/edit`)
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

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050606] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={userEmail} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-tight">Makelaar Dashboard</span>
                </div>
                <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {userEmail?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-6 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 max-w-7xl mx-auto space-y-8">

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="fixed inset-0 bg-white/80 dark:bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                        <div className="relative h-20 w-20 mb-6">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-800" strokeWidth="8" />
                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-emerald-500 animate-[spin_3s_linear_infinite]" strokeWidth="8" strokeDasharray="283" strokeDashoffset="155" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-500">AI</div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{processingStatus}</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Moment geduld...</p>
                    </div>
                )}

                {/* Hero Section */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-1">
                        Welkom terug, {userEmail?.split('@')[0]}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Je AI-gedreven woningportefeuille presteert <span className="text-emerald-500 font-semibold">+12%</span> boven doelstelling.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column: Upload & Stats */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* AI Property Processor (Interactive Upload Zone) */}
                        <div className="bg-white dark:bg-[#111] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>

                            <div className="flex items-center gap-3 mb-6 relative z-10">
                                <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-500 text-xl">smart_toy</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">AI Woning Processor</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Upload brochures of importeer URL</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 relative z-10">
                                {/* PDF Drop Zone */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`
                                        relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center text-center transition-all cursor-pointer group/drop
                                        ${isDragging
                                            ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]'
                                            : 'border-gray-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5'}
                                    `}
                                >
                                    <div className="size-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 group-hover/drop:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-emerald-500 text-xl">cloud_upload</span>
                                    </div>
                                    <h4 className="font-bold text-sm mb-1">Upload PDF</h4>
                                    <p className="text-[10px] text-gray-400 mb-4">Sleep document hierheen</p>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">
                                        Kies Bestand
                                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                                    </label>
                                </div>

                                {/* URL Import Zone */}
                                <div className="border border-gray-200 dark:border-white/5 rounded-2xl p-6 flex flex-col justify-between bg-gray-50 dark:bg-white/[0.02]">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="material-symbols-outlined text-gray-400 text-lg">link</span>
                                            <h4 className="font-bold text-sm">URL Import</h4>
                                        </div>
                                        <div className="relative group/input mb-3">
                                            <input
                                                type="url"
                                                placeholder="Funda link..."
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleUrlScrape}
                                        disabled={!urlInput}
                                        className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                                            ${urlInput ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90' : 'bg-gray-200 dark:bg-white/5 text-gray-400 cursor-not-allowed'}
                                        `}
                                    >
                                        Importeer
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Batch QR Tile - Using Stitch B1 styling */}
                        <Link href="/analytics" className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-[#1A1A1A] dark:to-[#111] rounded-3xl p-6 text-white flex items-center justify-between shadow-lg shadow-black/5 hover:scale-[1.02] transition-transform cursor-pointer">
                            <div>
                                <h4 className="font-bold text-lg mb-1">Genereer Marketing QR Codes</h4>
                                <p className="text-white/60 text-sm">Download QR codes voor je actieve woningaanbod voor op flyers en borden.</p>
                            </div>
                            <div className="size-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                                <span className="material-symbols-outlined">qr_code_2</span>
                            </div>
                        </Link>

                    </div>

                    {/* Right Column: Stats & Quick View */}
                    <div className="space-y-6">
                        {/* Stats Cards - Stitch B1 Style (Clean numbers) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Actief Aanbod</p>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{activeCount}</div>
                                <div className="flex items-center text-xs text-emerald-500 font-medium">
                                    <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                                    <span>+3 deze week</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Interacties</p>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{interactions}</div>
                                <div className="flex items-center text-xs text-emerald-500 font-medium">
                                    <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                                    <span>+12% vs vorige mnd</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Properties List - Managed Properties */}
                        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg">Beheerde Woningen</h3>
                                <Link href="/properties" className="text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                    Bekijk Alles
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {properties.length > 0 ? properties.map((prop, i) => (
                                    <Link key={prop.id} href={`/properties/${prop.id}/ready`} className="flex gap-4 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                                        <div className="size-12 rounded-lg bg-gray-100 dark:bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                                            {prop.image_url ? (
                                                <img src={prop.image_url} alt={prop.address} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-400">image</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">{prop.address}</h5>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                €{prop.price?.toLocaleString()} • {prop.city || 'Amsterdam'}
                                            </p>
                                        </div>
                                    </Link>
                                )) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">Nog geen woningen gevonden.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
