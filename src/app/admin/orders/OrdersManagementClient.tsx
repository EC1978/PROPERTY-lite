'use client'

import { useState } from 'react'
import {
    ShoppingCart, Search, Eye, Filter,
    Calendar, User, CreditCard, Clock,
    CheckCircle2, AlertCircle, Package,
    ChevronRight, X
} from 'lucide-react'
import { updateOrderStatus } from '../products/actions'
import toast from 'react-hot-toast'

type Order = {
    id: string
    created_at: string
    total_amount: number
    status: string
    payment_status: string
    users: {
        email: string
        full_name: string | null
    }
    shop_order_items: {
        id: string
        quantity: number
        price_at_purchase: number
        options: any
        shop_products: {
            name: string
        }
    }[]
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
    'pending': { label: 'In afwachting', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: Clock },
    'processing': { label: 'In behandeling', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Package },
    'shipped': { label: 'Verzonden', color: 'text-[#0df2a2] bg-[#0df2a2]/10 border-[#0df2a2]/20', icon: Package },
    'delivered': { label: 'Geleverd', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
    'cancelled': { label: 'Geannuleerd', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertCircle }
}

export default function OrdersManagementClient({ initialOrders }: { initialOrders: Order[] }) {
    const [orders, setOrders] = useState(initialOrders)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('Alle')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.users.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            o.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'Alle' || o.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        const loadingToast = toast.loading('Status bijwerken...')
        try {
            const result = await updateOrderStatus(orderId, newStatus)
            if (result.success) {
                toast.success('Status bijgewerkt!', { id: loadingToast })
                window.location.reload()
            } else {
                toast.error(result.error || 'Fout bij bijwerken', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Netwerkfout', { id: loadingToast })
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <ShoppingCart className="w-8 h-8 text-[#0df2a2]" />
                    Bestellingen
                </h2>
                <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold font-mono">Monitor en beheer alle shop transacties</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Zoek op klant, e-mail of order ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/5 rounded-xl px-4">
                    <Filter className="w-4 h-4 text-zinc-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-white text-xs font-bold uppercase tracking-widest focus:outline-none w-full py-4 cursor-pointer"
                    >
                        <option value="Alle" className="bg-[#1A1A1A]">Alle Statussen</option>
                        {Object.keys(STATUS_CONFIG).map(s => (
                            <option key={s} value={s} className="bg-[#1A1A1A]">{STATUS_CONFIG[s].label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Klant / Datum</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Totaal</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredOrders.map(order => {
                                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending']
                                return (
                                    <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white group-hover:text-[#0df2a2] transition-colors">
                                                    {order.users?.full_name || order.users?.email}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-tighter">
                                                    {new Date(order.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${status.color}`}>
                                                <status.icon className="w-3 h-3" />
                                                {status.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-white">€{order.total_amount.toFixed(2)}</div>
                                            <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{order.payment_status}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 rounded-lg bg-zinc-800 hover:bg-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Bekijken
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                                        Geen bestellingen gevonden
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#111] z-10">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    Order <span className="text-[#0df2a2]">#{selectedOrder.id.slice(0, 8)}</span>
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Gedetailleerd overzicht van bestelling</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left: Customer & Main Info */}
                            <div className="md:col-span-1 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3 h-3" /> Klant Informatie
                                    </h4>
                                    <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-2">
                                        <div className="text-sm font-bold text-white">{selectedOrder.users?.full_name || 'Anonieme Gebruiker'}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono italic">{selectedOrder.users?.email}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard className="w-3 h-3" /> Betaling
                                    </h4>
                                    <div className="bg-white/2 border border-white/5 p-4 rounded-xl">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-zinc-500 font-medium">Status</span>
                                            <span className={`font-black uppercase tracking-tighter ${selectedOrder.payment_status === 'paid' ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                {selectedOrder.payment_status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <Package className="w-3 h-3" /> Status Beheren
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {Object.keys(STATUS_CONFIG).map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusChange(selectedOrder.id, s)}
                                                className={`text-[10px] font-black uppercase tracking-widest p-3 rounded-lg border transition-all text-left flex items-center justify-between ${selectedOrder.status === s
                                                        ? 'bg-[#0df2a2]/10 border-[#0df2a2] text-[#0df2a2]'
                                                        : 'bg-white/2 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {STATUS_CONFIG[s].label}
                                                {selectedOrder.status === s && <CheckCircle2 className="w-3 h-3" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Items List */}
                            <div className="md:col-span-2 space-y-6">
                                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <Package className="w-3 h-3" /> Bestelde Artikelen
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.shop_order_items.map(item => (
                                        <div key={item.id} className="bg-white/2 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="text-sm font-black text-white">{item.shop_products?.name || 'Onbekend Product'}</div>
                                                    <div className="text-[10px] text-[#0df2a2] font-mono mt-0.5">Aantal: {item.quantity} st.</div>
                                                </div>
                                                <div className="text-sm font-black text-white">€{(item.price_at_purchase * item.quantity).toFixed(2)}</div>
                                            </div>

                                            {/* Config Details */}
                                            {item.options && Array.isArray(item.options) && (
                                                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                                                    {item.options.map((opt: any, idx: number) => (
                                                        <div key={idx} className="flex flex-col">
                                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{opt.name}</span>
                                                            <span className="text-[10px] text-zinc-400 font-bold">{opt.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center px-4">
                                    <div className="text-xl font-black text-zinc-500 uppercase tracking-tighter">Totaal</div>
                                    <div className="text-3xl font-black text-[#0df2a2]">€{selectedOrder.total_amount.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
