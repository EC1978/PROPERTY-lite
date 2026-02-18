'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import { scrapeProperty } from '@/app/actions/scrape-property'

export default function UploadWizard() {
    const [isDragging, setIsDragging] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStatus, setProcessingStatus] = useState<string>('')
    const [successPropertyId, setSuccessPropertyId] = useState<string | null>(null)
    const [urlInput, setUrlInput] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

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

        // Redirect to edit page for verification as requested
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
            setIsProcessing(false) // Only reset if error, success redirects
        }
    }

    const handleUrlScrape = async () => {
        if (!urlInput) return
        if (isProcessing) return

        setIsProcessing(true)
        setProcessingStatus('De Agent bezoekt de website...')

        try {
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

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }, [])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    if (isProcessing) {
        return (
            <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
                <div className="relative h-32 w-32 mb-8">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#10B981" strokeWidth="8" strokeDasharray="283" strokeDashoffset="155" className="animate-[spin_3s_linear_infinite]" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-primary">AI</div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{processingStatus}</h2>
                <p className="text-gray-500">Moment geduld, we extraheren de kenmerken.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#050606] text-white flex flex-col font-sans antialiased">
            {/* Top Bar */}
            <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-[#050606]/80 backdrop-blur-md z-30">
                <button onClick={() => router.back()} className="text-white/80 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[28px]">arrow_back</span>
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold tracking-tight">Woning Toevoegen</h1>
                    <div className="md:hidden flex gap-1 mt-1">
                        <div className="h-0.5 w-4 rounded-full bg-primary/40"></div>
                        <div className="h-0.5 w-1 rounded-full bg-white/10"></div>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white/20">person</span>
                </div>
            </div>

            <main className="flex-1 px-6 pb-24 max-w-6xl mx-auto w-full flex flex-col justify-center">
                {/* Header Section */}
                <div className="mb-12 text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-bold mb-3 tracking-tight">B1.1 Woning Toevoegen</h2>
                    <p className="text-primary text-sm md:text-base font-medium opacity-80">PDF brochure upload of intelligent URL importer</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* PDF Upload Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            relative group rounded-[3rem] border-2 border-dashed p-10 md:p-16 flex flex-col items-center text-center transition-all duration-700
                            ${isDragging
                                ? 'border-primary bg-primary/5 scale-[1.01] shadow-[0_0_50px_rgba(16,183,127,0.1)]'
                                : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10'}
                        `}
                    >
                        <div className="size-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                            <span className="material-symbols-outlined text-primary text-[42px]">cloud_upload</span>
                        </div>

                        <h3 className="text-2xl font-bold mb-3">Upload PDF Brochure</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-[280px]">
                            Sleep je brochure hierheen of gebruik de knop om te bladeren
                        </p>

                        <label className="bg-primary hover:bg-emerald-400 hover:scale-105 active:scale-95 text-black font-extrabold py-5 px-12 rounded-2xl cursor-pointer transition-all duration-300 shadow-[0_20px_40px_rgba(16,183,127,0.15)]">
                            Bestand kiezen
                            <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                        </label>

                        <div className="mt-12 flex items-center gap-2.5 text-gray-700">
                            <span className="material-symbols-outlined text-[20px]">info</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">PDF • MAX 25MB • OPTIMALISEERD VOOR FUNDA</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8">
                        {/* URL Importer Section */}
                        <div className="bg-white/[0.02] rounded-[3rem] p-10 border border-white/5 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-all duration-500">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'wght' 100" }}>language</span>
                            </div>

                            <div className="flex items-center gap-5 mb-10 relative z-10">
                                <div className="size-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-[28px]">link</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">Web Agent Import</h3>
                                    <p className="text-xs text-gray-500 font-medium">Auto-extractie van portalen</p>
                                </div>
                            </div>

                            <div className="space-y-5 relative z-10">
                                <div className="relative group/input">
                                    <input
                                        type="url"
                                        placeholder="Plak Funda of portal URL..."
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        className="w-full bg-[#0a0c0b]/40 border border-white/5 rounded-2xl px-7 h-20 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/10 transition-all duration-500 text-lg"
                                    />
                                    <span className="material-symbols-outlined absolute right-7 top-1/2 -translate-y-1/2 text-gray-700 group-focus-within/input:text-primary transition-colors">content_paste</span>
                                </div>

                                <button
                                    onClick={handleUrlScrape}
                                    disabled={!urlInput}
                                    className={`
                                        w-full h-18 py-5 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-3 active:scale-[0.99]
                                        ${urlInput
                                            ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10 shadow-xl'
                                            : 'bg-white/5 text-gray-700 cursor-not-allowed border border-white/5'}
                                    `}
                                >
                                    <span className="material-symbols-outlined text-[22px]">smart_toy</span>
                                    <span>Analyseer Website</span>
                                </button>
                            </div>
                        </div>

                        {/* Info Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.03] transition-colors group">
                                <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
                                </div>
                                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">Snelheid</h4>
                                <p className="text-[11px] text-gray-600 leading-normal font-medium">Gemiddeld 15s p/woning</p>
                            </div>
                            <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.03] transition-colors group">
                                <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                                </div>
                                <h4 className="font-bold text-sm mb-1 uppercase tracking-tight">AI Kracht</h4>
                                <p className="text-[11px] text-gray-600 leading-normal font-medium">Volledige data extractie</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-gray-700 font-bold uppercase tracking-[0.3em]">
                        Ondersteunde platforms: Funda • Pararius • Jaap.nl • Huislijn
                    </p>
                </div>
            </main>
        </div>
    )
}
