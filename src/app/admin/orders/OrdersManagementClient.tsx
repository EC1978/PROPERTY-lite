'use client'

import { useState } from 'react'
import {
    ShoppingCart, Search, Eye, Filter,
    Calendar, User, CreditCard, Clock,
    CheckCircle2, AlertCircle, Package,
    ChevronRight, X, Truck, ExternalLink,
    Save, Settings, FileCheck, FileX, Upload, AlertTriangle, Plus
} from 'lucide-react'
import Link from 'next/link'
import { updateOrderStatus, updateOrderTracking, updateOrderDesignStatus, updateOrderDesignUrl, updateOrderDeliveryDate } from '../products/actions'
import { createClient } from '@/utils/supabase/client'
import toast from 'react-hot-toast'

type Order = {
    id: string
    created_at: string
    total_amount: number
    status: string
    payment_status: string
    tracking_number: string | null
    design_url: string | null
    design_status: string | null
    design_remarks: string | null
    delivery_date: string | null
    shop_complaints?: any[] | null
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
    'awaiting_payment': { label: 'Wacht op betaling', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20', icon: CreditCard },
    'processing': { label: 'In behandeling', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: Package },
    'production': { label: 'In productie', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Settings },
    'shipped': { label: 'Verzonden', color: 'text-[#0df2a2] bg-[#0df2a2]/10 border-[#0df2a2]/20', icon: Package },
    'delivered': { label: 'Geleverd', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle2 },
    'cancelled': { label: 'Geannuleerd', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: AlertCircle }
}

export default function OrdersManagementClient({ initialOrders }: { initialOrders: Order[] }) {
    const [orders, setOrders] = useState(initialOrders)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('Alle')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [trackingNumber, setTrackingNumber] = useState('')
    const [customStatus, setCustomStatus] = useState('')
    const [designRemarks, setDesignRemarks] = useState('')
    const [deliveryDate, setDeliveryDate] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.users.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            o.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'Alle' || o.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleUpdateStatus = async (orderId: string, status: string) => {
        try {
            const result = await updateOrderStatus(orderId, status)
            if ('error' in result) {
                toast.error(result.error as string)
            } else if (result.success) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, status })
                }
                toast.success('Status bijgewerkt')
            }
        } catch (error) {
            toast.error('Er is een fout opgetreden')
        }
    }

    const handleUpdateDesignStatus = async (status: string) => {
        if (!selectedOrder) return
        try {
            // Auto-clear URL if rejected
            if (status === 'rejected') {
                await handleUpdateDesignUrl(null)
            }

            const result = await updateOrderDesignStatus(selectedOrder.id, status, designRemarks)
            if (result.success) {
                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, design_status: status, design_remarks: designRemarks } : o))
                setSelectedOrder({ ...selectedOrder, design_status: status, design_remarks: designRemarks })
                toast.success('Bestandstatus bijgewerkt')
            } else {
                toast.error(result.error || 'Fout bij bijwerken status')
            }
        } catch (error) {
            toast.error('Fout bij bijwerken bestandstatus')
        }
    }

    const handleUpdateDesignUrl = async (url: string | null) => {
        if (!selectedOrder) return
        try {
            const result = await updateOrderDesignUrl(selectedOrder.id, url)
            if (result.success) {
                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, design_url: url } : o))
                setSelectedOrder({ ...selectedOrder, design_url: url })
                toast.success(url ? 'Bestand bijgewerkt' : 'Bestand verwijderd')
            } else {
                toast.error(result.error || 'Fout bij bijwerken bestand')
            }
        } catch (error) {
            toast.error('Fout bij bijwerken bestand')
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedOrder) return

        setIsUploading(true)
        const loadingToast = toast.loading('Bestand uploaden...')

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${selectedOrder.id}-${Math.random()}.${fileExt}`
            const filePath = `designs/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('shop-designs')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('shop-designs')
                .getPublicUrl(filePath)

            const result = await updateOrderDesignUrl(selectedOrder.id, publicUrl)
            if (result.success) {
                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, design_url: publicUrl } : o))
                setSelectedOrder({ ...selectedOrder, design_url: publicUrl })
                toast.success('Bestand succesvol geüpload!', { id: loadingToast })
            } else {
                toast.error(result.error || 'Fout bij opslaan URL', { id: loadingToast })
            }
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error('Upload mislukt: ' + error.message, { id: loadingToast })
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    const handleUpdateDeliveryDate = async (date: string) => {
        if (!selectedOrder) return
        try {
            const result = await updateOrderDeliveryDate(selectedOrder.id, date)
            if (result.success) {
                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, delivery_date: date } : o))
                setSelectedOrder({ ...selectedOrder, delivery_date: date })
                toast.success('Leverdatum bijgewerkt')
            } else {
                toast.error(result.error || 'Fout bij bijwerken')
            }
        } catch (error) {
            toast.error('Fout bij bijwerken leverdatum')
        }
    }

    const handleUpdateTracking = async () => {
        if (!selectedOrder) return
        const loadingToast = toast.loading('Track & Trace bijwerken...')
        try {
            const result = await updateOrderTracking(selectedOrder.id, trackingNumber)
            if (result.success) {
                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, tracking_number: trackingNumber } : o))
                setSelectedOrder({ ...selectedOrder, tracking_number: trackingNumber })
                toast.success('Track & Trace opgeslagen!', { id: loadingToast })
            } else {
                toast.error((result as any).error || 'Fout bij bijwerken', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Netwerkfout', { id: loadingToast })
        }
    }

    const openOrderDetails = (order: Order) => {
        setSelectedOrder(order)
        setTrackingNumber(order.tracking_number || '')
        setDesignRemarks(order.design_remarks || '')
        setDeliveryDate(order.delivery_date || '')
        setCustomStatus('')
    }

    const handleCancelOrder = async () => {
        if (!selectedOrder) return
        if (!confirm('Weet je zeker dat je deze bestelling wilt annuleren?')) return
        const loadingToast = toast.loading('Bestelling annuleren...')
        try {
            const result = await updateOrderStatus(selectedOrder.id, 'cancelled')
            if (result.success as any) {
                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o))
                setSelectedOrder({ ...selectedOrder, status: 'cancelled' })
                toast.success('Bestelling geannuleerd', { id: loadingToast })
            } else {
                toast.error((result as any).error || 'Fout bij annuleren', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Er is een fout opgetreden', { id: loadingToast })
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-[#0df2a2]" />
                        Bestellingen
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold font-mono">Monitor en beheer alle shop transacties</p>
                </div>
                <Link href="/admin/orders/new" className="bg-[#0df2a2] hover:bg-white text-black font-black px-6 py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(13,242,162,0.15)] flex items-center gap-2 italic w-fit">
                    <Plus className="w-4 h-4" /> Nieuwe Bestelling
                </Link>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Zoek op makelaar, e-mail of order ID..."
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
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Makelaar / Datum</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Tracking</th>
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
                                            {order.tracking_number ? (
                                                <div className="text-[10px] text-[#0df2a2] font-mono font-bold truncate max-w-[120px]">
                                                    {order.tracking_number}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-zinc-600 italic">Nog geen code</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-black text-white">€{order.total_amount.toFixed(2)}</div>
                                            <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{order.payment_status}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => openOrderDetails(order)}
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
                                    <td colSpan={5} className="px-6 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
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
                    <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#111] z-10">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    Bestelling <span className="text-[#0df2a2]">#{selectedOrder.id.slice(0, 8)}</span>
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Gedetailleerd overzicht van makelaar bestelling</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 pb-0">
                            {selectedOrder.shop_complaints && selectedOrder.shop_complaints.length > 0 && (
                                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-sm">Let op: Deze bestelling heeft een actieve klacht</h4>
                                            <p className="text-zinc-400 text-xs mt-0.5">Er is een reclamatie ingediend door de makelaar.</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/admin/complaints"
                                        className="whitespace-nowrap px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        Klacht Bekijken
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left: Customer & Main Info */}
                            <div className="md:col-span-1 space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <User className="w-3 h-3" /> Makelaar Informatie
                                    </h4>
                                    <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-2">
                                        <div className="text-sm font-bold text-white">{selectedOrder.users?.full_name || 'Onbekende Makelaar'}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono">{selectedOrder.users?.email}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <Truck className="w-3 h-3" /> Track & Trace
                                    </h4>
                                    <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-3">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={trackingNumber}
                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                placeholder="Track & trace code..."
                                                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[11px] text-white focus:outline-none focus:border-[#0df2a2]/50 font-mono"
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdateTracking}
                                            className="w-full bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-black py-2 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Save className="w-3 h-3" />
                                            Code Opslaan
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                        <Calendar className="w-3 h-3" /> Leverdatum
                                    </h4>
                                    <div className="bg-white/2 border border-white/5 p-4 rounded-xl space-y-3">
                                        <input
                                            type="date"
                                            value={deliveryDate}
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                            onChange={(e) => {
                                                setDeliveryDate(e.target.value)
                                                handleUpdateDeliveryDate(e.target.value)
                                            }}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[11px] text-white focus:outline-none focus:border-[#0df2a2]/50 font-mono color-scheme-dark"
                                        />
                                        <p className="text-[9px] text-zinc-500 italic">Kies de dag waarop het pakket wordt geleverd.</p>
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
                                                onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                                className={`text-[10px] font-black uppercase tracking-widest p-3 rounded-lg border transition-all text-left flex items-center justify-between ${selectedOrder.status === s
                                                    ? 'bg-[#0df2a2]/10 border-[#0df2a2] text-[#0df2a2]'
                                                    : 'bg-white/2 border-white/5 text-zinc-500 hover:border-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {STATUS_CONFIG[s].label}
                                                {selectedOrder.status === s && <CheckCircle2 className="w-3 h-3" />}
                                            </button>
                                        ))}

                                        {/* Custom Status Input */}
                                        <div className="pt-2 border-t border-white/5 mt-2 space-y-2">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={customStatus}
                                                    onChange={(e) => setCustomStatus(e.target.value)}
                                                    placeholder="Eigen status..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-[11px] text-zinc-300 focus:outline-none focus:border-[#0df2a2]/50"
                                                />
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedOrder.id, customStatus)}
                                                    disabled={!customStatus}
                                                    className="px-3 bg-zinc-800 hover:bg-[#0df2a2]/20 text-[#0df2a2] rounded-lg border border-white/5 transition-all"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {!STATUS_CONFIG[selectedOrder.status] && (
                                                <div className="px-3 py-1 bg-[#0df2a2]/5 border border-[#0df2a2]/20 rounded text-[9px] text-[#0df2a2] font-bold uppercase tracking-widest">
                                                    Huidig: {selectedOrder.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Items & Files */}
                            <div className="md:col-span-2 space-y-8">
                                {/* Ordered Products First */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0df2a2] mb-4">
                                        <ShoppingCart className="size-3" />
                                        Bestelde Producten
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedOrder.shop_order_items.map(item => (
                                            <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                                                            <img
                                                                src={(item.shop_products as any)?.images?.[0] || ''}
                                                                alt="Product"
                                                                className="size-full object-contain filter"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-white">{item.shop_products?.name || 'Onbekend Product'}</div>
                                                            <div className="text-[10px] text-[#0df2a2] font-mono mt-0.5 uppercase tracking-widest">Aantal: {item.quantity} st.</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-black text-white">€{(item.price_at_purchase * item.quantity).toFixed(2)}</div>
                                                </div>

                                                {item.options && (
                                                    <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/5">
                                                        {Object.entries(item.options).map(([key, value]: [string, any]) => (
                                                            <div key={key} className="flex flex-col">
                                                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">{key}</span>
                                                                <span className="text-[10px] text-zinc-400 font-bold truncate">{String(value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Design View */}
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0df2a2] mb-4">
                                        <FileCheck className="size-3" />
                                        Design & Bestanden
                                    </h4>
                                    <div className="space-y-4">
                                        {/* Status Badge */}
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit ${selectedOrder.design_status === 'approved' ? 'bg-[#0df2a2]/10 text-[#0df2a2]' :
                                            selectedOrder.design_status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                selectedOrder.design_status === 'waiting' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {selectedOrder.design_status === 'approved' ? 'Goedgekeurd' :
                                                selectedOrder.design_status === 'rejected' ? 'Afgekeurd' :
                                                    selectedOrder.design_status === 'waiting' ? 'Wacht op bestanden' :
                                                        'In afwachting'
                                            }
                                        </div>

                                        {/* Current File View */}
                                        {selectedOrder.design_url ? (
                                            <div className="flex items-center gap-3">
                                                <a
                                                    href={selectedOrder.design_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/10 transition-all text-nowrap"
                                                >
                                                    <ExternalLink className="size-4" />
                                                    Bekijk Bestand
                                                </a>
                                                <button
                                                    onClick={() => handleUpdateDesignUrl(null)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-bold text-red-500 hover:bg-red-500/20 transition-all text-nowrap"
                                                    title="Bestand verwijderen"
                                                >
                                                    <X className="size-4" />
                                                    Wissen
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-white/[0.02] border border-white/5 border-dashed rounded-xl text-center">
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Geen bestand beschikbaar</p>
                                            </div>
                                        )}

                                        {/* Remarks */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Opmerkingen / Feedback</label>
                                            <textarea
                                                value={designRemarks}
                                                onChange={(e) => setDesignRemarks(e.target.value)}
                                                placeholder="Voer hier feedback in voor de makelaar..."
                                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#0df2a2] transition-colors resize-none h-20"
                                            />
                                        </div>

                                        {/* Primary Status Controls */}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => handleUpdateDesignStatus('approved')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedOrder.design_status === 'approved' ? 'bg-[#0df2a2] text-black' : 'bg-[#0df2a2]/10 text-[#0df2a2] hover:bg-[#0df2a2]/20'}`}
                                            >
                                                <FileCheck className="size-3" /> Goedkeuren
                                            </button>
                                            <button
                                                onClick={() => handleUpdateDesignStatus('waiting')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedOrder.design_status === 'waiting' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'}`}
                                            >
                                                <Upload className="size-3" /> Wacht op bestanden
                                            </button>
                                            <button
                                                onClick={() => handleUpdateDesignStatus('rejected')}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedOrder.design_status === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                                            >
                                                <FileX className="size-3" /> Afkeuren
                                            </button>
                                        </div>

                                        {/* Upload Controls */}
                                        <div className="pt-2 border-t border-white/5 space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block">Bestand beheren (Admin)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <label className="cursor-pointer">
                                                    <div className={`flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                                        <Upload className="size-3" />
                                                        {isUploading ? '...' : 'Uploaden'}
                                                    </div>
                                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                                </label>
                                                <label className="cursor-pointer">
                                                    <div className={`flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0df2a2]/10 border border-[#0df2a2]/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#0df2a2] hover:bg-[#0df2a2]/20 transition-all ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                                                        <FileCheck className="size-3" />
                                                        {isUploading ? '...' : 'Upload & OK'}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={async (e) => {
                                                            await handleFileUpload(e)
                                                            await handleUpdateDesignStatus('approved')
                                                        }}
                                                        disabled={isUploading}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center px-4">
                                <div>
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Betaalstatus</div>
                                    <div className={`text-xs font-black uppercase mt-0.5 ${(selectedOrder.status !== 'pending' && selectedOrder.status !== 'unpaid' && selectedOrder.status !== 'awaiting_payment') ? 'text-[#0df2a2]' : 'text-orange-400'}`}>
                                        {(selectedOrder.status !== 'pending' && selectedOrder.status !== 'unpaid' && selectedOrder.status !== 'awaiting_payment') ? 'Betaald' : 'Openstaand'}
                                    </div>
                                </div>
                            </div>

                            {/* Annuleren & Terugbetalen Section */}
                            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 px-4 bg-white/[0.02] rounded-2xl pb-4">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCancelOrder}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                    >
                                        <AlertCircle className="size-3" />
                                        Bestelling Annuleren
                                    </button>
                                    <button
                                        onClick={() => { }}
                                        disabled
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed opacity-50"
                                        title="Deze functionaliteit is nog niet beschikbaar"
                                    >
                                        Terugbetalen via Mollie
                                    </button>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Totaalbedrag</div>
                                    <div className="text-3xl font-black text-[#0df2a2]">€{Number(selectedOrder.total_amount).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
