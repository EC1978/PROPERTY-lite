'use client'

import { useState } from 'react'

export interface Lead {
    id: string
    name: string
    address: string
    status: 'new' | 'contacted' | 'negotiation' | 'closed'
    score: number
    is_hot: boolean
    created_at: string
    message?: string | null
    image: string
    wensen?: string | null
    budget?: string | null
    chatHistory: { sender: 'ai' | 'lead'; message: string; time: string }[]
}

function getTimeAgo(dateString: string): string {
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now.getTime() - past.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)

    if (diffMinutes < 1) return 'Nu'
    if (diffMinutes < 60) return `${diffMinutes}m geleden`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}u geleden`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d geleden`
    const diffWeeks = Math.floor(diffDays / 7)
    return `${diffWeeks}w geleden`
}

interface LeadsBoardProps {
    leads: Lead[]
}

export default function LeadsBoard({ leads }: LeadsBoardProps) {
    const [filter, setFilter] = useState<'all' | 'warm' | 'scheduled'>('all')
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    const filteredLeads = leads.filter(lead => {
        if (filter === 'warm') return lead.score >= 80
        if (filter === 'scheduled') return lead.status === 'contacted'
        return true
    })

    if (selectedLead) {
        return (
            <div className="relative animate-in slide-in-from-right-4 duration-300">
                <header className="flex items-center justify-between py-4 mb-2">
                    <button onClick={() => setSelectedLead(null)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
                    </button>
                    <h1 className="text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-gray-400">Lead Details</h1>
                    <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-slate-700 dark:text-white">ios_share</span>
                    </button>
                </header>

                <section className="grid grid-cols-2 gap-3 w-full">
                    <div className="col-span-2 relative overflow-hidden rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-full bg-cover bg-center border-2 border-[#0df2a2]/30" style={{ backgroundImage: `url('${selectedLead.image}')` }}></div>
                                <div className="absolute -bottom-1 -right-1 bg-[#0df2a2] text-[#050505] text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#050505]">
                                    ACTIEF
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedLead.name}</h2>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">{selectedLead.address}</p>
                                {selectedLead.is_hot && (
                                    <span className="inline-flex self-start items-center gap-1 rounded-md bg-[#0df2a2]/10 px-2 py-1 text-xs font-medium text-[#0df2a2] ring-1 ring-inset ring-[#0df2a2]/20">
                                        Warme Lead
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-[#0A0A0A]/50 border border-gray-200 dark:border-white/5 p-4 shadow-sm backdrop-blur-sm aspect-[4/3]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-400">Lead Score</span>
                            <span className="material-symbols-outlined text-[#0df2a2] text-lg">trending_up</span>
                        </div>
                        <div className="relative z-10 mt-auto">
                            <div className="flex items-baseline gap-0.5">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{selectedLead.score}</span>
                                <span className="text-sm font-medium text-slate-400 dark:text-gray-500">/100</span>
                            </div>
                            <p className="mt-1 text-xs font-medium text-[#0df2a2]">+ Hoge Intentie</p>
                        </div>
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#0df2a2]/10 blur-2xl transition-all group-hover:bg-[#0df2a2]/20"></div>
                    </div>

                    <div className="relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-white dark:bg-[#0A0A0A]/50 border border-gray-200 dark:border-white/5 p-4 shadow-sm backdrop-blur-sm aspect-[4/3]">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-400">Wensen</span>
                        <p className="text-sm font-medium leading-snug text-slate-700 dark:text-gray-200 mt-auto">
                            {selectedLead.wensen}
                            <span className="block mt-2 text-slate-500 dark:text-gray-400 font-normal">Budget: {selectedLead.budget}</span>
                        </p>
                    </div>

                    <div className="col-span-2 flex gap-3 mt-2">
                        <button className="flex-1 group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#0df2a2] px-4 py-3 text-sm font-bold text-[#050505] transition-all hover:bg-[#0ce096] active:scale-[0.98]">
                            <span className="material-symbols-outlined text-[20px]">call</span>
                            <span>Bel Lead</span>
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-[0.98]">
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                            <span>E-mail</span>
                        </button>
                    </div>
                </section>

                <div className="my-6 flex items-center justify-center gap-3 opacity-60">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-300 dark:to-gray-600"></div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-gray-500">Transcript AI Sessie</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-300 dark:to-gray-600"></div>
                </div>

                <section className="flex flex-col gap-6 w-full">
                    {selectedLead.chatHistory.map((chat, idx) => (
                        <div key={idx} className={`flex w-full flex-col gap-1 ${chat.sender === 'ai' ? 'items-end' : 'items-start'}`}>
                            <div className={`${chat.sender === 'ai'
                                ? 'group relative max-w-[85%] rounded-2xl rounded-tr-sm bg-[#0df2a2]/10 border border-[#0df2a2]/30 p-4 text-sm text-slate-800 dark:text-gray-100 shadow-[0_4px_20px_-4px_rgba(13,242,162,0.15)] backdrop-blur-md'
                                : 'relative max-w-[85%] rounded-2xl rounded-tl-sm bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 text-sm text-slate-800 dark:text-gray-100 shadow-sm backdrop-blur-md'
                                }`}>
                                <p className="leading-relaxed">{chat.message}</p>
                            </div>
                            <div className={`flex items-center gap-1 ${chat.sender === 'ai' ? 'pr-1' : 'pl-1'}`}>
                                <span className={`text-[10px] font-medium ${chat.sender === 'ai' ? 'text-[#0df2a2]' : 'text-slate-500 dark:text-gray-400'}`}>
                                    {chat.sender === 'ai' ? 'VoiceRealty AI' : selectedLead.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-gray-600">• {chat.time}</span>
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Filter Pill Bar */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 font-semibold text-sm transition-all ${filter === 'all'
                        ? 'bg-[#0df2a2] text-black shadow-lg shadow-[#0df2a2]/20'
                        : 'bg-white/5 border border-white/10 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    Alle
                </button>
                <button
                    onClick={() => setFilter('warm')}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 font-medium text-sm transition-all ${filter === 'warm'
                        ? 'bg-[#0df2a2] text-black shadow-lg shadow-[#0df2a2]/20'
                        : 'bg-white/5 border border-white/10 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    Warme Leads
                </button>
                <button
                    onClick={() => setFilter('scheduled')}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 font-medium text-sm transition-all ${filter === 'scheduled'
                        ? 'bg-[#0df2a2] text-black shadow-lg shadow-[#0df2a2]/20'
                        : 'bg-white/5 border border-white/10 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    Ingepland
                </button>
            </div>

            {/* Leads List */}
            <div className="space-y-4">
                {filteredLeads.map((lead) => (
                    <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white/40 dark:bg-[#0A0A0A]/40 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="relative shrink-0">
                                    <img src={lead.image} alt={lead.name} className={`w-14 h-14 rounded-full object-cover ${!lead.is_hot ? 'grayscale-[40%]' : ''}`} />
                                    <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-[#0A0A0A] rounded-full ${lead.is_hot ? 'bg-[#0df2a2]' : 'bg-[#0df2a2]/40'}`}></div>
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-slate-900 dark:text-white text-base font-bold leading-tight">{lead.name}</h3>
                                    <p className="text-slate-500 dark:text-[#94A3B8] text-sm font-normal mt-0.5">{lead.address}</p>
                                    <p className="text-slate-400 dark:text-[#94A3B8]/60 text-xs mt-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">schedule</span> {getTimeAgo(lead.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className={`${lead.is_hot ? 'shadow-[0_0_15px_rgba(13,242,162,0.2)] bg-[#0df2a2]/20 border border-[#0df2a2]/30 text-[#0df2a2]' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-600 dark:text-white'} rounded-full px-3 py-1 text-xs font-bold tracking-wider`}>
                                    {lead.score}/100
                                </div>
                                {lead.is_hot && (
                                    <span className="text-[10px] text-[#0df2a2] uppercase font-bold tracking-widest px-1">Hot Lead</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/5">
                            {lead.message ? (
                                <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic">{lead.message}</p>
                            ) : (
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-[#0df2a2]/10 flex items-center justify-center border-2 border-white dark:border-[#0A0A0A]">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-sm">smart_toy</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border-2 border-white dark:border-[#0A0A0A]">
                                        <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-sm">call</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-white hover:bg-[#0df2a2] hover:text-[#050505] dark:hover:bg-[#0df2a2] dark:hover:text-[#050505] transition-all">
                                    <span className="material-symbols-outlined">{lead.message ? 'calendar_month' : 'chat_bubble'}</span>
                                </button>
                                <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-white hover:bg-[#0df2a2] hover:text-[#050505] dark:hover:bg-[#0df2a2] dark:hover:text-[#050505] transition-all">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredLeads.length === 0 && (
                    <div className="p-12 text-center text-slate-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                        Geen leads gevonden in deze categorie.
                    </div>
                )}
            </div>
        </div>
    )
}
