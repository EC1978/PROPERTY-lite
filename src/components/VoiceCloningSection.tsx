'use client'

import React, { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { getVoiceLibrary, saveVoiceToLibrary, deleteVoiceFromLibrary, VoiceEntry } from '@/lib/voice-library'
import ImageUpload from './ImageUpload'

interface VoiceCloningSectionProps {
    canClone: boolean;
    currentVoiceId?: string | null;
}

type VibeType = 'professional' | 'enthusiastic' | 'calm'

export default function VoiceCloningSection({ canClone, currentVoiceId }: VoiceCloningSectionProps) {
    const supabase = createClient()
    const router = useRouter()

    // Tabs: 'vibe' | 'library' | 'record'
    const [activeTab, setActiveTab] = useState<'vibe' | 'library' | 'record'>('library')

    // Vibe State
    const [selectedVibe, setSelectedVibe] = useState<VibeType>('professional')
    const [isPlayingVibe, setIsPlayingVibe] = useState<VibeType | null>(null)

    // Library State
    const [library, setLibrary] = useState<VoiceEntry[]>([])
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)

    // Recorder State
    const [currentStep, setCurrentStep] = useState(1) // 1: Record, 2: Script, 3: Training
    const [isRecording, setIsRecording] = useState(false)
    const [recordingDuration, setRecordingDuration] = useState(0)
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
    const [trainingProgress, setTrainingProgress] = useState(0)
    const [isPlayingRecording, setIsPlayingRecording] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)

    // New Voice Metadata Inputs
    const [voiceName, setVoiceName] = useState('')
    const [voicePhotoBlob, setVoicePhotoBlob] = useState<Blob | null>(null)
    const [voicePhotoPreview, setVoicePhotoPreview] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
            if (audioUrl) URL.revokeObjectURL(audioUrl)
            if (voicePhotoPreview) URL.revokeObjectURL(voicePhotoPreview)
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    }, [])

    // Load Library on mount
    useEffect(() => {
        fetchLibrary()
    }, [])

    const fetchLibrary = async () => {
        setIsLoadingLibrary(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const voices = await getVoiceLibrary(supabase, user.id)
            setLibrary(voices)
        }
        setIsLoadingLibrary(false)
    }

    const vibes = [
        {
            id: 'professional',
            label: 'Professioneel',
            description: 'Helder, formeel en gezaghebbend. Wekt direct vertrouwen bij kopers.',
            tags: 'IDEAAL VOOR: EXCLUSIEVE PANDEN',
            icon: 'verified'
        },
        {
            id: 'enthusiastic',
            label: 'Enthousiast',
            description: 'Hoge energie en een warme toon.',
            tags: '',
            icon: 'sentiment_satisfied'
        },
        {
            id: 'calm',
            label: 'Rustig',
            description: 'Ontspannen, geduldig en geruststellend.',
            tags: '',
            icon: 'spa'
        }
    ]

    const handleVibePlay = (vibeId: VibeType, e: React.MouseEvent) => {
        e.stopPropagation()
        if (isPlayingVibe === vibeId) {
            setIsPlayingVibe(null)
        } else {
            setIsPlayingVibe(vibeId)
            setTimeout(() => setIsPlayingVibe(null), 3000)
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
                setRecordedBlob(blob)
                const url = URL.createObjectURL(blob)
                setAudioUrl(url)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingDuration(0)

            timerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1)
            }, 1000)

        } catch (err) {
            console.error('Mic error:', err)
            alert('Kan microfoon niet openen.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = null;
            setTimeout(() => setCurrentStep(2), 500)
        }
    }

    const startTraining = () => {
        setCurrentStep(3)
        setTrainingProgress(0)
        const interval = setInterval(() => {
            setTrainingProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    return 100
                }
                return prev + 5
            })
        }, 150)
    }

    const playRecording = () => {
        if (audioUrl) {
            if (isPlayingRecording) {
                audioRef.current?.pause()
                setIsPlayingRecording(false)
            } else {
                const audio = new Audio(audioUrl)
                audioRef.current = audio
                audio.onended = () => setIsPlayingRecording(false)
                audio.play()
                setIsPlayingRecording(true)
            }
        }
    }

    const saveVoice = async () => {
        if (!recordedBlob) return
        if (!voiceName.trim()) {
            alert('Geef je stem een naam (bijv. "Mijn Zakelijke Stem")')
            return
        }

        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Save to Library (JSON + Storage)
            const newEntry = await saveVoiceToLibrary(supabase, user.id, recordedBlob, {
                name: voiceName,
                vibe: selectedVibe,
                photoBlob: voicePhotoBlob
            })

            // Set as active voice (optional, but good UX to auto-activate new one)
            await activateVoice(newEntry.url)

            alert('Stem succesvol opgeslagen in je bibliotheek!')

            // Reset state
            setRecordedBlob(null)
            setVoiceName('')
            setVoicePhotoBlob(null)
            setVoicePhotoPreview(null)
            setCurrentStep(1)
            setActiveTab('library')
            fetchLibrary() // Refresh list

        } catch (error: any) {
            console.error('Save error:', error)
            alert(`Fout bij opslaan: ${error.message || 'Onbekende fout'}`)
        } finally {
            setIsSaving(false)
        }
    }

    const activateVoice = async (voiceUrl: string) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('users')
            .update({ cloned_voice_id: voiceUrl })
            .eq('id', user.id)

        if (error) {
            console.error('Error activating voice:', error)
            alert('Kon stem niet activeren.')
        } else {
            router.refresh()
        }
    }

    const deleteVoice = async (voiceId: string) => {
        if (!confirm('Weet je zeker dat je deze stem wilt verwijderen?')) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await deleteVoiceFromLibrary(supabase, user.id, voiceId)
        fetchLibrary()
    }

    const playLibraryVoice = (url: string, id: string) => {
        if (playingVoiceId === id) {
            audioRef.current?.pause()
            setPlayingVoiceId(null)
        } else {
            if (audioRef.current) audioRef.current.pause()
            const audio = new Audio(url)
            audioRef.current = audio
            audio.onended = () => setPlayingVoiceId(null)
            audio.play()
            setPlayingVoiceId(id)
        }
    }

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setVoicePhotoBlob(file)
            setVoicePhotoPreview(URL.createObjectURL(file))
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!canClone) {
        return (
            <div className="relative overflow-hidden rounded-3xl bg-[#050505] border border-white/10 p-8 text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />
                <div className="relative z-20 flex flex-col items-center">
                    <span className="material-symbols-outlined text-3xl text-gray-400 mb-4">lock</span>
                    <h3 className="text-xl font-bold text-white mb-2">Upgrade naar Elite</h3>
                    <p className="text-gray-400 mb-6">Ontgrendel Voice Cloning.</p>
                    <a href="/pricing" className="bg-[#0df2a2] text-black font-bold py-3 px-8 rounded-full">Bekijk Opties</a>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 bg-[#050505] min-h-screen md:min-h-0 md:bg-transparent -m-6 md:m-0 p-6 md:p-0">

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between overflow-x-auto">
                <div className="flex gap-2 p-1 bg-white/5 rounded-full">
                    <button onClick={() => setActiveTab('library')} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'library' ? 'bg-[#0df2a2] text-black' : 'text-gray-400 hover:text-white'}`}>
                        Mijn Stemmen
                    </button>
                    <button onClick={() => setActiveTab('record')} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'record' ? 'bg-[#0df2a2] text-black' : 'text-gray-400 hover:text-white'}`}>
                        Nieuwe Stem
                    </button>
                    <button onClick={() => setActiveTab('vibe')} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'vibe' ? 'bg-[#0df2a2] text-black' : 'text-gray-400 hover:text-white'}`}>
                        Vibe Info
                    </button>
                </div>
            </div>

            {/* === LIBRARY TAB === */}
            {activeTab === 'library' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Mijn Stemmen Bibliotheek</h2>
                        <button onClick={fetchLibrary} className="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white">
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                    </div>

                    {isLoadingLibrary ? (
                        <div className="text-center py-12 text-gray-500">Laden...</div>
                    ) : library.length === 0 ? (
                        <div className="text-center py-12 border border-white/5 rounded-3xl bg-white/[0.02]">
                            <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-gray-500 text-3xl">graphic_eq</span>
                            </div>
                            <h3 className="text-white font-bold mb-2">Nog geen stemmen</h3>
                            <p className="text-gray-500 text-sm mb-6">Maak je eerste AI-kloon aan om te beginnen.</p>
                            <button onClick={() => setActiveTab('record')} className="text-[#0df2a2] font-bold text-sm hover:underline">
                                Start Opname
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {library.map((voice) => {
                                const isActive = currentVoiceId === voice.url
                                return (
                                    <div key={voice.id} className={`group bg-[#111] border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${isActive ? 'border-[#0df2a2] shadow-[0_0_20px_rgba(13,242,162,0.1)]' : 'border-white/10 hover:border-white/20'}`}>
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            {/* Photo or Placeholder */}
                                            <div className="size-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                                                {voice.photoUrl ? (
                                                    <img src={voice.photoUrl} alt={voice.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                        <span className="material-symbols-outlined">person</span>
                                                    </div>
                                                )}
                                                {/* Play Overlay */}
                                                <button
                                                    onClick={() => playLibraryVoice(voice.url, voice.id)}
                                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <span className="material-symbols-outlined text-white">{playingVoiceId === voice.id ? 'pause' : 'play_arrow'}</span>
                                                </button>
                                            </div>

                                            <div>
                                                <h4 className="text-white font-bold text-lg leading-tight">{voice.name}</h4>
                                                <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                    {new Date(voice.createdAt).toLocaleDateString()}
                                                    {voice.vibe && <span className="bg-white/10 px-1.5 rounded text-[9px] uppercase">{voice.vibe}</span>}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            {isActive ? (
                                                <div className="flex-1 sm:flex-none bg-[#0df2a2]/10 text-[#0df2a2] px-4 py-2 rounded-xl text-xs font-bold text-center border border-[#0df2a2]/20">
                                                    ACTIEF
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => activateVoice(voice.url)}
                                                    className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-white/10"
                                                >
                                                    Activeer
                                                </button>
                                            )}

                                            <button
                                                onClick={() => deleteVoice(voice.id)}
                                                className="size-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"
                                                title="Verwijderen"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* === RECORD TAB === */}
            {activeTab === 'record' && (
                <div className="space-y-6 pb-24 md:pb-0">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Nieuwe Stem Opnemen</h2>
                        <p className="text-gray-400">Volg de stappen om een nieuwe stem toe te voegen aan je bibliotheek.</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex gap-2">
                        {[1, 2, 3].map(step => (
                            <div key={step} className={`h-1 flex-1 rounded-full transition-colors ${step <= currentStep ? 'bg-[#0df2a2]' : 'bg-white/10'}`} />
                        ))}
                    </div>

                    {/* Step 1: Record */}
                    <div className={`p-6 rounded-3xl border transition-all ${currentStep === 1 ? 'bg-[#111] border-[#0df2a2]' : 'bg-[#050505] border-white/5 opacity-50'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-bold text-[#0df2a2] uppercase tracking-widest">Stap 01 — Opname</h3>
                        </div>
                        <div className="flex flex-col items-center justify-center py-4">
                            <div className="relative mb-6 cursor-pointer" onClick={isRecording ? stopRecording : startRecording}>
                                <div className={`size-24 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 scale-110 shadow-[0_0_40px_rgba(239,68,68,0.4)]' : 'bg-black border-2 border-white/10 hover:border-[#0df2a2]'}`}>
                                    <span className="material-symbols-outlined text-4xl text-white">{isRecording ? 'stop' : 'mic'}</span>
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-1">{isRecording ? formatTime(recordingDuration) : 'Start Opname'}</h4>
                            <p className="text-gray-500 text-sm">Lees de tekst hieronder hardop voor.</p>
                        </div>
                    </div>

                    {/* Step 2: Confirmation / Name / Photo */}
                    <div className={`p-6 rounded-3xl border transition-all ${currentStep === 2 ? 'bg-[#111] border-[#0df2a2]' : 'bg-[#050505] border-white/5 opacity-50'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-[#0df2a2] uppercase tracking-widest">Stap 02 — Details</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Naam van de stem</label>
                                <input
                                    type="text"
                                    value={voiceName}
                                    onChange={(e) => setVoiceName(e.target.value)}
                                    placeholder="Bijv. Zakelijk, Enthousiast, Engels..."
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0df2a2]"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Foto (Optioneel)</label>
                                <div className="flex items-center gap-4">
                                    <label className="size-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center cursor-pointer hover:border-[#0df2a2] overflow-hidden">
                                        {voicePhotoPreview ? (
                                            <img src={voicePhotoPreview} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-500">add_photo_alternate</span>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                                    </label>
                                    <p className="text-xs text-gray-500">Voeg een foto toe om deze stem herkenbaar te maken.</p>
                                </div>
                            </div>

                            {currentStep === 2 && (
                                <button onClick={() => setCurrentStep(3)} className="w-full bg-[#0df2a2] text-black font-bold py-3 rounded-xl mt-4">
                                    Verder naar Training
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Step 3: Training & Save */}
                    {currentStep >= 3 && (
                        <div className={`p-6 rounded-3xl border transition-all ${currentStep === 3 ? 'bg-[#111] border-[#0df2a2]' : 'bg-[#050505] border-white/5 opacity-50'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xs font-bold text-[#0df2a2] uppercase tracking-widest">Stap 03 — Finaliseren</h3>
                            </div>

                            {trainingProgress < 100 && (
                                <div className="bg-white/5 h-2 rounded-full overflow-hidden mb-4">
                                    {/* Auto-start training when step 3 is reached could be done in useEffect, but for now manual trigger via button above works or auto-start */}
                                    {/* We'll just simulate "Done" state for simplicity if user clicks "Save" */}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={playRecording} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
                                    <span className="material-symbols-outlined">{isPlayingRecording ? 'pause' : 'play_arrow'}</span>
                                    Luister
                                </button>
                                <button onClick={saveVoice} disabled={isSaving} className="flex-1 bg-[#0df2a2] hover:bg-emerald-400 text-black font-bold py-3 rounded-xl flex justify-center items-center gap-2">
                                    {isSaving ? 'Opslaan...' : 'Opslaan & Activeer'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === VIBE TAB === */}
            {activeTab === 'vibe' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Vibe Informatie</h2>
                    <div className="space-y-4">
                        {vibes.map((vibe) => (
                            <div key={vibe.id} className="bg-[#111] border border-white/10 rounded-2xl p-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-2xl">{vibe.icon}</span>
                                    <h3 className="text-white font-bold text-lg">{vibe.label}</h3>
                                </div>
                                <p className="text-gray-400">{vibe.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}
