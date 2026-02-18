'use client'

import React, { useState } from 'react'
import ImageUpload from '@/components/ImageUpload'

interface LandingSettingsFormProps {
    currentImage: string | null
    updateAction: (formData: FormData) => Promise<void>
}

export default function LandingSettingsForm({ currentImage, updateAction }: LandingSettingsFormProps) {
    const [isUploading, setIsUploading] = useState(false)

    return (
        <form action={updateAction} className="space-y-6">
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">Hero Afbeelding</label>
                <p className="text-xs text-gray-400">Deze afbeelding wordt met een overloop-effect weergegeven in de hero sectie van de landingspagina. Laat leeg voor de standaard zwarte achtergrond.</p>

                <div className="max-w-md">
                    <ImageUpload
                        defaultValue={currentImage || ''}
                        onUploading={setIsUploading}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/5">
                <button
                    type="submit"
                    disabled={isUploading}
                    className={`
                        font-bold py-3 px-8 rounded-xl transition-all active:scale-[0.98] shadow-lg 
                        ${isUploading
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'}
                    `}
                >
                    {isUploading ? 'Wachten op upload...' : 'Instellingen Opslaan'}
                </button>
            </div>
        </form>
    )
}
