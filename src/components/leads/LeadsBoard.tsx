'use client'

import { useState, useRef, useEffect } from 'react'

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: 'Nieuw', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    contacted: { label: 'Gecontacteerd', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    negotiation: { label: 'Onderhandeling', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    closed: { label: 'Afgerond', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
}

interface LeadsBoardProps {
    leads: Lead[]
}

export default function LeadsBoard({ leads: initialLeads }: LeadsBoardProps) {
    const [filter, setFilter] = useState<'all' | 'warm' | 'scheduled'>('all')
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [leads, setLeads] = useState(initialLeads)
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Sync with props
    useEffect(() => { setLeads(initialLeads) }, [initialLeads])

    // Close menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpenId(null)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const filteredLeads = leads.filter(lead => {
        if (filter === 'warm') return lead.score >= 60 || lead.is_hot
        if (filter === 'scheduled') return lead.status === 'contacted'
        return true
    })

    // --- API handlers ---
    const handleStatusChange = async (leadId: string, newStatus: string) => {
        setIsUpdating(true)
        try {
            const res = await fetch('/api/voice/capture-lead', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, status: newStatus })
            })
            if ((await res.json()).success) {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as Lead['status'] } : l))
                if (selectedLead?.id === leadId) {
                    setSelectedLead(prev => prev ? { ...prev, status: newStatus as Lead['status'] } : null)
                }
            }
        } catch (err) { console.error(err) }
        setIsUpdating(false)
        setStatusDropdownOpen(false)
        setMenuOpenId(null)
    }

    const handleDelete = async (leadId: string) => {
        setIsUpdating(true)
        try {
            const res = await fetch(`/api/voice/capture-lead?id=${leadId}`, { method: 'DELETE' })
            if ((await res.json()).success) {
                setLeads(prev => prev.filter(l => l.id !== leadId))
                if (selectedLead?.id === leadId) setSelectedLead(null)
            }
        } catch (err) { console.error(err) }
        setIsUpdating(false)
        setDeleteConfirm(false)
        setMenuOpenId(null)
    }

    // --- Extract phone/email from wensen ---
    const extractContact = (wensen?: string | null) => {
        const phone = wensen?.match(/📞 Telefoon: ([\d+\s()-]+)/)?.[1]?.trim() || ''
        const email = wensen?.match(/📧 Email: ([\w.@+-]+)/)?.[1]?.trim() || ''
        return { phone, email }
    }

    // ==================== LEAD DETAIL VIEW ====================
    if (selectedLead) {
        const statusCfg = STATUS_CONFIG[selectedLead.status] || STATUS_CONFIG.new
        const { phone, email } = extractContact(selectedLead.wensen)

        return (
            <div className="relative animate-in slide-in-from-right-4 duration-300">
                <header className="flex items-center justify-between py-4 mb-2">
                    <button onClick={() => { setSelectedLead(null); setDeleteConfirm(false); setStatusDropdownOpen(false) }} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-slate-700 dark:text-white">arrow_back</span>
                    </button>
                    <h1 className="text-sm font-semibold tracking-wide uppercase text-slate-500 dark:text-gray-400">Lead Details</h1>
                    <button onClick={() => setDeleteConfirm(true)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-red-500/10 transition-colors" title="Verwijder lead">
                        <span className="material-symbols-outlined text-red-400">delete</span>
                    </button>
                </header>

                {/* Delete Confirmation Banner */}
                {deleteConfirm && (
                    <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between gap-3 animate-in fade-in duration-200">
                        <p className="text-sm text-red-300 font-medium">Lead definitief verwijderen?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-xs font-bold rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all">Annuleer</button>
                            <button onClick={() => handleDelete(selectedLead.id)} disabled={isUpdating} className="px-4 py-2 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50">
                                {isUpdating ? '...' : 'Verwijder'}
                            </button>
                        </div>
                    </div>
                )}

                <section className="grid grid-cols-2 gap-3 w-full">
                    {/* Profile Card */}
                    <div className="col-span-2 relative z-20 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-5 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="relative shrink-0">
                                <div className="w-16 h-16 rounded-full bg-cover bg-center border-2 border-[#0df2a2]/30" style={{ backgroundImage: `url('${selectedLead.image}')` }}></div>
                                <div className="absolute -bottom-1 -right-1 bg-[#0df2a2] text-[#050505] text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-[#050505]">
                                    ACTIEF
                                </div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedLead.name}</h2>
                                <p className="text-xs text-slate-500 dark:text-gray-400 mb-2">{selectedLead.address}</p>
                                {/* Status selector */}
                                <div className="relative">
                                    <button
                                        onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-all ${statusCfg.bg} ${statusCfg.color}`}
                                    >
                                        {statusCfg.label}
                                        <span className="material-symbols-outlined text-[14px]">expand_more</span>
                                    </button>
                                    {statusDropdownOpen && (
                                        <div className="absolute top-full left-0 mt-1 z-50 w-44 rounded-xl bg-[#111] border border-white/10 shadow-2xl py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleStatusChange(selectedLead.id, key)}
                                                    disabled={isUpdating}
                                                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center gap-2 ${selectedLead.status === key ? 'bg-white/5' : ''}`}
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${cfg.color.replace('text-', 'bg-')}`}></span>
                                                    <span className="text-white">{cfg.label}</span>
                                                    {selectedLead.status === key && <span className="material-symbols-outlined text-[#0df2a2] text-sm ml-auto">check</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lead Score */}
                    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white dark:bg-[#0A0A0A]/50 border border-gray-200 dark:border-white/5 p-4 shadow-sm backdrop-blur-sm aspect-[4/3]">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-400">Lead Score</span>
                            <span className="material-symbols-outlined text-[#0df2a2] text-lg">trending_up</span>
                        </div>
                        <div className="relative z-10 mt-auto">
                            <div className="flex items-baseline gap-0.5">
                                <span className={`text-4xl font-bold tracking-tight ${selectedLead.score >= 60 ? 'text-[#0df2a2]' : 'text-slate-900 dark:text-white'}`}>{selectedLead.score}</span>
                                <span className="text-sm font-medium text-slate-400 dark:text-gray-500">/100</span>
                            </div>
                            <p className={`mt-1 text-xs font-medium ${selectedLead.score >= 80 ? 'text-[#0df2a2]' : selectedLead.score >= 60 ? 'text-amber-400' : selectedLead.score >= 40 ? 'text-blue-400' : 'text-slate-400'}`}>
                                {selectedLead.score >= 80 ? '🔥 Warme Lead' : selectedLead.score >= 60 ? '⚡ Hoge Intentie' : selectedLead.score >= 40 ? '💡 Geïnteresseerd' : '👀 Verkenner'}
                            </p>
                        </div>
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#0df2a2]/10 blur-2xl transition-all group-hover:bg-[#0df2a2]/20"></div>
                    </div>

                    {/* Wensen */}
                    <div className="relative flex flex-col gap-2 overflow-hidden rounded-2xl bg-white dark:bg-[#0A0A0A]/50 border border-gray-200 dark:border-white/5 p-4 shadow-sm backdrop-blur-sm aspect-[4/3]">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-gray-400">Wensen</span>
                        <div className="text-sm font-medium leading-snug text-slate-700 dark:text-gray-200 mt-auto space-y-1.5">
                            {selectedLead.wensen ? (
                                selectedLead.wensen.split('\n').map((line, i) => (
                                    <p key={i} className="text-xs">{line}</p>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 dark:text-gray-500 italic">Geen wensen genoteerd</p>
                            )}
                            {selectedLead.budget && selectedLead.budget !== 'Onbekend' && (
                                <p className="text-xs text-slate-500 dark:text-gray-400 font-normal mt-1">💰 Budget: {selectedLead.budget}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="col-span-2 flex gap-3 mt-2">
                        <a
                            href={phone ? `tel:${phone}` : '#'}
                            className={`flex-1 group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] ${phone ? 'bg-[#0df2a2] text-[#050505] hover:bg-[#0ce096]' : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-gray-500 cursor-not-allowed'}`}
                            onClick={(e) => !phone && e.preventDefault()}
                        >
                            <span className="material-symbols-outlined text-[20px]">call</span>
                            <span>{phone ? `Bel ${phone}` : 'Bel Lead'}</span>
                        </a>
                        <a
                            href={email ? `mailto:${email}` : '#'}
                            className={`flex-1 flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3 text-sm font-bold transition-all active:scale-[0.98] ${email ? 'bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10' : 'bg-transparent text-slate-400 dark:text-gray-600 cursor-not-allowed'}`}
                            onClick={(e) => !email && e.preventDefault()}
                        >
                            <span className="material-symbols-outlined text-[20px]">mail</span>
                            <span>{email ? 'E-mail' : 'E-mail'}</span>
                        </a>
                    </div>
                </section>

                {/* Transcript Section */}
                <div className="my-6 flex items-center justify-center gap-3 opacity-60">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-300 dark:to-gray-600"></div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-gray-500">Gesprek Samenvatting</span>
                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-300 dark:to-gray-600"></div>
                </div>

                <section className="w-full mb-10">
                    <div className="rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-5 shadow-sm backdrop-blur-md">
                        {selectedLead.message && !selectedLead.message.startsWith('Lead via Voice AI') ? (
                            <p className="text-sm leading-relaxed text-slate-700 dark:text-gray-200">{selectedLead.message}</p>
                        ) : (
                            <p className="text-sm text-slate-400 dark:text-gray-500 italic text-center">Nog geen gespreksamenvatting beschikbaar. Deze wordt automatisch aangemaakt na het beëindigen van een gesprek.</p>
                        )}
                    </div>
                </section>
            </div>
        )
    }

    // ==================== LEADS LIST VIEW ====================
    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button
                    onClick={() => setFilter('all')}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 font-semibold text-sm transition-all ${filter === 'all'
                        ? 'bg-[#0df2a2] text-black shadow-lg shadow-[#0df2a2]/20'
                        : 'bg-white/5 border border-white/10 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    Alle ({leads.length})
                </button>
                <button
                    onClick={() => setFilter('warm')}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 font-medium text-sm transition-all ${filter === 'warm'
                        ? 'bg-[#0df2a2] text-black shadow-lg shadow-[#0df2a2]/20'
                        : 'bg-white/5 border border-white/10 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    🔥 Warme Leads
                </button>
                <button
                    onClick={() => setFilter('scheduled')}
                    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-6 font-medium text-sm transition-all ${filter === 'scheduled'
                        ? 'bg-[#0df2a2] text-black shadow-lg shadow-[#0df2a2]/20'
                        : 'bg-white/5 border border-white/10 text-slate-700 dark:text-white hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                >
                    Gecontacteerd
                </button>
            </div>

            {/* Leads List */}
            <div className="space-y-4">
                {filteredLeads.map((lead) => {
                    const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
                    return (
                        <div
                            key={lead.id}
                            className="bg-white/40 dark:bg-[#0A0A0A]/40 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-4 relative group hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
                        >
                            <div className="flex justify-between items-start" onClick={() => setSelectedLead(lead)}>
                                <div className="flex gap-4">
                                    <div className="relative shrink-0">
                                        <img src={lead.image} alt={lead.name} className={`w-14 h-14 rounded-full object-cover ${!lead.is_hot ? 'grayscale-[40%]' : ''}`} />
                                        <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-[#0A0A0A] rounded-full ${lead.is_hot ? 'bg-[#0df2a2]' : 'bg-[#0df2a2]/40'}`}></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-slate-900 dark:text-white text-base font-bold leading-tight">{lead.name}</h3>
                                        <p className="text-slate-500 dark:text-[#94A3B8] text-sm font-normal mt-0.5">{lead.address}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                                                {statusCfg.label}
                                            </span>
                                            <p suppressHydrationWarning className="text-slate-400 dark:text-[#94A3B8]/60 text-xs flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">schedule</span> {getTimeAgo(lead.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className={`${lead.score >= 60 ? 'shadow-[0_0_15px_rgba(13,242,162,0.2)] bg-[#0df2a2]/20 border border-[#0df2a2]/30 text-[#0df2a2]' : 'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-600 dark:text-white'} rounded-full px-3 py-1 text-xs font-bold tracking-wider`}>
                                        {lead.score}/100
                                    </div>
                                    {lead.is_hot && (
                                        <span className="text-[10px] text-[#0df2a2] uppercase font-bold tracking-widest px-1">Hot Lead</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/5">
                                {lead.message && !lead.message.startsWith('Lead via Voice AI') ? (
                                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] italic line-clamp-1 flex-1 mr-2" onClick={() => setSelectedLead(lead)}>{lead.message}</p>
                                ) : (
                                    <div className="flex -space-x-2" onClick={() => setSelectedLead(lead)}>
                                        <div className="w-8 h-8 rounded-full bg-[#0df2a2]/10 flex items-center justify-center border-2 border-white dark:border-[#0A0A0A]">
                                            <span className="material-symbols-outlined text-[#0df2a2] text-sm">smart_toy</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 relative" ref={menuOpenId === lead.id ? menuRef : null}>
                                    <button
                                        onClick={() => setSelectedLead(lead)}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-white hover:bg-[#0df2a2] hover:text-[#050505] dark:hover:bg-[#0df2a2] dark:hover:text-[#050505] transition-all"
                                    >
                                        <span className="material-symbols-outlined">visibility</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === lead.id ? null : lead.id) }}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-white hover:bg-[#0df2a2] hover:text-[#050505] dark:hover:bg-[#0df2a2] dark:hover:text-[#050505] transition-all"
                                    >
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {menuOpenId === lead.id && (
                                        <div className="absolute bottom-full right-0 mb-2 z-50 w-48 rounded-xl bg-[#111] border border-white/10 shadow-2xl py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <button onClick={() => { setSelectedLead(lead); setMenuOpenId(null) }} className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">info</span> Details bekijken
                                            </button>
                                            <div className="h-px bg-white/5 mx-2"></div>
                                            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleStatusChange(lead.id, key)}
                                                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5 flex items-center gap-2"
                                                >
                                                    <span className={`w-2 h-2 rounded-full ${cfg.color.replace('text-', 'bg-')}`}></span>
                                                    {cfg.label}
                                                    {lead.status === key && <span className="text-[#0df2a2] ml-auto">✓</span>}
                                                </button>
                                            ))}
                                            <div className="h-px bg-white/5 mx-2"></div>
                                            <button onClick={() => handleDelete(lead.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px]">delete</span> Verwijder
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}

                {filteredLeads.length === 0 && (
                    <div className="p-20 text-center border border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-white/5">
                        <div className="size-16 bg-[#0df2a2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-[#0df2a2] text-3xl">inbox</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Nog geen leads</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            Zodra bezoekers vragen stellen aan de AI Makelaar, verschijnen ze hier automatisch.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
