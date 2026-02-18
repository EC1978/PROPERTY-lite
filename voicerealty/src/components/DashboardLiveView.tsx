'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from './layout/Sidebar'
import MobileNav from './layout/MobileNav'

interface Property {
    id: string
    address: string
    city?: string
    price: number
    created_at: string
}

interface DashboardLiveViewProps {
    userEmail: string
    userId: string
    initialProperties: Property[]
    initialActiveCount: number
}

export default function DashboardLiveView({ userEmail, userId, initialProperties, initialActiveCount }: DashboardLiveViewProps) {
    const [properties, setProperties] = useState<Property[]>(initialProperties)
    const [activeCount, setActiveCount] = useState(initialActiveCount)
    // Stats from Stitch Design B1
    const [interactions] = useState('1.2k')

    // Activity mockup (aligned with Stitch "Interactions" or similar activity log if needed, but B1 focuses on stats/upload)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const channel = supabase
            .channel('realtime-dashboard')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'properties',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newProperty = payload.new as Property
                        setProperties(prev => [newProperty, ...prev].slice(0, 5)) // Increased limit slightly
                        setActiveCount(prev => prev + 1)
                    } else if (payload.eventType === 'DELETE') {
                        router.refresh()
                        setActiveCount(prev => Math.max(0, prev - 1))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, userId, router])

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={userEmail} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-tight">Makelaar Dashboard</span>
                </div>
                <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {userEmail?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-6 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 max-w-7xl mx-auto space-y-8">

                {/* Hero Section */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-1">
                        Welcome back, {userEmail?.split('@')[0]}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your AI-driven property portfolio is performing <span className="text-emerald-500 font-semibold">+12%</span> above target.
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column: Upload & Stats */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* AI Property Processor (Upload Zone) */}
                        <div className="bg-white dark:bg-[#111] rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>

                            <h3 className="text-lg font-bold mb-2 relative z-10">AI Property Processor</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 relative z-10 max-w-md">
                                Drop your property PDF, blueprints, or legal documents here. Emerald AI will extract features, floorplans, and generate SEO-optimized descriptions in seconds.
                            </p>

                            <Link href="/properties/new" className="block w-full border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl p-8 transition-all text-center cursor-pointer group/zone">
                                <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover/zone:scale-110 transition-transform">
                                    <span className="material-symbols-outlined text-emerald-500 text-[32px]">cloud_upload</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">Click to upload or drag and drop</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">PDF, DOCX, JPG (max 25MB)</span>
                            </Link>
                        </div>

                        {/* Batch QR Tile - Using Stitch B1 styling */}
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-[#1A1A1A] dark:to-[#111] rounded-3xl p-6 text-white flex items-center justify-between shadow-lg shadow-black/5">
                            <div>
                                <h4 className="font-bold text-lg mb-1">Batch Generate Marketing QR Codes</h4>
                                <p className="text-white/60 text-sm">Ready for 12 new properties</p>
                            </div>
                            <div className="size-10 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                                <span className="material-symbols-outlined">qr_code_2</span>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Stats & Quick View */}
                    <div className="space-y-6">
                        {/* Stats Cards - Stitch B1 Style (Clean numbers) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Active Listings</p>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{activeCount}</div>
                                <div className="flex items-center text-xs text-emerald-500 font-medium">
                                    <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                                    <span>+3 this week</span>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Interactions</p>
                                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{interactions}</div>
                                <div className="flex items-center text-xs text-emerald-500 font-medium">
                                    <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                                    <span>+12% vs last mo</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Properties List - Managed Properties */}
                        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg">Managed Properties</h3>
                                <Link href="/properties" className="text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                    View All
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {properties.length > 0 ? properties.map((prop, i) => (
                                    <div key={prop.id} className="flex gap-4 items-center group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                                        <div className="size-12 rounded-lg bg-gray-100 dark:bg-white/10 flex-shrink-0 flex items-center justify-center">
                                            {/* Ideally an image here */}
                                            <span className="material-symbols-outlined text-gray-400">image</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate">{prop.address}</h5>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                €{prop.price?.toLocaleString()} • {prop.city || 'Amsterdam'}
                                            </p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-gray-500 text-sm">No properties yet.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
