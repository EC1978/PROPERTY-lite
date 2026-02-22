'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getScansByMaterial, resetPropertyScans, resetAllMaterialScans } from '@/app/dashboard/materialen/actions'

interface Scan {
    id: string
    property_id: string
    created_at: string
    browser?: string
    device?: string
    os?: string
    ip_hash?: string
    properties: {
        address: string
    } | null
}

interface GroupedScan {
    propertyId: string
    address: string
    count: number
    uniqueCount: number
    lastScan: string
}

interface ScansPerPropertyModalProps {
    isOpen: boolean
    onClose: () => void
    materialId: string
    materialName: string
}

export default function ScansPerPropertyModal({
    isOpen,
    onClose,
    materialId,
    materialName
}: ScansPerPropertyModalProps) {
    const [scans, setScans] = useState<Scan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isResetting, setIsResetting] = useState<string | null>(null)
    const [isResettingAll, setIsResettingAll] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadScans()
        }
    }, [isOpen, materialId])

    async function loadScans() {
        setIsLoading(true)
        try {
            const data = await getScansByMaterial(materialId)
            setScans(data)
        } catch (error) {
            console.error('Error loading scans:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const { groupedScans, totalUnique, deviceStats } = useMemo(() => {
        const groups: GroupedScan[] = []
        const uniqueIps = new Set<string>()
        const devices = { mobile: 0, desktop: 0, tablet: 0 }

        scans.forEach(scan => {
            // Stats overall
            if (scan.ip_hash) uniqueIps.add(scan.ip_hash)

            const dev = (scan.device || 'desktop').toLowerCase()
            if (dev.includes('mobile')) devices.mobile++
            else if (dev.includes('tablet')) devices.tablet++
            else devices.desktop++

            // Grouping by property
            const address = scan.properties?.address || 'Onbekende woning'
            let group = groups.find(g => g.propertyId === scan.property_id)

            if (!group) {
                group = {
                    propertyId: scan.property_id,
                    address,
                    count: 0,
                    uniqueCount: 0,
                    lastScan: scan.created_at
                }
                groups.push(group)
            }

            group.count++
            // This is a bit simplified for unique per property but works as a heuristic
            // In a real app we'd track uniqueness per property more strictly
        })

        // Second pass for unique count per property group
        groups.forEach(group => {
            const propertyScans = scans.filter(s => s.property_id === group.propertyId)
            const pUnique = new Set(propertyScans.map(s => s.ip_hash).filter(Boolean))
            group.uniqueCount = pUnique.size || group.count // fallback
        })

        return {
            groupedScans: groups,
            totalUnique: uniqueIps.size,
            deviceStats: devices
        }
    }, [scans])

    const handleReset = async (propertyId: string, address: string) => {
        if (!confirm(`Weet je zeker dat je de scan-historie voor "${address}" wilt wissen?`)) {
            return
        }

        setIsResetting(propertyId)
        try {
            await resetPropertyScans(propertyId)
            await loadScans()
        } catch (error: any) {
            alert(`Fout bij resetten: ${error.message}`)
        } finally {
            setIsResetting(null)
        }
    }

    const handleResetAll = async () => {
        if (!confirm(`Weet je zeker dat je ALLE scan-historie voor dit materiaal wilt wissen? Dit kan niet ongedaan worden gemaakt.`)) {
            return
        }

        setIsResettingAll(true)
        try {
            await resetAllMaterialScans(materialId)
            await loadScans()
        } catch (error: any) {
            alert(`Fout bij resetten: ${error.message}`)
        } finally {
            setIsResettingAll(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white dark:bg-[#0A0A0A] w-full max-w-2xl rounded-[3rem] border border-gray-200 dark:border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Header Section */}
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                    <span className="material-symbols-outlined text-[24px]">analytics</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Preview Insights</h2>
                            </div>
                            <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] ml-13">{materialName}</p>
                        </div>
                        <button onClick={onClose} className="size-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all hover:rotate-90">
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    </div>

                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-5 bg-gray-50 dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Totaal Scans</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{scans.length}</p>
                        </div>
                        <div className="p-5 bg-gray-50 dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Unieke Hits</p>
                            <p className="text-2xl font-black text-emerald-500">{totalUnique}</p>
                        </div>
                        <div className="p-5 bg-gray-50 dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobiel %</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {scans.length > 0 ? Math.round((deviceStats.mobile / scans.length) * 100) : 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="px-8 pb-8 overflow-y-auto max-h-[50vh] no-scrollbar">
                    {isLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <div className="size-12 border-4 border-[#0df2a2] border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Data ophalen...</p>
                        </div>
                    ) : groupedScans.length > 0 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Historie Per Locatie</h3>
                                <button
                                    onClick={handleResetAll}
                                    disabled={isResettingAll}
                                    className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                                    Wis alles
                                </button>
                            </div>

                            {groupedScans.map((group) => (
                                <div
                                    key={group.propertyId}
                                    className="p-6 bg-white dark:bg-white/[0.02] rounded-[2.5rem] border border-gray-100 dark:border-white/5 flex items-center justify-between group hover:border-[#0df2a2]/30 transition-all hover:bg-emerald-500/[0.02]"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="size-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">home_work</span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg tracking-tight">{group.address}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 ml-11">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Scans</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{group.count}</span>
                                            </div>
                                            <div className="w-px h-6 bg-gray-100 dark:bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Uniek</span>
                                                <span className="text-sm font-black text-emerald-500">{group.uniqueCount}</span>
                                            </div>
                                            <div className="w-px h-6 bg-gray-100 dark:bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Laatst</span>
                                                <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                    {new Date(group.lastScan).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleReset(group.propertyId, group.address)}
                                        disabled={isResetting === group.propertyId}
                                        className="size-12 rounded-2xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center relative border border-transparent hover:border-red-200 dark:hover:border-red-500/20 shadow-sm"
                                        title="Sessie resetten"
                                    >
                                        {isResetting === group.propertyId ? (
                                            <div className="size-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <span className="material-symbols-outlined text-[22px]">history</span>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-gray-50 dark:bg-white/[0.01] rounded-[3rem] border border-dashed border-gray-200 dark:border-white/10">
                            <div className="size-20 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/5">
                                <span className="material-symbols-outlined text-[40px] text-gray-300">qr_code_scanner</span>
                            </div>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Geen Activiteit</h4>
                            <p className="text-sm font-bold text-gray-400 max-w-[240px] mx-auto">Zodra iemand de QR-code scant op locatie, verschijnen hier de statistieken.</p>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-8 pt-4 bg-gray-50/50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-black py-5 rounded-[1.5rem] transition-all active:scale-[0.98] text-sm uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:shadow-emerald-500/10"
                    >
                        Dashboard Sluiten
                    </button>
                </div>
            </div>
        </div>
    )
}
