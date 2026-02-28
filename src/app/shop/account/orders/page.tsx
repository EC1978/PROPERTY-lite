'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

const DUMMY_ORDERS = [
    {
        id: 'dummy-1',
        order_number: '2026431465',
        total_amount: 312.26,
        created_at: '2026-01-30T10:00:00Z',
        status: 'Afgerond',
        shop_order_items: [{ shop_products: { name: 'Babacan DL Blokken', images: [] } }]
    },
    {
        id: 'dummy-2',
        order_number: '2024381072',
        total_amount: 358.66,
        created_at: '2024-10-11T10:00:00Z',
        status: 'Afgerond',
        customer_reference: 'Babacan DL Blokken',
        shop_order_items: [{ shop_products: { name: 'Babacan DL Blokken', images: [] } }]
    },
    {
        id: 'dummy-3',
        order_number: '2024275602',
        total_amount: 39.77,
        created_at: '2024-04-26T10:00:00Z',
        status: 'Afgerond',
        customer_reference: 'Little Aree',
        shop_order_items: [{ shop_products: { name: 'Little Aree', images: [] } }]
    },
    {
        id: 'dummy-4',
        order_number: '2024233821',
        total_amount: 35.94,
        created_at: '2024-02-26T10:00:00Z',
        status: 'Afgerond',
        customer_reference: 'ABR poets bonnen',
        shop_order_items: [{ shop_products: { name: 'ABR poets bonnen', images: [] } }]
    }
]

export default function OrderListPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all')

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

            if (data) {
                setOrders(data)
            }
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

    const filteredOrders = orders.filter(order => {
        const orderNum = order.order_number?.toLowerCase() || ''
        const custRef = order.customer_reference?.toLowerCase() || ''
        const status = order.status?.toLowerCase() || ''
        const search = searchQuery.toLowerCase()

        // Search match
        const matchesSearch = orderNum.includes(search) || custRef.includes(search)

        // Filter match
        let matchesFilter = true
        if (filter === 'paid') {
            matchesFilter = ['afgerond', 'completed', 'paid'].includes(status)
        } else if (filter === 'pending') {
            matchesFilter = ['pending', 'openstaand'].includes(status)
        }

        return matchesSearch && matchesFilter
    })

    const tabs = [
        { id: 'all', label: 'Alle' },
        { id: 'paid', label: 'Betaald' },
        { id: 'pending', label: 'Openstaand' },
    ]

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Bestellingen</span>
                </div>
            </nav>

            {/* Page Title & Filters */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn bestellingen</h1>
                </div>

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 self-start md:self-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as any)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === tab.id
                                ? 'bg-[#0df2a2] text-[#0A0A0A] shadow-lg shadow-[#0df2a2]/10'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Header */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 group-focus-within:text-[#0df2a2] transition-colors">search</span>
                </div>
                <input
                    type="text"
                    placeholder="Zoek op ordernummer of referentie"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-full pl-16 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0df2a2]/20 focus:border-[#0df2a2]/30 transition-all placeholder:text-gray-600"
                    suppressHydrationWarning
                />
            </div>

            {/* Orders Table-like View */}
            <div className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 bg-white/[0.03]">
                    <div className="col-span-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Ordernummer</div>
                    <div className="col-span-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-center md:text-left">Prijs (excl.)</div>
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
                        <h3 className="text-xl font-bold mb-2 text-white">Geen bestellingen gevonden</h3>
                        <p className="text-gray-500 text-sm mb-8">U heeft momenteel geen bestellingen die aan deze criteria voldoen.</p>
                        {searchQuery || filter !== 'all' ? (
                            <button
                                onClick={() => { setSearchQuery(''); setFilter('all') }}
                                className="text-[#0df2a2] font-black text-xs uppercase tracking-widest hover:underline"
                            >
                                Alle filters wissen
                            </button>
                        ) : (
                            <Link href="/shop" className="px-8 py-4 bg-[#0df2a2] text-[#0A0A0A] font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all inline-block shadow-lg">
                                Naar de shop
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredOrders.map((order) => {
                            const firstItem = order.shop_order_items?.[0]
                            const productImage = firstItem?.shop_products?.images?.[0] || ''
                            const status = order.status?.toLowerCase() || 'afgerond'
                            const isCompleted = ['afgerond', 'completed', 'paid'].includes(status)

                            return (
                                <Link
                                    href={`/shop/account/orders/${order.id}`}
                                    key={order.id}
                                    className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.03] transition-all group active:scale-[0.995]"
                                >
                                    <div className="col-span-4 flex items-center gap-6">
                                        <div className="size-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#0df2a2]/30 transition-all">
                                            {productImage ? (
                                                <img src={productImage} alt="Order" className="size-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <span className="material-symbols-outlined text-gray-700 text-[24px]">image</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-black text-base tracking-tight text-white truncate">{order.order_number || `ORD-${order.id.slice(0, 8)}`}</span>
                                            {(order.customer_reference || firstItem?.shop_products?.name) && (
                                                <span className="text-[11px] text-gray-500 font-medium truncate">
                                                    {order.customer_reference || firstItem?.shop_products?.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-3 text-center md:text-left">
                                        <span className="text-base font-bold text-white">€ {order.total_amount?.toFixed(2)}</span>
                                    </div>

                                    <div className="col-span-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-600 text-[18px]">calendar_today</span>
                                        <span className="text-sm font-semibold text-gray-400 capitalize">
                                            {order.created_at ? format(new Date(order.created_at), 'd MMM yyyy', { locale: nl }) : 'Onbekend'}
                                        </span>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-[18px] ${getStatusColor(status)}`}>
                                                {isCompleted ? 'check_circle' : 'pending'}
                                            </span>
                                            <span className={`text-xs font-black uppercase tracking-widest hidden md:inline-block ${getStatusColor(status)}`}>
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
