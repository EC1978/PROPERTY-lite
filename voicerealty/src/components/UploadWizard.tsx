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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Woning Toevoegen</h1>
                <p className="text-gray-500 mb-8">Sleep je brochure of gebruik de Web Agent.</p>

                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
                        border-2 border-dashed rounded-3xl p-10 bg-white transition-all mb-8
                        ${isDragging ? 'border-primary bg-emerald-50 scale-105' : 'border-gray-300'}
                    `}
                >
                    <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-[32px] text-primary">cloud_upload</span>
                    </div>
                    <p className="font-semibold text-gray-900 mb-1">Sleep PDF hierheen</p>
                    <p className="text-sm text-gray-400 mb-4">of</p>
                    <label className="inline-block bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold py-2 px-6 rounded-full cursor-pointer transition-colors">
                        Kies Bestand
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelect} />
                    </label>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OF GEBRUIK WEB AGENT</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                <div className="mt-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="material-symbols-outlined text-gray-400">link</span>
                            </span>
                            <input
                                type="url"
                                placeholder="Plak een Funda of website URL..."
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={handleUrlScrape}
                            disabled={!urlInput}
                            className={`
                                w-full font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2
                                ${urlInput
                                    ? 'bg-primary hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 cursor-pointer'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                            `}
                        >
                            <span className="material-symbols-outlined">smart_toy</span>
                            Start Web Agent
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
