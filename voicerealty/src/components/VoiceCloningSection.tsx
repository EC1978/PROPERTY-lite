'use client'

import React, { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

interface VoiceCloningSectionProps {
    canClone: boolean;
    currentVoiceId?: string | null;
}

export default function VoiceCloningSection({ canClone, currentVoiceId }: VoiceCloningSectionProps) {
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!canClone) {
            setMessage('Upgrade naar Elite om uw stem te klonen.')
            return
        }

        setUploading(true)
        setMessage('')

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `uploads/${fileName}`

            // 1. Upload file to 'voice-samples' bucket
            const { error: uploadError } = await supabase.storage
                .from('voice-samples')
                .upload(filePath, file)

            if (uploadError) {
                if (uploadError.message.includes('Bucket not found')) {
                    throw new Error('Opslag emmer niet gevonden. (Admin: maak "voice-samples" bucket aan).')
                }
                throw uploadError
            }

            // 2. Simulate "Cloning" process (In real app: Call ElevenLabs API)
            // For now: specific ID or just store the path
            // Let's pretend we got a voice ID back from an API
            const simulatedVoiceId = `cloned_${Math.random().toString(36).substring(7)}`

            // 3. Update User Profile
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ cloned_voice_id: simulatedVoiceId })
                    .eq('id', user.id)

                if (updateError) throw updateError
            }

            setMessage('Stem succesvol gekloond! (Simulatie)')

        } catch (error: any) {
            console.error(error)
            setMessage(`Fout: ${error.message}`)
        } finally {
            setUploading(false)
        }
    }

    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voice Cloning</h3>
                {!canClone && (
                    <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">ELITE ONLY</span>
                )}
            </div>

            <div className={`bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 p-6 relative overflow-hidden ${!canClone ? 'opacity-75' : ''}`}>
                {!canClone && (
                    <div className="absolute inset-0 bg-background-dark/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-6">
                        <span className="material-symbols-outlined text-[48px] text-white mb-2">lock</span>
                        <h4 className="text-lg font-bold text-white mb-1">Upgrade naar Elite</h4>
                        <p className="text-sm text-white/70 mb-4 max-w-xs">Activeer uw eigen stem als AI-agent.</p>
                        <a href="/pricing" className="bg-primary hover:bg-emerald-400 text-background-dark font-bold py-2 px-6 rounded-full transition-colors shadow-lg shadow-emerald-500/20">
                            Bekijk Opties
                        </a>
                    </div>
                )}

                <div className="flex items-start gap-4">
                    <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <span className="material-symbols-outlined text-[24px]">graphic_eq</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Uw Stem Clone</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Upload een opname (MP3/WAV) om uw digitale evenbeeld te creëren. De AI spreekt dan met uw stem tegen klanten.
                        </p>

                        {currentVoiceId && (
                            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-emerald-500 text-sm">
                                <span className="material-symbols-outlined">check_circle</span>
                                <span>Actieve Clone ID: {currentVoiceId}</span>
                            </div>
                        )}

                        {message && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Fout') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {message}
                            </div>
                        )}

                        <input
                            type="file"
                            accept="audio/*"
                            ref={fileInputRef}
                            onChange={handleUpload}
                            className="hidden"
                        />

                        <button
                            disabled={!canClone || uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-medium py-3 rounded-xl border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center gap-2 transition-colors"
                        >
                            {uploading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Uploaden & Klonen...</span>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">add_circle</span>
                                    <span>Nieuwe opname uploaden</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}
