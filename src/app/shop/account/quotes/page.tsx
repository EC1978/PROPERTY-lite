'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'

interface Quote {
    id: string;
    quote_number: string;
    title: string;
    total_amount: number;
    status: string;
    created_at: string;
    expires_at: string;
}

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

    const fetchQuotes = async () => {
        setIsLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data, error } = await supabase
                .from('shop_quotes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                setQuotes(data.map(q => ({
                    ...q,
                    total_amount: Number(q.total_amount)
                })))
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchQuotes()
    }, [])

    const filteredQuotes = filter === 'all'
        ? quotes
        : quotes.filter(q => q.status === filter)

    const tabs = [
        { id: 'all', label: 'Alle' },
        { id: 'pending', label: 'In behandeling' },
        { id: 'approved', label: 'Goedgekeurd' },
        { id: 'rejected', label: 'Afgewezen' },
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
                    <span className="text-[#F8FAFC]">Offertes</span>
                </div>
            </nav>

            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn offertes</h1>
                    <p className="text-gray-500 text-sm font-medium">Beheer en keur uw openstaande offertes goed.</p>
                </div>

                {/* Filter Tabs */}
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

            {/* Quotes Table */}
            <div className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 bg-white/[0.03]">
                    <div className="col-span-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Offertenummer</div>
                    <div className="col-span-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Bedrag</div>
                    <div className="col-span-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Status</div>
                    <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 text-right">Datum</div>
                </div>

                <div className="divide-y divide-white/5">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-500 text-xs font-black uppercase tracking-widest">Laden...</div>
                    ) : filteredQuotes.length > 0 ? (
                        filteredQuotes.map((quote) => (
                            <Link
                                href={`/shop/account/quotes/${quote.id}`}
                                key={quote.id}
                                className="grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-white/[0.03] transition-all group cursor-pointer"
                            >
                                <div className="col-span-4 flex flex-col">
                                    <span className="font-black text-base tracking-tight text-white group-hover:text-[#0df2a2] transition-colors">{quote.quote_number}</span>
                                    <span className="text-[11px] text-gray-500 font-medium">{quote.title}</span>
                                </div>
                                <div className="col-span-3">
                                    <span className="text-base font-bold text-white">€ {quote.total_amount.toFixed(2)}</span>
                                </div>
                                <div className="col-span-3 flex items-center gap-2">
                                    <span className={`size-2 rounded-full ${quote.status === 'approved' ? 'bg-[#0df2a2]' : quote.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">
                                        {quote.status === 'approved' ? 'Goedgekeurd' : quote.status === 'rejected' ? 'Afgewezen' : 'In behandeling'}
                                    </span>
                                </div>
                                <div className="col-span-2 text-right">
                                    <span className="text-sm font-semibold text-gray-500">
                                        {format(new Date(quote.created_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-20 text-center">
                            <div className="size-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-gray-700 text-[40px]">history_edu</span>
                            </div>
                            <h3 className="text-lg font-black text-white mb-2">Geen {filter !== 'all' ? filter : ''} offertes</h3>
                            <p className="text-gray-500 text-xs font-medium">U heeft momenteel geen offertes die aan deze criteria voldoen.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
