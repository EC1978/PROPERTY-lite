'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    ShoppingCart, Search, Eye, Filter,
    Calendar, User, CreditCard, Clock,
    CheckCircle2, AlertCircle, Package,
    ChevronRight, X, Truck, ExternalLink,
    Save, Settings, FileCheck, FileX, Upload, AlertTriangle, Plus, Trash2, Archive, ArchiveRestore
} from 'lucide-react'
import Link from 'next/link'
import { updateOrderStatus, updateOrderTracking, updateOrderDesignStatus, updateOrderDesignUrl, updateOrderDeliveryDate, archiveOrder } from '../products/actions'
import { createClient } from '@/utils/supabase/client'
import toast from 'react-hot-toast'

type Order = {
    id: string
    created_at: string
    total_amount: number
    status: string
    payment_status: string
    tracking_number: string | null
    order_number: string | null
    design_url: string | null
    design_status: string | null
    design_remarks: string | null
    delivery_date: string | null
    is_archived: boolean
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
    const searchParams = useSearchParams()
    const [orders, setOrders] = useState(initialOrders)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('Alle')
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [trackingNumber, setTrackingNumber] = useState('')
    const [customStatus, setCustomStatus] = useState('')
    const [designRemarks, setDesignRemarks] = useState('')
    const [deliveryDate, setDeliveryDate] = useState('')
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        const orderId = searchParams.get('orderId')
        if (orderId && orders.length > 0) {
            const order = orders.find(o => o.id === orderId)
            if (order) {
                openOrderDetails(order)
            }
        }
    }, [searchParams, orders])

    const filteredOrders = orders.filter(o => {
        const matchesSearch = o.users.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (o.users.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            o.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'Alle' || o.status === statusFilter
        const matchesTab = activeTab === 'archived' ? o.is_archived : !o.is_archived
        return matchesSearch && matchesStatus && matchesTab
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
            if (e.target) e.target.value = ''
        }
    }

    const handleDeleteDesign = async () => {
        if (!selectedOrder) return
        if (!confirm('Weet je zeker dat je dit ontwerp wilt verwijderen?')) return
        const loadingToast = toast.loading('Ontwerp verwijderen...')
        try {
            const result = await updateOrderDesignUrl(selectedOrder.id, null)
            if (result.success) {
                setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, design_url: null } : o))
                setSelectedOrder({ ...selectedOrder, design_url: null })
                toast.success('Ontwerp verwijderd', { id: loadingToast })
            } else {
                toast.error(result.error || 'Fout bij verwijderen', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Er is een fout opgetreden', { id: loadingToast })
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

    const handleArchiveOrder = async (orderId: string, archive: boolean) => {
        const loadingToast = toast.loading(archive ? 'Bestelling archiveren...' : 'Bestelling herstellen...')
        try {
            const result = await archiveOrder(orderId, archive)
            if (result.success) {
                setOrders(orders.map(o => o.id === orderId ? { ...o, is_archived: archive } : o))
                if (selectedOrder?.id === orderId) {
                    setSelectedOrder({ ...selectedOrder, is_archived: archive })
                }
                toast.success(archive ? 'Bestelling gearchiveerd' : 'Bestelling hersteld', { id: loadingToast })
            } else {
                toast.error(result.error || 'Fout bij actie', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Er is een fout opgetreden', { id: loadingToast })
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
                <div className="flex items-center gap-3">
                    <div className="bg-[#1A1A1A] p-1 rounded-xl border border-white/5 flex">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-[#0df2a2] text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Actief ({orders.filter(o => !o.is_archived).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('archived')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'archived' ? 'bg-[#0df2a2] text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                            Archief ({orders.filter(o => o.is_archived).length})
                        </button>
                    </div>
                    <Link href="/admin/orders/new" className="bg-[#0df2a2] hover:bg-white text-black font-black px-6 py-3 rounded-xl uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(13,242,162,0.15)] flex items-center gap-2 italic w-fit">
                        <Plus className="w-4 h-4" /> Nieuwe Bestelling
                    </Link>
                </div>
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

            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                {/* Mobile: Card layout */}
                <div className="block md:hidden divide-y divide-white/5">
                    {filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                            Geen bestellingen gevonden
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const status = STATUS_CONFIG[order.status] || STATUS_CONFIG['pending']
                            return (
                                <div key={order.id} className="p-5 space-y-4 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white text-sm truncate max-w-[150px]">
                                                {order.users?.full_name || order.users?.email}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-tighter">
                                                {new Date(order.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="font-black text-white text-sm">€{order.total_amount.toFixed(2)}</div>
                                    </div>

                                    <div className="flex justify-between items-center gap-2">
                                        <div className={`px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit ${status.color}`}>
                                            <status.icon className="w-3 h-3" />
                                            {status.label}
                                        </div>
                                        {order.tracking_number ? (
                                            <div className="text-[10px] text-[#0df2a2] font-mono font-bold truncate max-w-[100px]">
                                                {order.tracking_number}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-zinc-600 italic">Geen track code</span>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center bg-[#111] p-2.5 rounded-xl border border-white/5">
                                        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                            Status: <span className="text-zinc-300 ml-1">{order.payment_status}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!order.is_archived && order.status === 'completed' && (
                                                <button onClick={() => handleArchiveOrder(order.id, true)} className="p-2 rounded-lg bg-zinc-800 hover:bg-[#0df2a2]/20 text-zinc-400 hover:text-[#0df2a2]" title="Archiveren">
                                                    <Archive className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {order.is_archived && (
                                                <button onClick={() => handleArchiveOrder(order.id, false)} className="p-2 rounded-lg bg-zinc-800 hover:bg-[#0df2a2]/20 text-zinc-400 hover:text-[#0df2a2]" title="Herstellen">
                                                    <ArchiveRestore className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button onClick={() => openOrderDetails(order)} className="p-2 px-3 rounded-lg bg-zinc-800 hover:bg-white/10 text-white flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest">
                                                KIJKEN <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Desktop: Table layout */}
                <div className="hidden md:block overflow-x-auto">
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
                                            <div className="flex justify-end items-center gap-2">
                                                {!order.is_archived && order.status === 'completed' && (
                                                    <button
                                                        onClick={() => handleArchiveOrder(order.id, true)}
                                                        className="p-2 rounded-lg bg-zinc-800 hover:bg-[#0df2a2]/20 text-zinc-400 hover:text-[#0df2a2] transition-all"
                                                        title="Archiveren"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {order.is_archived && (
                                                    <button
                                                        onClick={() => handleArchiveOrder(order.id, false)}
                                                        className="p-2 rounded-lg bg-zinc-800 hover:bg-[#0df2a2]/20 text-zinc-400 hover:text-[#0df2a2] transition-all"
                                                        title="Herstellen"
                                                    >
                                                        <ArchiveRestore className="w-4 h-4" />
                                                    </button>
                                                )}
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
                    <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-4 lg:p-6 border-b border-white/5 flex items-start gap-3 bg-[#111] z-10">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base lg:text-xl font-black text-white uppercase tracking-tight flex flex-wrap items-center gap-2">
                                    Bestelling <span className="text-[#0df2a2]">{selectedOrder.order_number || `FACT-${selectedOrder.id.slice(0, 8)}`}</span>
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Gedetailleerd overzicht van makelaar bestelling</p>
                                {/* Status badge — shown on mobile below the title */}
                                <div className="mt-2 lg:hidden">
                                    {(() => {
                                        const StatusIcon = STATUS_CONFIG[selectedOrder.status]?.icon
                                        return (
                                            <div className={`px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${STATUS_CONFIG[selectedOrder.status]?.color || 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                                {StatusIcon && <StatusIcon className="w-3 h-3" />}
                                                {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                                            </div>
                                        )
                                    })()}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {/* Status badge — hidden on mobile, shown on desktop */}
                                <div className="hidden lg:flex">
                                    {(() => {
                                        const StatusIcon = STATUS_CONFIG[selectedOrder.status]?.icon
                                        return (
                                            <div className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${STATUS_CONFIG[selectedOrder.status]?.color || 'bg-zinc-800 text-zinc-500 border-white/5'}`}>
                                                {StatusIcon && <StatusIcon className="w-3.5 h-3.5" />}
                                                {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                                            </div>
                                        )
                                    })()}
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                            {selectedOrder.shop_complaints && selectedOrder.shop_complaints.length > 0 && (
                                <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-red-500/20 rounded-xl flex items-center justify-center text-red-500 shrink-0">
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-black text-xs">Bestelling heeft een actieve klacht</h4>
                                            <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Reclamatie ingediend door makelaar</p>
                                        </div>
                                    </div>
                                    <Link href="/admin/complaints" className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20">
                                        Klacht Bekijken
                                    </Link>
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* COLUMN 1: CUSTOMER & ITEMS */}
                                <div className="space-y-4">
                                    {/* Customer Info */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                            <User className="w-3 h-3 text-[#0df2a2]" /> Makelaar
                                        </h4>
                                        <div className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0df2a2]/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                                            <div className="relative z-10">
                                                <div className="text-sm font-black text-white mb-0.5">{selectedOrder.users?.full_name || 'Onbekende Makelaar'}</div>
                                                <div className="text-[10px] text-zinc-500 font-mono tracking-tight">{selectedOrder.users?.email}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-2">
                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                            <ShoppingCart className="size-3 text-[#0df2a2]" /> Bestelde Producten
                                        </h4>
                                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedOrder.shop_order_items.map(item => (
                                                <div key={item.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 group hover:border-white/10 transition-colors">
                                                    <div className="flex gap-3">
                                                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0">
                                                            <img
                                                                src={(item.shop_products as any)?.images?.[0] || ''}
                                                                alt="Product"
                                                                className="size-full object-contain"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[10px] font-black text-white truncate leading-tight">{item.shop_products?.name || 'Product'}</div>
                                                            <div className="flex justify-between items-end mt-1">
                                                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Qty: {item.quantity}</span>
                                                                <span className="text-[10px] font-black text-[#0df2a2]">€{(item.price_at_purchase * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {item.options && Object.keys(item.options).length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1">
                                                            {Object.entries(item.options).map(([key, value]: [string, any]) => (
                                                                <div key={key} className="flex flex-col">
                                                                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{key}</span>
                                                                    <span className="text-[8px] text-zinc-400 font-bold">{String(value)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 2: LOGISTICS & STATUS */}
                                <div className="space-y-4">
                                    {/* Logistics Form */}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                <Truck className="w-3 h-3 text-[#0df2a2]" /> Logistiek
                                            </h4>
                                            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Track & Trace</label>
                                                    <div className="relative group">
                                                        <input
                                                            type="text"
                                                            value={trackingNumber}
                                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                                            placeholder="Voer code in..."
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-[11px] text-white focus:outline-none focus:border-[#0df2a2]/50 font-mono transition-all"
                                                        />
                                                        <button
                                                            onClick={handleUpdateTracking}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#0df2a2]/10 hover:bg-[#0df2a2] text-[#0df2a2] hover:text-black rounded-lg transition-all"
                                                        >
                                                            <Save className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Leverdatum</label>
                                                    <input
                                                        type="date"
                                                        value={deliveryDate}
                                                        onClick={(e) => (e.target as any).showPicker?.()}
                                                        onChange={(e) => {
                                                            setDeliveryDate(e.target.value)
                                                            handleUpdateDeliveryDate(e.target.value)
                                                        }}
                                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-3 text-[11px] text-white focus:outline-none focus:border-[#0df2a2]/50 font-mono color-scheme-dark transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Toggles */}
                                    <div>
                                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 mb-3">
                                            <Clock className="w-3 h-3 text-[#0df2a2]" /> Status Beheren
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {Object.keys(STATUS_CONFIG).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => handleUpdateStatus(selectedOrder.id, s)}
                                                    className={`text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border transition-all text-left flex items-center justify-between ${selectedOrder.status === s
                                                        ? 'bg-[#0df2a2]/10 border-[#0df2a2]/40 text-[#0df2a2] shadow-[0_5px_15px_rgba(13,242,162,0.1)]'
                                                        : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {STATUS_CONFIG[s].label}
                                                    {selectedOrder.status === s && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                </button>
                                            ))}
                                            
                                            <div className="mt-2 pt-3 border-t border-white/5 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={customStatus}
                                                    onChange={(e) => setCustomStatus(e.target.value)}
                                                    placeholder="Maatwerk status..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-[11px] text-zinc-300 focus:outline-none focus:border-[#0df2a2]/50"
                                                />
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedOrder.id, customStatus)}
                                                    disabled={!customStatus}
                                                    className="p-2 bg-zinc-800 hover:bg-[#0df2a2]/20 text-[#0df2a2] rounded-xl border border-white/5 transition-all disabled:opacity-30"
                                                >
                                                    <Save className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* COLUMN 3: DESIGN & FEEDBACK */}
                                <div className="space-y-4">
                                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3">
                                        <FileCheck className="size-3 text-[#0df2a2]" /> Design Management
                                    </h4>
                                    
                                    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl space-y-5">
                                        {/* Status & Preview Button */}
                                        <div className="flex items-center justify-between">
                                            <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                selectedOrder.design_status === 'approved' ? 'bg-[#0df2a2]/10 text-[#0df2a2]' :
                                                selectedOrder.design_status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                'bg-orange-500/10 text-orange-500'
                                            }`}>
                                                {selectedOrder.design_status === 'approved' ? 'Design OK' :
                                                 selectedOrder.design_status === 'rejected' ? 'Afgekeurd' : 'Wachten'}
                                            </div>
                                            {selectedOrder.design_url && (
                                                <div className="flex items-center gap-2">
                                                    <a href={selectedOrder.design_url} target="_blank" rel="noopener noreferrer" 
                                                       className="text-[10px] font-black uppercase text-[#0df2a2] hover:underline flex items-center gap-1">
                                                        Bekijken <ExternalLink className="size-3" />
                                                    </a>
                                                    <button 
                                                        onClick={handleDeleteDesign}
                                                        className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                                                        title="Verwijder bestand"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Feedback Field */}
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1">Feedback voor makelaar</label>
                                            <textarea
                                                value={designRemarks}
                                                onChange={(e) => setDesignRemarks(e.target.value)}
                                                placeholder="Bijv. waarom afgekeurd..."
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-[11px] text-white focus:outline-none focus:border-[#0df2a2] transition-all h-28 resize-none shadow-inner"
                                            />
                                        </div>

                                        {/* Controls Grid */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleUpdateDesignStatus('approved')}
                                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedOrder.design_status === 'approved' ? 'bg-[#0df2a2] text-black' : 'bg-[#0df2a2]/10 text-[#0df2a2] border border-[#0df2a2]/20'}`}
                                            >
                                                Goedkeuren
                                            </button>
                                            <button
                                                onClick={() => handleUpdateDesignStatus('rejected')}
                                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedOrder.design_status === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
                                            >
                                                Afkeuren
                                            </button>
                                            <button
                                                onClick={() => handleUpdateDesignStatus('waiting')}
                                                className="col-span-2 py-3 bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all text-center"
                                            >
                                                Wachten op bestanden
                                            </button>
                                        </div>

                                        {/* Upload Logic */}
                                        <div className="pt-3 border-t border-white/5">
                                            <div className="grid grid-cols-2 gap-2">
                                                <label className="cursor-pointer group">
                                                    <div className={`flex flex-col items-center justify-center p-2 h-14 bg-white/5 border border-white/10 rounded-xl group-hover:bg-white/10 transition-all ${isUploading ? 'opacity-50' : ''}`}>
                                                        <Upload className="size-3.5 text-zinc-400 mb-0.5" />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">Upload</span>
                                                    </div>
                                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                                                </label>
                                                <label className="cursor-pointer group">
                                                    <div className={`flex flex-col items-center justify-center p-2 h-14 bg-[#0df2a2]/5 border border-[#0df2a2]/10 rounded-xl group-hover:bg-[#0df2a2]/10 transition-all ${isUploading ? 'opacity-50' : ''}`}>
                                                        <FileCheck className="size-3.5 text-[#0df2a2] mb-0.5" />
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#0df2a2]">Upload & OK</span>
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
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 lg:p-6 border-t border-white/5 bg-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={handleCancelOrder}
                                    className="px-4 lg:px-6 py-2.5 lg:py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg"
                                >
                                    Annuleren
                                </button>
                                {!selectedOrder.is_archived && (selectedOrder.status === 'completed' || selectedOrder.status === 'delivered') && (
                                    <button
                                        onClick={() => handleArchiveOrder(selectedOrder.id, true)}
                                        className="px-4 lg:px-6 py-2.5 lg:py-3 bg-[#0df2a2]/10 hover:bg-[#0df2a2] text-[#0df2a2] hover:text-black border border-[#0df2a2]/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <Archive className="w-3.5 h-3.5" /> Archiveren
                                    </button>
                                )}
                                {selectedOrder.is_archived && (
                                    <button
                                        onClick={() => handleArchiveOrder(selectedOrder.id, false)}
                                        className="px-4 lg:px-6 py-2.5 lg:py-3 bg-[#0df2a2]/10 hover:bg-[#0df2a2] text-[#0df2a2] hover:text-black border border-[#0df2a2]/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
                                    >
                                        <ArchiveRestore className="w-3.5 h-3.5" /> Herstellen
                                    </button>
                                )}
                                <div className="h-8 w-px bg-white/5 hidden md:block" />
                                <div>
                                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Betaalstatus</div>
                                    <div className={`text-xs font-black uppercase mt-0.5 ${(selectedOrder.status !== 'pending' && selectedOrder.status !== 'unpaid' && selectedOrder.status !== 'awaiting_payment') ? 'text-[#0df2a2]' : 'text-orange-400'}`}>
                                        {(selectedOrder.status !== 'pending' && selectedOrder.status !== 'unpaid' && selectedOrder.status !== 'awaiting_payment') ? 'Betaald / Akkoord' : 'Wacht op betaling'}
                                    </div>
                                </div>
                            </div>
                            <div className="text-left md:text-right">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Totaalbedrag Bestelling</span>
                                <div className="text-2xl lg:text-4xl font-black text-white leading-none">
                                    €{Number(selectedOrder.total_amount).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
