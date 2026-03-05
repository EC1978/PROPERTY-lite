'use client'

import React, { useState } from 'react'
import { Search, Filter, MoreVertical, X, Check, Eye, AlertTriangle, AlertCircle, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import toast, { Toaster } from 'react-hot-toast'

type Complaint = {
    id: string
    user_id: string
    order_id: string
    claim_number: string
    description: string
    status: string
    admin_response: string | null
    created_at: string
    selected_items: any[]
    shop_orders?: {
        order_number: string
        created_at: string
        shipping_address: any
    }
    users?: {
        email: string
        full_name: string
    }
}

export default function ComplaintsManagementClient({ initialComplaints }: { initialComplaints: Complaint[] }) {
    const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form states for the modal
    const [editStatus, setEditStatus] = useState('')
    const [editResponse, setEditResponse] = useState('')

    const filteredComplaints = complaints.filter(c => {
        const matchesSearch =
            c.claim_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.shop_orders?.order_number?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'open' && c.status !== 'Opgelost' && c.status !== 'Afgewezen') ||
            (statusFilter === 'closed' && (c.status === 'Opgelost' || c.status === 'Afgewezen'))

        return matchesSearch && matchesStatus
    })

    const handleOpenModal = (complaint: Complaint) => {
        setSelectedComplaint(complaint)
        setEditStatus(complaint.status || 'In behandeling')
        setEditResponse(complaint.admin_response || '')
    }

    const handleSave = async () => {
        if (!selectedComplaint) return

        setIsSaving(true)
        const loadingToast = toast.loading('Klacht bijwerken...')

        try {
            const { updateComplaint } = await import('./actions')
            const result = await updateComplaint(selectedComplaint.id, editStatus, editResponse)

            if (result.error) throw new Error(result.error)

            // Update local state
            setComplaints(prev => prev.map(c =>
                c.id === selectedComplaint.id
                    ? { ...c, status: editStatus, admin_response: editResponse }
                    : c
            ))

            toast.success('Klacht succesvol bijgewerkt!', { id: loadingToast })
            setSelectedComplaint(null)
        } catch (error: any) {
            console.error('Update error:', error)
            toast.error(error.message || 'Er is een fout opgetreden.', { id: loadingToast })
        } finally {
            setIsSaving(false)
        }
    }

    const getStatusColors = (status: string) => {
        switch (status.toLowerCase()) {
            case 'in behandeling': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
            case 'opgelost': return 'bg-[#0df2a2]/10 border-[#0df2a2]/20 text-[#0df2a2]'
            case 'afgewezen': return 'bg-red-500/10 border-red-500/20 text-red-500'
            default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400'
        }
    }

    return (
        <div className="space-y-6">
            <Toaster position="bottom-right" />

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-1">Reclamaties</h1>
                    <p className="text-zinc-500 text-sm">Beheer klachten en reclamaties van makelaars</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Zoek claim, orde, naam..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#0df2a2]/50 transition-colors"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#1A1A1A] border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#0df2a2]/50 transition-colors appearance-none cursor-pointer"
                    >
                        <option value="all">Alle Statussen</option>
                        <option value="open">Openstaand</option>
                        <option value="closed">Afgehandeld</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-[#1A1A1A]/80 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Claim Nr & Datum</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Makelaar</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Bestelling</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Actie</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredComplaints.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                    Geen reclamaties gevonden.
                                </td>
                            </tr>
                        ) : (
                            filteredComplaints.map(complaint => (
                                <tr key={complaint.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white mb-1 group-hover:text-[#0df2a2] transition-colors">
                                            {complaint.claim_number}
                                        </div>
                                        <div className="text-xs text-zinc-500">
                                            {format(new Date(complaint.created_at), 'd MMM yyyy HH:mm', { locale: nl })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white mb-1">{complaint.users?.full_name || 'Onbekend'}</div>
                                        <div className="text-xs text-zinc-500">{complaint.users?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-white/5 rounded-md border border-white/5 mb-1 group-hover:border-white/10 transition-colors">
                                            <span className="text-xs font-mono text-zinc-300">
                                                {complaint.shop_orders?.order_number || complaint.order_id?.slice(0, 8)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                                            {Array.isArray(complaint.selected_items) ? `${complaint.selected_items.length} item(s)` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColors(complaint.status)}`}>
                                            {complaint.status || 'In behandeling'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleOpenModal(complaint)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all active:scale-95"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredComplaints.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 bg-[#1A1A1A] rounded-2xl border border-white/5">
                        Geen reclamaties gevonden.
                    </div>
                ) : (
                    filteredComplaints.map(complaint => (
                        <div key={complaint.id} className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-white mb-1">{complaint.claim_number}</h3>
                                    <p className="text-xs text-zinc-500">{format(new Date(complaint.created_at), 'd MMM yyyy HH:mm', { locale: nl })}</p>
                                </div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColors(complaint.status)}`}>
                                    {complaint.status || 'In behandeling'}
                                </span>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Makelaar</p>
                                    <p className="text-sm font-medium text-zinc-300">{complaint.users?.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Bestelling</p>
                                    <p className="text-sm font-mono text-zinc-400">{complaint.shop_orders?.order_number || complaint.order_id?.slice(0, 8)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleOpenModal(complaint)}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl transition-all border border-white/5"
                            >
                                Bekijken & Beheren
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedComplaint(null)} />
                    <div className="relative bg-[#1A1D1C] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#1A1D1C]">
                            <div className="flex items-center gap-4">
                                <div className="size-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">{selectedComplaint.claim_number}</h2>
                                    <p className="text-xs text-zinc-400">Gemeld door {selectedComplaint.users?.full_name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrolling Body */}
                        <div className="p-6 overflow-y-auto space-y-8 flex-1">

                            {/* Complaint Details */}
                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3" />
                                    Omschrijving van Makelaar
                                </h3>
                                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-sm leading-relaxed text-zinc-300 italic">
                                    &quot;{selectedComplaint.description}&quot;
                                </div>
                            </section>

                            {/* Items */}
                            <section>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 border-b border-white/5 pb-2">
                                    Betrokken Artikelen uit Order {selectedComplaint.shop_orders?.order_number}
                                </h3>
                                <div className="space-y-2">
                                    {Array.isArray(selectedComplaint.selected_items) ? (
                                        selectedComplaint.selected_items.map((item: any, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-2 px-3 bg-[#0A0A0A] border border-white/5 rounded-xl">
                                                <span className="text-sm font-medium text-zinc-300">{item.name || 'Onbekend'}</span>
                                                <span className="text-xs font-black text-zinc-500">Aantal: {item.quantity || 1}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-zinc-500">Geen specifieke artikelen gespecificeerd.</p>
                                    )}
                                </div>
                            </section>

                            {/* Management Actions */}
                            <section className="bg-[#0A0A0A] p-6 rounded-2xl border border-[#0df2a2]/20">
                                <h3 className="text-sm font-black text-[#0df2a2] mb-4">Afhandeling & Feedback</h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-2">Status van de Klacht</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['In behandeling', 'Opgelost', 'Afgewezen'].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={() => setEditStatus(status)}
                                                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${editStatus === status
                                                            ? 'bg-[#0df2a2]/20 border-[#0df2a2]/50 text-[#0df2a2]'
                                                            : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {status}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-400 mb-2 flex justify-between">
                                            <span>Reactie naar makelaar</span>
                                            <span className="text-zinc-600 font-normal">Zichtbaar voor makelaar</span>
                                        </label>
                                        <textarea
                                            value={editResponse}
                                            onChange={(e) => setEditResponse(e.target.value)}
                                            rows={4}
                                            placeholder="Schrijf hier een reactie of uitleg over de afhandeling..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#0df2a2]/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            </section>

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-[#1A1D1C] flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setSelectedComplaint(null)}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Annuleren
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !editStatus}
                                className="px-5 py-2.5 bg-[#0df2a2] hover:bg-[#0cf1a1]/90 text-black font-black text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(13,242,162,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                                Opslaan & Informeren
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
