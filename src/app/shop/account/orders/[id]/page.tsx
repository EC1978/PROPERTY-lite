'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default function OrderDetailPage() {
    const { id } = useParams()
    const [order, setOrder] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('shop_orders')
                .select(`
                    *,
                    shop_order_items (
                        *,
                        shop_products (*)
                    )
                `)
                .eq('id', id)
                .single()

            if (data) setOrder(data)
            setIsLoading(false)
        }

        fetchOrder()
    }, [id])

    if (isLoading) {
        return (
            <div className="p-20 text-center">
                <div className="size-12 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Bestelgegevens laden...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="p-20 text-center">
                <h3 className="text-xl font-bold mb-2 text-white">Bestelling niet gevonden</h3>
                <Link href="/shop/account/orders" className="text-[#0df2a2] font-bold">Terug naar overzicht</Link>
            </div>
        )
    }

    // Assume standard values for demo screenshots if missing from real data
    const tax = order.total_amount * 0.21
    const subtotal = order.total_amount - tax

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <Link href="/dashboard" className="hover:text-[#0df2a2]">Account</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <Link href="/shop/account/orders" className="hover:text-[#0df2a2]">Bestellingen</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-white">{order.order_number || order.id.slice(0, 8)}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Order Context */}
                <div className="lg:col-span-4 space-y-6">
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8 space-y-8">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Factuurnummer</p>
                            <h2 className="text-2xl font-black text-white tracking-tight">{order.order_number || `2026${Math.floor(Math.random() * 900000)}`}</h2>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Status</p>
                            <div className="flex items-center gap-2 text-[#0df2a2] font-black text-sm uppercase tracking-widest">
                                <div className="size-2 rounded-full bg-[#0df2a2]"></div>
                                {order.status || 'Afgerond'}
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Besteldatum</p>
                            <div className="flex items-center gap-2 text-white font-bold">
                                <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_today</span>
                                {format(new Date(order.created_at), 'd MMM yyyy | HH:mm', { locale: nl })}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mogelijkheden</p>
                            <button className="flex items-center gap-3 text-sm font-bold text-white hover:text-[#0df2a2] transition-colors">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Download factuur
                            </button>
                            <button className="flex items-center gap-3 text-sm font-bold text-white hover:text-[#0df2a2] transition-colors">
                                <span className="material-symbols-outlined text-[18px]">replay</span>
                                Herhaal order
                            </button>
                            <button className="flex items-center gap-3 text-sm font-bold text-white hover:text-[#0df2a2] transition-colors">
                                <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                                Klacht melden
                            </button>
                        </div>
                    </section>
                </div>

                {/* Center Column: Product & Details */}
                <div className="lg:col-span-5 space-y-6">
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-6">
                                <div className="size-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 overflow-hidden shrink-0">
                                    <img
                                        src={order.shop_order_items?.[0]?.shop_products?.images?.[0] || ''}
                                        alt="Product"
                                        className="size-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-white tracking-tight leading-tight mb-2 truncate">
                                        {order.shop_order_items?.[0]?.shop_products?.name || 'Horeca notitieblokjes'}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-gray-500 text-sm font-medium">Lijmbinding • 170 x 60 mm</p>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prijs</p>
                                            <p className="text-lg font-black text-white">€ {order.total_amount?.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-8 pb-6 border-b border-white/5">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ontwerp 1</p>
                                    {order.design_url ? (
                                        <a href={order.design_url} target="_blank" className="text-[#0df2a2] font-black text-xs uppercase tracking-widest flex items-center gap-1 hover:underline">
                                            <span className="material-symbols-outlined text-[14px]">visibility</span>
                                            Bekijk ontwerp
                                        </a>
                                    ) : (
                                        <p className="text-xs font-medium text-gray-500 italic uppercase tracking-widest">Niet beschikbaar</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Aantal</p>
                                    <p className="text-sm font-black text-white">500</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                        <span className="material-symbols-outlined text-gray-400 text-[18px]">local_shipping</span>
                                        Verzonden
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Verwachte leverdatum</p>
                                    <p className="text-sm font-bold text-white">5 feb 2026</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Tracking codes</p>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-[#0df2a2] underline tracking-tight cursor-pointer">JVGLO5821863000839588983</p>
                                    <p className="text-[11px] font-bold text-[#0df2a2] underline tracking-tight cursor-pointer">JVGLO5821863000270407917</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Address & Summary */}
                <div className="lg:col-span-3 space-y-6">
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-gray-500 text-[18px]">receipt</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Factuuradres</p>
                        </div>
                        <div className="text-sm font-medium text-white space-y-1">
                            <p className="font-black">Prestige Design</p>
                            <p>Erdem Celik</p>
                            <p>Lulofsstraat 29</p>
                            <p>2521AK 's-Gravenhage</p>
                        </div>
                    </section>

                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-gray-500 text-[18px]">local_shipping</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Bezorgadres</p>
                        </div>
                        <div className="text-sm font-medium text-white space-y-1">
                            <p className="font-black">Ap's Services</p>
                            <p>Appie</p>
                            <p>Boerenstraat 2-E</p>
                            <p>2572HW 's-Gravenhage</p>
                        </div>
                    </section>

                    <section className="bg-[#1A1D1C]/60 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between text-gray-400 font-medium text-xs">
                                <span>Producten</span>
                                <span className="text-white font-bold">€ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 font-medium text-xs">
                                <span>Bestandscontrole</span>
                                <span className="text-[#0df2a2] font-bold">Gratis</span>
                            </div>
                            <div className="flex justify-between text-gray-400 font-medium text-xs">
                                <span>Verzending</span>
                                <span className="text-[#0df2a2] font-bold">Gratis</span>
                            </div>
                            <div className="py-2 border-y border-white/5 flex justify-between items-center">
                                <span className="text-white font-black uppercase tracking-widest text-[10px]">Totaal excl. btw</span>
                                <span className="text-lg font-black text-white">€ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 font-medium text-xs">
                                <span>Btw (21%)</span>
                                <span className="text-white">€ {tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-2">
                                <span className="text-white font-black uppercase tracking-widest text-[10px]">Totaal incl. btw</span>
                                <span className="text-xl font-black text-[#0df2a2]">€ {order.total_amount?.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="bg-[#0df2a2]/10 border-t border-white/5 p-4 flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#0df2a2] text-[20px]">check_circle</span>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Deze factuur is betaald</p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
