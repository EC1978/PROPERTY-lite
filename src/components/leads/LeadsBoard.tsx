'use client'

import { useState } from 'react'

interface Lead {
    id: string
    name: string
    status: 'new' | 'contacted' | 'negotiation' | 'closed'
    address?: string
    assignedTo?: string // 'me' | 'team' | 'unassigned'
    lastContact?: string
    interest?: 'buy' | 'sell' | 'rent'
    price_range?: string
}

const MOCK_LEADS: Lead[] = [
    { id: '1', name: 'Jan Jansen', status: 'new', address: 'Parklaan 42, Amsterdam', assignedTo: 'unassigned', lastContact: '2 min geleden', interest: 'buy', price_range: '€450k-550k' },
    { id: '2', name: 'Sophie de Vries', status: 'contacted', address: 'Zonnehof 5, Utrecht', assignedTo: 'me', lastContact: '1 uur geleden', interest: 'sell', price_range: '€300k' },
    { id: '3', name: 'Pieter de Groot', status: 'negotiation', address: 'Amstelstraat 12, Amsterdam', assignedTo: 'team', lastContact: '1 dag geleden', interest: 'rent', price_range: '€1500/m' },
    { id: '4', name: 'Lisa Bakker', status: 'new', address: 'Prinsengracht 102, Amsterdam', assignedTo: 'me', lastContact: '2 dagen geleden', interest: 'buy', price_range: '€850k+' },
    { id: '5', name: 'Mark Rutte', status: 'closed', address: 'Binnenhof 1, Den Haag', assignedTo: 'team', lastContact: '1 week geleden', interest: 'sell', price_range: '€1.2M' },
]

export default function LeadsBoard() {
    const [filter, setFilter] = useState<'all' | 'mine' | 'unassigned'>('all')

    const filteredLeads = MOCK_LEADS.filter(lead => {
        if (filter === 'mine') return lead.assignedTo === 'me'
        if (filter === 'unassigned') return lead.assignedTo === 'unassigned'
        return true
    })

    const getStatusColor = (status: Lead['status']) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
            case 'contacted': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
            case 'negotiation': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
            case 'closed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-full md:w-fit">
                {(['all', 'mine', 'unassigned'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'bg-white dark:bg-[#222] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        {f === 'all' ? 'Alle Leads' : f === 'mine' ? 'Mijn Leads' : 'Onbehandeld'}
                    </button>
                ))}
            </div>

            {/* Leads List */}
            <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredLeads.map((lead) => (
                        <div key={lead.id} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="size-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold shrink-0 shadow-sm">
                                    {lead.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{lead.name}</h4>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="truncate max-w-[200px]">{lead.address}</span>
                                        <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                        <span className="font-medium text-[#0df2a2]/80">{lead.lastContact}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                                    {lead.status}
                                </span>
                                <div className="text-xs font-bold text-gray-900 dark:text-white sm:text-gray-500">
                                    {lead.price_range}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredLeads.length === 0 && (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            Geen leads gevonden in deze categorie.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
