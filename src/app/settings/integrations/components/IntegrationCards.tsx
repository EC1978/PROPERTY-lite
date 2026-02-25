'use client'

import { useState } from 'react'
import { Integration, toggleIntegrationConnection, saveRealworksToken } from '../actions'
import RealworksModal from './RealworksModal'

const INTEGRATION_INFOS = {
    google: {
        title: 'Google Calendar',
        icon: 'calendar_month',
        desc: 'Synchroniseer al uw afspraken en bezichtigingen direct met uw Google Calendar. Automatische reminders en realtime updates.',
        color: 'from-[#4285F4] to-[#34A853]'
    },
    microsoft: {
        title: 'Outlook Agenda',
        icon: 'event_note',
        desc: 'Koppel uw Microsoft Outlook agenda. Perfect voor makelaars die het Microsoft ecosysteem gebruiken voor hun communicatie.',
        color: 'from-[#00A4EF] to-[#7FBA00]'
    },
    realworks: {
        title: 'Realworks CRM',
        icon: 'real_estate_agent',
        desc: 'Integreer VoiceRealty direct met Realworks. Leads en gespreksverslagen worden automatisch gekoppeld aan uw objecten.',
        color: 'from-[#0df2a2] to-[#046141]'
    }
}

export default function IntegrationCards({ initialIntegrations }: { initialIntegrations: Integration[] }) {
    const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations)
    const [loading, setLoading] = useState<Record<string, boolean>>({})
    const [isRealworksModalOpen, setIsRealworksModalOpen] = useState(false)

    const handleConnect = (provider: string) => {
        if (provider === 'google') {
            window.location.href = '/api/auth/google'
        } else if (provider === 'microsoft') {
            window.location.href = '/api/auth/microsoft'
        } else if (provider === 'realworks') {
            setIsRealworksModalOpen(true)
        }
    }

    const handleDisconnect = async (provider: string) => {
        setLoading(prev => ({ ...prev, [provider]: true }))
        try {
            const res = await toggleIntegrationConnection(provider, 'Verbonden')
            if (res.success) {
                setIntegrations(prev => prev.map(inv => {
                    if (inv.provider === provider) {
                        return {
                            ...inv,
                            status: 'Niet gekoppeld',
                            connectedAt: undefined
                        }
                    }
                    return inv
                }))
            } else {
                alert(res.error || 'Er is iets misgegaan bij het ontkoppelen')
            }
        } catch (e) {
            alert('Er is een fout opgetreden bij het ontkoppelen')
        } finally {
            setLoading(prev => ({ ...prev, [provider]: false }))
        }
    }

    const handleSaveRealworks = async (token: string) => {
        setLoading(prev => ({ ...prev, realworks: true }))
        try {
            const res = await saveRealworksToken(token)
            if (res.success) {
                setIntegrations(prev => prev.map(inv => inv.provider === 'realworks' ? { ...inv, status: 'Verbonden', connectedAt: new Date().toISOString() } : inv))
                setIsRealworksModalOpen(false)
            } else {
                alert(res.error || 'Fout bij opslaan token')
            }
        } catch (e) {
            alert('Fout bij opslaan Realworks token')
        } finally {
            setLoading(prev => ({ ...prev, realworks: false }))
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {integrations.map((integration) => {
                    const info = INTEGRATION_INFOS[integration.provider]
                    const isConnected = integration.status === 'Verbonden'
                    const isLoading = loading[integration.provider]

                    return (
                        <div
                            key={integration.provider}
                            className={`relative rounded-3xl border transition-all duration-300 p-6 flex flex-col items-start gap-4 overflow-hidden
                  ${isConnected
                                    ? 'bg-white/5 border-[#0df2a2]/30 shadow-[0_0_20px_rgba(13,242,162,0.1)]'
                                    : 'bg-white/5 border-white/5 hover:border-white/10'
                                }
                `}
                        >
                            {/* Background Gradient for connected state */}
                            {isConnected && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#0df2a2]/5 to-transparent pointer-events-none" />
                            )}

                            <div className={`size-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${info.color} shadow-lg relative z-10`}>
                                <span className="material-symbols-outlined text-white text-3xl">{info.icon}</span>
                            </div>

                            <div className="flex-1 w-full space-y-2 z-10">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-xl tracking-tight text-white">{info.title}</h3>
                                    {isConnected ? (
                                        <span className="px-3 py-1 bg-[#0df2a2]/10 border border-[#0df2a2]/30 text-[#0df2a2] rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5">
                                            <span className="size-1.5 rounded-full bg-[#0df2a2] shadow-[0_0_5px_#0df2a2] animate-pulse"></span>
                                            Actief
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 rounded-full text-xs font-semibold tracking-wide">
                                            Niet gekoppeld
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {info.desc}
                                </p>
                            </div>

                            <div className="w-full h-px bg-white/10 my-1 z-10"></div>

                            <button
                                onClick={() => isConnected ? handleDisconnect(integration.provider) : handleConnect(integration.provider)}
                                disabled={isLoading}
                                className={`z-10 w-full py-3 rounded-xl font-bold tracking-wide transition-all duration-300 active:scale-95 flex items-center justify-center gap-2
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isConnected
                                        ? 'bg-white/5 hover:bg-red-500/10 text-white hover:text-red-400 border border-white/10 hover:border-red-500/30'
                                        : 'bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-black shadow-[0_0_20px_rgba(13,242,162,0.3)] hover:shadow-[0_0_25px_rgba(13,242,162,0.5)]'
                                    }
                  `}
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                ) : isConnected ? (
                                    <>
                                        <span className="material-symbols-outlined text-lg">link_off</span>
                                        Ontkoppelen
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">link</span>
                                        Nu Koppelen
                                    </>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>

            <RealworksModal
                isOpen={isRealworksModalOpen}
                onClose={() => setIsRealworksModalOpen(false)}
                onSave={handleSaveRealworks}
                isLoading={loading['realworks']}
            />
        </>
    )
}
