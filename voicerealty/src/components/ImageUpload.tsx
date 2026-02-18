'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ImageUploadProps {
    defaultValue?: string
    onUpload?: (url: string) => void
    onUploading?: (uploading: boolean) => void
}

export default function ImageUpload({ defaultValue, onUpload, onUploading }: ImageUploadProps) {
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
                    relative rounded-xl border-2 border-dashed transition-all overflow-hidden h-64 flex flex-col items-center justify-center
                    ${isDragging ? 'border-primary bg-emerald-50' : 'border-gray-300 bg-gray-50'}
                    ${previewUrl ? 'border-none' : ''}
                `}
            >
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="Property Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors">
                                Wijzigen
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                />
                            </label>
                        </div>
                    </>
                ) : (
                    <div className="text-center p-6">
                        {isUploading ? (
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                                <span className="text-gray-500 font-medium">Uploaden...</span>
                            </div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[48px] text-gray-400 mb-2">add_photo_alternate</span>
                                <p className="text-gray-700 font-medium mb-1">Sleep een foto hierheen</p>
                                <p className="text-gray-400 text-sm mb-4">of</p>
                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-gray-50 transition-colors">
                                    Kies Bestand
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
