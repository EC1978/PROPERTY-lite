'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'

interface OpenOrder {
    id: string;
    order_number: string;
    total_amount: number;
    created_at: string;
    status: string;
}

export default function OpenPage() {
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchOpenOrders = async () => {
        setIsLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data, error } = await supabase
                .from('shop_orders')
                .select('id, total_amount, created_at, status')
                .eq('user_id', user.id)
                .in('status', ['pending', 'unpaid', 'openstaand'])
                .order('created_at', { ascending: false })

            if (data) {
                setOpenOrders(data.map(o => ({
                    id: o.id,
                    order_number: `ORD-${o.id.slice(0, 8).toUpperCase()}`,
                    total_amount: Number(o.total_amount),
                    created_at: o.created_at,
                    status: o.status
                })))
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchOpenOrders()
    }, [])

    const totalOpen = openOrders.reduce((sum, order) => sum + order.total_amount, 0)

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Openstaand</span>
                </div>
            </nav>

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Openstaand</h1>
                    <p className="text-gray-500 text-sm font-medium">Overzicht van uw onbetaalde facturen.</p>
                </div>
                <div className="bg-[#1A1D1C]/40 border border-[#0df2a2]/20 rounded-2xl px-6 py-4 backdrop-blur-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Totaal Openstaand</span>
                    <span className="text-2xl font-black text-[#0df2a2]">€ {totalOpen.toFixed(2)}</span>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 bg-white/[0.03]">
                    <div className="col-span-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Order/Factuur</div>
                    <div className="col-span-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Bedrag</div>
                    <div className="col-span-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Datum</div>
                    <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Actie</div>
                </div>

                <div className="divide-y divide-white/5">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-500 text-xs font-black uppercase tracking-widest">Laden...</div>
                    ) : openOrders.length > 0 ? (
                        openOrders.map((order) => (
                            <div key={order.id} className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.03] transition-all">
                                <div className="col-span-4 flex flex-col">
                                    <span className="font-black text-base tracking-tight text-white">{order.order_number}</span>
                                    <span className="text-[11px] text-gray-500 font-medium capitalize">{order.status}</span>
                                </div>
                                <div className="col-span-3">
                                    <span className="text-base font-bold text-white">€ {order.total_amount.toFixed(2)}</span>
                                </div>
                                <div className="col-span-3">
                                    <span className="text-sm font-semibold text-gray-400" suppressHydrationWarning>
                                        {format(new Date(order.created_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <Link
                                        href={`/shop/account/orders/${order.id}`}
                                        className="bg-[#0df2a2] text-[#0A0A0A] px-6 py-3 rounded-xl font-black text-[10px] items-center gap-2 hover:scale-[1.02] transition-all shadow-lg active:scale-95 inline-flex"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        BEKIJKEN
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center text-gray-600 font-bold">
                            Geen openstaande bestellingen.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
