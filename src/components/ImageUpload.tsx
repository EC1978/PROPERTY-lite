'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ImageUploadProps {
    defaultValue?: string
    onUpload?: (url: string) => void
    onUploading?: (uploading: boolean) => void
    compact?: boolean
}

export default function ImageUpload({ defaultValue, onUpload, onUploading, compact }: ImageUploadProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(defaultValue || null)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const supabase = createClient()

    const handleUpload = async (file: File) => {
        setIsUploading(true)
        if (onUploading) onUploading(true)
        try {
            const fileName = `${Date.now()}-${file.name}`
            const { data, error } = await supabase.storage
                .from('property-images')
                .upload(fileName, file)

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName)

            setPreviewUrl(publicUrl)
            if (onUpload) {
                onUpload(publicUrl)
            }

        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Fout bij het uploaden van de afbeelding.')
        } finally {
            setIsUploading(false)
            if (onUploading) onUploading(false)
        }
    }

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files?.[0]) {
            handleUpload(e.dataTransfer.files[0])
        }
    }, [])

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    return (
        <div className="w-full">
            <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`
                    relative rounded-3xl border-2 border-dashed transition-all duration-500 overflow-hidden ${compact ? 'size-24' : 'h-72'} flex flex-col items-center justify-center
                    ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}
                    ${previewUrl && !compact ? 'border-none' : ''}
                `}
            >
                {previewUrl && !compact ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="Property Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                            <label className="cursor-pointer bg-primary text-black px-8 py-3 rounded-2xl font-extrabold shadow-xl hover:bg-emerald-400 transition-all active:scale-95">
                                Afbeelding wijzigen
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                />
                            </label>
                            <p className="mt-4 text-[10px] text-white/60 font-bold uppercase tracking-widest">Klik of sleep om te vervangen</p>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-4">
                        {isUploading ? (
                            <div className="flex flex-col items-center scale-75">
                                <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-2"></div>
                                <span className="text-primary font-bold text-[8px] tracking-widest animate-pulse uppercase">UPLOADING...</span>
                            </div>
                        ) : (
                            <>
                                <label className="cursor-pointer flex flex-col items-center group">
                                    <div className={`size-10 bg-white/5 rounded-2xl flex items-center justify-center mb-2 mx-auto group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-primary transition-all`}>
                                        <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                                    </div>
                                    {!compact && (
                                        <>
                                            <p className="text-white font-bold mb-1 text-sm">Sleep een foto hierheen</p>
                                            <p className="text-gray-600 text-[10px] mb-4">of bestand kiezen</p>
                                        </>
                                    )}
                                    {compact && <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Voeg toe</span>}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                    />
                                </label>
                            </>
                        )}
                    </div>
                )}
            </div>
            <input type="hidden" name="image_url" value={previewUrl || ''} />
        </div>
    )
}
