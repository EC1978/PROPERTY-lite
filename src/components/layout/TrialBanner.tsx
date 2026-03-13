'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface TrialBannerProps {
    trialExpiresAt: string | null
}

export default function TrialBanner({ trialExpiresAt }: TrialBannerProps) {
    const [daysLeft, setDaysLeft] = useState<number | null>(null)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        console.log('TrialBanner: trialExpiresAt received:', trialExpiresAt)
        if (!trialExpiresAt) return

        const calculateDaysLeft = () => {
            const expirationDate = new Date(trialExpiresAt)
            const today = new Date()
            
            // Calculate difference in time
            const diffTime = expirationDate.getTime() - today.getTime()
            
            // Calculate difference in days
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            
            console.log('TrialBanner: daysLeft calculated:', diffDays)
            setDaysLeft(diffDays)
        }

        calculateDaysLeft()
    }, [trialExpiresAt])

    if (!isVisible || daysLeft === null) return null

    // Determine color based on days left
    const isUrgent = daysLeft <= 3
    
    return (
        <div className={`w-full mb-8 relative overflow-hidden rounded-2xl border transition-all duration-500 group shadow-[0_0_30px_rgba(0,0,0,0.3)] ${
            isUrgent 
            ? 'border-red-500/30' 
            : 'border-[#0df2a2]/30'
        }`}>
            {/* Background Gradient & Animation */}
            <div className={`absolute inset-0 bg-gradient-to-r ${
                isUrgent 
                ? 'from-red-500/20 via-[#0a0c0b] to-[#0a0c0b]' 
                : 'from-[#0df2a2]/20 via-[#0a0c0b] to-[#0a0c0b]'
            } z-0 opacity-70 group-hover:opacity-100 transition-opacity duration-700`}></div>
            
            {/* Ambient Glow */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none z-0 ${
                isUrgent ? 'bg-red-500/20' : 'bg-[#0df2a2]/20'
            }`}></div>
            
            {/* Glass effect */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:px-6">
                <div className="flex items-start sm:items-center gap-4">
                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${
                        isUrgent 
                        ? 'bg-red-500/20 text-red-500' 
                        : 'bg-[#0df2a2]/20 text-[#0df2a2]'
                    }`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {isUrgent ? 'warning' : 'verified'}
                        </span>
                    </div>
                    
                    <div>
                        <h3 className="text-white font-bold text-base flex items-center gap-2">
                            Elite Trial Status
                            {isUrgent && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Verloopt bijna
                                </span>
                            )}
                        </h3>
                        <p className="text-gray-400 text-sm mt-0.5">
                            Geniet nog <span className={`font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>{daysLeft} {daysLeft === 1 ? 'dag' : 'dagen'}</span> van alle Elite functies voor je makelaarskantoor.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        aria-label="Sluiten"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                    
                    <Link 
                        href="/pricing" 
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
                            isUrgent
                            ? 'bg-red-500 hover:bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                            : 'bg-[#0df2a2]/10 hover:bg-[#0df2a2]/20 border-[#0df2a2]/30 text-[#0df2a2] hover:shadow-[0_0_15px_rgba(13,242,162,0.15)]'
                        }`}
                    >
                        <span>Upgrade Nu</span>
                        <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
