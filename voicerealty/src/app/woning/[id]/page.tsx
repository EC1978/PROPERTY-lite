
'use client'

import { useVoiceAgent } from '@/hooks/useVoiceAgent'
import { useState, useEffect } from 'react'

export default function VoiceInterfacePage({ params }: { params: Promise<{ id: string }> }) {
    const [propertyId, setPropertyId] = useState<string | null>(null)
    const [hasStarted, setHasStarted] = useState(false)

    useEffect(() => {
        params.then(p => setPropertyId(p.id))
    }, [params])

    // Wait for params to resolve
    if (!propertyId) return null

    return <VoiceInterfaceContent propertyId={propertyId} />
}

function VoiceInterfaceContent({ propertyId }: { propertyId: string }) {
    const { startSession, stopSession, isConnected, isListening, isSpeaking, error } = useVoiceAgent({ propertyId })

    const handleStart = () => {
        startSession()
    }

    const handleStop = () => {
        stopSession()
    }

    return (
        <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center p-4 relative overflow-hidden font-display">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* Error Message */}
            {error && (
                <div className="absolute top-8 bg-red-500/10 text-red-500 px-4 py-2 rounded-lg border border-red-500/20">
                    {error}
                </div>
            )}

            {/* Main Visual */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Voice Orb */}
                <div className={`
                    relative flex items-center justify-center
                    transition-all duration-700 ease-in-out
                    ${isConnected ? 'scale-100' : 'scale-90 opacity-80'}
                `}>
                    {/* Ripple Effects (Active only) */}
                    {isConnected && (
                        <>
                            <div className={`absolute inset-0 bg-primary/20 rounded-full blur-xl animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] ${isSpeaking ? 'opacity-100' : 'opacity-20'}`}></div>
                            <div className={`absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] delay-75 ${isSpeaking ? 'opacity-80' : 'opacity-10'}`}></div>
                        </>
                    )}

                    {/* Core Orb */}
                    <button
                        onClick={isConnected ? handleStop : handleStart}
                        className={`
                            relative h-64 w-64 rounded-full flex items-center justify-center
                            shadow-[0_0_60px_rgba(16,185,129,0.2)]
                            transition-all duration-500
                            ${isConnected
                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 scale-110 shadow-[0_0_100px_rgba(16,185,129,0.6)]'
                                : 'bg-slate-800 hover:bg-slate-700 hover:scale-105 cursor-pointer'
                            }
                        `}
                    >
                        {isConnected ? (
                            <div className="flex items-center justify-center gap-1 h-12">
                                {/* Audio Visualizer Bars (Simulated) */}
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 bg-white rounded-full transition-all duration-100 ease-in-out ${isListening || isSpeaking ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : 'h-2'}`}
                                        style={{
                                            height: isListening || isSpeaking ? `${Math.random() * 40 + 20}px` : '8px',
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    ></div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <span className="material-symbols-outlined text-[64px] text-white/90">mic</span>
                                <span className="text-white/70 font-medium text-lg mt-2">Start Gesprek</span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Status Text */}
                <div className="mt-12 text-center h-8">
                    {isConnected ? (
                        <p className="text-xl font-medium text-emerald-400 animate-pulse">
                            {isListening ? 'Ik luister...' : isSpeaking ? 'Aan het spreken...' : 'Stel je vraag...'}
                        </p>
                    ) : (
                        <p className="text-gray-500">
                            Tik op de cirkel om vragen te stellen over deze woning.
                        </p>
                    )}
                </div>
            </div>

            {/* Disclaimer / Info */}
            <div className="absolute bottom-8 text-center text-xs text-gray-600">
                <p>Mogelijk gemaakt door VoiceRealty AI • Elite Voice Technology</p>
            </div>
        </div>
    )
}
