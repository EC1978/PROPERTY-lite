'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function ClaimsPage() {
    const [claims, setClaims] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchClaims = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setIsLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('shop_complaints')
                .select(`
                    *,
                    shop_orders (
                        id,
                        created_at
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                setClaims(data)
            }
            setIsLoading(false)
        }

        fetchClaims()
    }, [])

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Reclamaties</span>
                </div>
            </nav>

            {/* Page Title */}
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn reclamaties</h1>
            </div>

            {/* Claims List */}
            <div className="bg-[#1A1D1C]/20 border border-white/5 rounded-[40px] overflow-hidden backdrop-blur-sm shadow-2xl p-8">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="size-12 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Reclamaties laden...</p>
                    </div>
                ) : claims.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-gray-600 text-[40px]">history_edu</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-white">Geen reclamaties</h3>
                        <p className="text-gray-500 text-sm">U heeft momenteel geen actieve reclamaties.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {claims.map((claim) => (
                            <div
                                key={claim.id}
                                className="bg-white/[0.03] border border-white/5 rounded-[32px] overflow-hidden group hover:border-[#0df2a2]/30 transition-all"
                            >
                                {/* Header / Main Info */}
                                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="size-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                                            <span className="material-symbols-outlined text-[32px]">report_problem</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white group-hover:text-[#0df2a2] transition-colors mb-1">{claim.claim_number}</h3>
                                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                <span className="truncate">Bestelling #{claim.order_id?.slice(0, 8)}</span>
                                                <span className="size-1 rounded-full bg-gray-800"></span>
                                                <span>{format(new Date(claim.created_at), 'd MMM yyyy', { locale: nl })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 self-end md:self-center">
                                        <div className="text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-1">Status</span>
                                            <div className={`flex items-center gap-2 ${claim.status === 'Opgelost' ? 'text-[#0df2a2]' :
                                                    claim.status === 'Afgewezen' ? 'text-red-500' :
                                                        'text-yellow-500'
                                                }`}>
                                                {claim.status !== 'Opgelost' && claim.status !== 'Afgewezen' && (
                                                    <span className="size-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                                )}
                                                <span className="text-xs font-black uppercase tracking-widest">{claim.status || 'In behandeling'}</span>
                                            </div>
                                        </div>
                                        <Link href={`/shop/account/orders/${claim.order_id}`} className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors group-hover:border-[#0df2a2]/30 border border-transparent">
                                            <span className="material-symbols-outlined">chevron_right</span>
                                        </Link>
                                    </div>
                                </div>

                                {/* Complaint Content */}
                                <div className="px-6 md:px-8 pb-8 pt-2 border-t border-white/5 bg-black/20">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Description Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0df2a2] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                                Uw omschrijving
                                            </h4>
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
                                                <p className="text-gray-400 text-sm leading-relaxed italic">
                                                    "{claim.description || 'Geen omschrijving opgegeven.'}"
                                                </p>
                                            </div>
                                        </div>

                                        {/* Items Section */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0df2a2] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm">inventory_2</span>
                                                Betrokken artikelen
                                            </h4>
                                            <div className="space-y-2">
                                                {claim.selected_items && Array.isArray(claim.selected_items) ? (
                                                    claim.selected_items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                                                            <span className="text-gray-300 text-[11px] font-bold">{item.name}</span>
                                                            <span className="text-gray-600 text-[10px] font-black">{item.quantity}x</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-gray-600 text-[10px] italic">Geen specifieke artikelen geselecteerd.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {claim.admin_response && (
                                        <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-[#0df2a2]">admin_panel_settings</span>
                                                Reactie Beheerder
                                            </h4>
                                            <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                                                <p className="text-gray-300 text-sm leading-relaxed italic">
                                                    "{claim.admin_response}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Claim Button Row */}
            <div className="flex justify-end pt-4">
                <Link href="/shop/account/orders" className="px-8 py-4 bg-white/5 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all inline-block shadow-lg active:scale-95">
                    Nieuwe reclamatie indienen
                </Link>
            </div>
        </div>
    )
}
