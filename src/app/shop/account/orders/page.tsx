'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export default function OrderListPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        const fetchOrders = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setIsLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('shop_orders')
                .select(`
                    *,
                    shop_order_items (
                        *,
                        shop_products (*)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setOrders(data)
            setIsLoading(false)
        }

        fetchOrders()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'afgerond':
            case 'completed':
            case 'paid':
                return 'text-[#0df2a2]'
            case 'pending':
            case 'openstaand':
                return 'text-yellow-500'
            case 'cancelled':
                return 'text-red-500'
            default:
                return 'text-gray-400'
        }
    }

    const filteredOrders = orders.filter(order =>
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Search Header */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 group-focus-within:text-[#0df2a2] transition-colors">search</span>
                </div>
                <input
                    type="text"
                    placeholder="Filter op ordernummer of referentie"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-16 bg-[#1A1D1C]/40 border border-white/5 rounded-3xl pl-16 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0df2a2]/20 focus:border-[#0df2a2]/30 transition-all placeholder:text-gray-600"
                />
            </div>

            {/* Orders Table-like View */}
            <div className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="col-span-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Ordernummer</div>
                    <div className="col-span-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Prijs (excl.)</div>
                    <div className="col-span-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Besteldatum</div>
                    <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</div>
                </div>

                {isLoading ? (
                    <div className="p-20 text-center">
                        <div className="size-12 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">Bestellingen laden...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-gray-600 text-[40px]">inventory_2</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Geen bestellingen gevonden</h3>
                        <p className="text-gray-500 text-sm mb-8">U heeft nog geen bestellingen geplaatst in onze shop.</p>
                        <Link href="/shop" className="px-8 py-4 bg-[#0df2a2] text-[#0A0A0A] font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all inline-block shadow-lg">
                            Naar de shop
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredOrders.map((order) => {
                            const firstItem = order.shop_order_items?.[0]
                            const productImage = firstItem?.shop_products?.images?.[0] || ''

                            return (
                                <Link
                                    href={`/shop/account/orders/${order.id}`}
                                    key={order.id}
                                    className="grid grid-cols-12 gap-4 px-8 py-8 items-center hover:bg-white/[0.03] transition-all group active:scale-[0.995]"
                                >
                                    <div className="col-span-4 flex items-center gap-6">
                                        <div className="size-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#0df2a2]/30 transition-all">
                                            {productImage ? (
                                                <img src={productImage} alt="Order" className="size-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-700 text-[32px]">image</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-lg tracking-tighter text-white">{order.order_number || `ORD-${order.id.slice(0, 8)}`}</span>
                                            {order.customer_reference && (
                                                <span className="text-xs text-gray-500 font-medium">{order.customer_reference}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <span className="text-lg font-bold text-white">€ {order.total_amount?.toFixed(2)}</span>
                                    </div>

                                    <div className="col-span-3 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-gray-600 text-[20px]">calendar_today</span>
                                        <span className="text-sm font-semibold text-gray-400">
                                            {order.created_at ? format(new Date(order.created_at), 'd MMM yyyy', { locale: nl }) : 'Onbekend'}
                                        </span>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full bg-current ${getStatusColor(order.status || 'afgerond')}`}></div>
                                            <span className={`text-sm font-black uppercase tracking-widest ${getStatusColor(order.status || 'afgerond')}`}>
                                                {order.status || 'Afgerond'}
                                            </span>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-700 group-hover:text-[#0df2a2] group-hover:translate-x-1 transition-all">chevron_right</span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
