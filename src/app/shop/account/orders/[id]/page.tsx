'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useCart } from '@/context/CartContext'

export default function OrderDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { addItem } = useCart()
    const [order, setOrder] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [complaints, setComplaints] = useState<any[]>([])
    const [showComplaintModal, setShowComplaintModal] = useState(false)
    const [complaintSent, setComplaintSent] = useState(false)
    const [selectedComplaintItems, setSelectedComplaintItems] = useState<string[]>([])

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [isPaying, setIsPaying] = useState(false)
    const [paymentSuccess, setPaymentSuccess] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState('ideal')

    const fetchOrder = async () => {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('shop_orders')
            .select(`
                *,
                shop_order_items (
                    *,
                    shop_products (*)
                )
            `)
            .eq('id', id)
            .single()

        if (data) {
            setOrder(data)
            // Default select all items for complaint
            if (data.shop_order_items) {
                setSelectedComplaintItems(data.shop_order_items.map((it: any) => it.id))
            }

            // Fetch complaints
            const { data: complaintsData } = await supabase
                .from('shop_complaints')
                .select('*')
                .eq('order_id', id)

            if (complaintsData) {
                setComplaints(complaintsData)
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchOrder()
    }, [id])

    const toggleComplaintItem = (itemId: string) => {
        setSelectedComplaintItems(prev =>
            prev.includes(itemId)
                ? prev.filter(i => i !== itemId)
                : [...prev, itemId]
        )
    }

    const handleReorder = () => {
        if (!order || !order.shop_order_items) return

        order.shop_order_items.forEach((item: any) => {
            addItem({
                productId: item.shop_products.slug,
                dbId: item.shop_products.id,
                name: item.shop_products.name,
                basePrice: Number(item.shop_products.base_price || 0),
                options: Array.isArray(item.selected_options) ? item.selected_options : [],
                quantity: item.quantity,
                image: item.shop_products.images?.[0] || ''
            })
        })

        router.push('/shop/cart')
    }

    const handleSubmitComplaint = async (e: React.FormEvent) => {
        e.preventDefault()
        const target = e.target as HTMLFormElement
        const description = (target.elements.namedItem('description') as HTMLTextAreaElement).value

        if (selectedComplaintItems.length === 0) {
            alert("Selecteer minimaal één artikel voor de klacht.")
            return
        }

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const claimNumber = `REC-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000 + Math.random() * 9000)}`

        const { error } = await supabase
            .from('shop_complaints')
            .insert({
                user_id: user.id,
                order_id: id,
                claim_number: claimNumber,
                description: description,
                selected_items: selectedComplaintItems
            })

        if (error) {
            console.error("Error saving complaint:", error)
            alert("Er is een fout opgetreden bij het verzenden van je klacht.")
            return
        }

        setComplaintSent(true)
        setTimeout(() => {
            setShowComplaintModal(false)
            setComplaintSent(false)
        }, 3000)
    }

    const processPayment = async () => {
        if (!order) return
        setIsPaying(true)

        try {
            const targetStatus = selectedPayment === 'ideal' ? 'paid' : 'pending'
            const { updateOrderStatus } = await import('../actions')

            await updateOrderStatus(order.id, targetStatus)

            // Show success only if we actually "paid"
            if (targetStatus === 'paid') {
                setPaymentSuccess(true)
                setTimeout(() => {
                    setShowPaymentModal(false)
                    setIsPaying(false)
                    setPaymentSuccess(false)
                    fetchOrder()
                }, 2000)
            } else {
                // Just close for pending
                setTimeout(() => {
                    setShowPaymentModal(false)
                    setIsPaying(false)
                    fetchOrder()
                }, 500)
            }
        } catch (error: any) {
            console.error('Payment error object:', error)
            alert(`Er is een fout opgetreden bij de betaling: ${error.message || 'Onbekende fout'}`)
            setIsPaying(false)
        }
    }

    if (isLoading) {
        return (
            <div className="p-20 text-center">
                <div className="size-12 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Bestelgegevens laden...</p>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="p-20 text-center">
                <h3 className="text-xl font-bold mb-2 text-white">Bestelling niet gevonden</h3>
                <Link href="/shop/account/orders" className="text-[#0df2a2] font-bold">Terug naar overzicht</Link>
            </div>
        )
    }

    const tax = Number(order.total_amount) * 0.21
    const subtotal = Number(order.total_amount) - tax

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <Link href="/dashboard" className="hover:text-[#0df2a2]">Account</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <Link href="/shop/account/orders" className="hover:text-[#0df2a2]">Bestellingen</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-white">{order.order_number || order.id.slice(0, 8)}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Area (Product & Addresses) */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Product & Details Section */}
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-6">
                                <div className="size-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 overflow-hidden shrink-0">
                                    <img
                                        src={order.shop_order_items?.[0]?.shop_products?.images?.[0] || ''}
                                        alt="Product"
                                        className="size-full object-contain"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black text-white tracking-tight leading-tight mb-2 truncate">
                                        {order.shop_order_items?.[0]?.shop_products?.name || 'Product'}
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-gray-500 text-sm font-medium">
                                                {order.shop_order_items?.[0]?.selected_options?.[0]?.value || 'Standaard configuratie'}
                                            </p>
                                            <div className="flex items-center gap-4 pt-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aantal:</span>
                                                    <span className="text-xs font-black text-white">{order.shop_order_items?.[0]?.quantity || 0} st.</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Prijs:</span>
                                                    <span className="text-xs font-black text-white">€ {Number(order.total_amount).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Ontwerp Details</p>
                                {order.design_url ? (
                                    <Link href={order.design_url} target="_blank" className="inline-flex items-center gap-2 bg-[#0df2a2]/10 text-[#0df2a2] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0df2a2]/20 transition-all">
                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        Bekijk ontwerp
                                    </Link>
                                ) : (
                                    <p className="text-xs font-medium text-gray-500 italic uppercase tracking-widest">Geen ontwerp geüpload</p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Verzending & Tracking</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">local_shipping</span>
                                        <span className="text-[11px] font-bold text-[#0df2a2] underline tracking-tight cursor-pointer">JVGLO5821863000839588983</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium">Verwachte levering: {format(addDays(new Date(order.created_at), 5), 'd MMM yyyy', { locale: nl })}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Complaint Alert Section */}
                    {complaints.length > 0 && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-[40px] p-8 md:p-10 mb-8 animate-in fade-in slide-in-from-top-4 duration-500 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 border border-red-500/20">
                                    <span className="material-symbols-outlined text-[32px]">report_problem</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Actieve Reclamatie</h3>
                                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mt-0.5">Uw klacht is succesvol ontvangen en wordt verwerkt</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {complaints.map((c, idx) => (
                                    <div key={idx} className="bg-[#1A1D1C]/60 border border-white/5 rounded-3xl p-6 hover:border-red-500/20 transition-all">
                                        <div className="flex flex-col md:flex-row gap-8">
                                            <div className="flex-1 space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#0df2a2]">Uw bericht</span>
                                                        <div className="h-px flex-1 bg-white/5"></div>
                                                    </div>
                                                    <p className="text-gray-400 text-sm leading-relaxed italic pr-4 pr-10">"{c.description}"</p>
                                                </div>
                                                <div className="flex items-center gap-4 pt-2">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                        <span>{format(new Date(c.created_at), 'd MMMM yyyy (HH:mm)', { locale: nl })}</span>
                                                    </div>
                                                    <div className="size-1 rounded-full bg-gray-800"></div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                        <span className="material-symbols-outlined text-sm">tag</span>
                                                        <span>{c.claim_number}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:w-px md:h-16 bg-white/5 hidden md:block self-center" />

                                            <div className="md:w-64 space-y-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block pl-1">Status</span>
                                                <div className="relative">
                                                    <div className="px-5 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-500 text-xs font-black uppercase tracking-[0.1em] flex items-center gap-3">
                                                        <span className="size-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                                        {c.status || 'In Behandeling'}
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-gray-500 font-medium italic pl-1 leading-relaxed">
                                                    Onze superadmin heeft uw klacht ontvangen en neemt contact op.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Addresses side-by-side */}
                    <div className="grid grid-cols-2 gap-6">
                        <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-gray-500 text-[20px]">receipt</span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Factuuradres</p>
                            </div>
                            <div className="text-sm font-medium text-white space-y-1">
                                <p className="text-lg font-black mb-2">{order.billing_address?.name || '-'}</p>
                                <p className="text-gray-400">{order.billing_address?.contact || '-'}</p>
                                <p className="text-gray-400">{order.billing_address?.street || '-'}</p>
                                <p className="text-gray-400">{order.billing_address?.zipcode || ''} {order.billing_address?.city || '-'}</p>
                            </div>
                        </section>

                        <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-gray-500 text-[20px]">local_shipping</span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Bezorgadres</p>
                            </div>
                            <div className="text-sm font-medium text-white space-y-1">
                                <p className="text-lg font-black mb-2">{order.shipping_address?.name || '-'}</p>
                                <p className="text-gray-400">{order.shipping_address?.contact || '-'}</p>
                                <p className="text-gray-400">{order.shipping_address?.street || '-'}</p>
                                <p className="text-gray-400">{order.shipping_address?.zipcode || ''} {order.shipping_address?.city || '-'}</p>
                            </div>
                        </section>
                    </div>

                    {/* Options / Action area */}
                    <section className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] p-6 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Snelle acties</p>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-all">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                Factuur
                            </button>
                            <button
                                onClick={handleReorder}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">replay</span>
                                Herhaal order
                            </button>
                            <button
                                onClick={() => setShowComplaintModal(true)}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-all text-red-400/80"
                            >
                                <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                                Klacht
                            </button>
                        </div>
                    </section>
                </div>

                {/* Right Sidebar (Summary & Meta) - STICKY */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                    {/* Order Meta Card */}
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Factuurnummer</p>
                                <h2 className="text-xl font-black text-white tracking-tight">{order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`}</h2>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'paid' ? 'bg-[#0df2a2]/10 text-[#0df2a2]' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {order.status === 'paid' ? 'Betaald' : 'Openstaand'}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex gap-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Status</p>
                                <p className="text-xs font-bold text-white capitalize">{order.status === 'paid' ? 'Afgerond' : order.status}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Besteldatum</p>
                                <p className="text-xs font-bold text-white">{format(new Date(order.created_at), 'd MMM yyyy', { locale: nl })}</p>
                            </div>
                        </div>
                    </section>

                    {/* Summary & Payment Card */}
                    <section className="bg-[#0df2a2]/5 border border-[#0df2a2]/20 rounded-[32px] overflow-hidden shadow-2xl">
                        <div className="p-8 space-y-4">
                            <div className="flex justify-between text-gray-400 font-medium text-xs">
                                <span>Producten</span>
                                <span className="text-white font-bold">€ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 font-medium text-xs">
                                <span>Handling & Verzending</span>
                                <span className="text-[#0df2a2] font-bold">Gratis</span>
                            </div>
                            <div className="flex justify-between text-gray-400 font-medium text-xs">
                                <span>Btw (21%)</span>
                                <span className="text-white">€ {tax.toFixed(2)}</span>
                            </div>

                            <div className="pt-6 mt-4 border-t border-white/10 flex justify-between items-baseline">
                                <span className="text-white font-black uppercase tracking-widest text-xs">Totaalbedrag</span>
                                <span className="text-3xl font-black text-[#0df2a2]">€ {Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="p-6 pt-0">
                            {(order.status === 'pending' || order.status === 'unpaid') ? (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="w-full bg-[#0df2a2] text-[#0A0A0A] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-[20px]">payments</span>
                                    Nu Betalen
                                </button>
                            ) : (
                                <div className="w-full bg-white/5 border border-white/5 py-5 rounded-2xl flex items-center justify-center gap-3 opacity-80">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-[20px]">check_circle</span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Bestelling Betaald</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Complaint Modal */}
            {showComplaintModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                    <div className="bg-[#1A1D1C] border border-white/10 rounded-[40px] w-full max-w-lg p-10 shadow-3xl relative overflow-hidden">
                        <button
                            onClick={() => setShowComplaintModal(false)}
                            className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tight underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Klacht melden</h3>
                            <p className="text-gray-500 text-sm mt-4 font-medium">Betreft order: <span className="text-white font-bold">{order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`}</span></p>
                        </div>

                        {complaintSent ? (
                            <div className="text-center py-10 animate-in zoom-in duration-500">
                                <div className="size-20 bg-[#0df2a2]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-4xl">check_circle</span>
                                </div>
                                <h4 className="text-xl font-black text-white mb-2">Klacht verzonden</h4>
                                <p className="text-gray-500 text-sm">Onze klantenservice neemt binnen 24 uur contact met u op.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitComplaint} className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Selecteer artikel(en)</label>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto px-1 custom-scrollbar">
                                        {order.shop_order_items?.map((item: any) => (
                                            <div
                                                key={item.id}
                                                onClick={() => toggleComplaintItem(item.id)}
                                                className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${selectedComplaintItems.includes(item.id) ? 'bg-[#0df2a2]/5 border-[#0df2a2]/40' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className={`size-5 rounded flex items-center justify-center border transition-all ${selectedComplaintItems.includes(item.id) ? 'bg-[#0df2a2] border-[#0df2a2]' : 'border-gray-600'}`}>
                                                    {selectedComplaintItems.includes(item.id) && <span className="material-symbols-outlined text-[14px] text-[#0A0A0A] font-bold">check</span>}
                                                </div>
                                                <img src={item.shop_products?.images?.[0] || ''} className="size-10 object-contain bg-white/5 rounded-lg" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-white truncate">{item.shop_products?.name}</p>
                                                    <p className="text-[10px] text-gray-500">{item.quantity} st.</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Omschrijving van het probleem</label>
                                    <textarea
                                        name="description"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0df2a2]/20 focus:border-[#0df2a2]/30 min-h-[100px] transition-all resize-none"
                                        placeholder="Beschrijf hier wat er aan de hand is..."
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#0df2a2] text-[#0A0A0A] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95"
                                >
                                    Verzend klacht
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                    <div className="bg-[#1A1D1C] border border-white/10 rounded-[40px] w-full max-w-lg p-10 shadow-3xl relative overflow-hidden">
                        <button
                            onClick={() => setShowPaymentModal(false)}
                            className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tight underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Bestelling betalen</h3>
                            <p className="text-gray-500 text-sm mt-4 font-medium">U staat op het punt om <span className="text-white font-bold">{order.order_number || `ORD-${order.id.slice(0, 8).toUpperCase()}`}</span> te betalen.</p>
                        </div>

                        {paymentSuccess ? (
                            <div className="text-center py-10 animate-in zoom-in duration-500">
                                <div className="size-20 bg-[#0df2a2]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-4xl">check_circle</span>
                                </div>
                                <h4 className="text-xl font-black text-white mb-2">Betaling geslaagd</h4>
                                <p className="text-gray-500 text-sm">Uw bestelling wordt nu verwerkt.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Te betalen bedrag</span>
                                        <span className="text-2xl font-black text-[#0df2a2]">€ {Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 font-medium italic">Inclusief BTW en verzendkosten</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setSelectedPayment('ideal')}
                                        className={`bg-white/[0.03] border p-5 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer ${selectedPayment === 'ideal' ? 'border-[#0df2a2] bg-[#0df2a2]/10' : 'border-white/10 opacity-50 grayscale'}`}
                                    >
                                        <span className={`material-symbols-outlined text-3xl ${selectedPayment === 'ideal' ? 'text-[#0df2a2]' : ''}`}>account_balance</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">iDEAL (Demo)</span>
                                    </div>
                                    <div
                                        onClick={() => setSelectedPayment('bank')}
                                        className={`bg-white/[0.03] border p-5 rounded-2xl flex flex-col items-center gap-2 transition-all cursor-pointer ${selectedPayment === 'bank' ? 'border-[#0df2a2] bg-[#0df2a2]/10' : 'border-white/10 opacity-50 grayscale'}`}
                                    >
                                        <span className={`material-symbols-outlined text-3xl ${selectedPayment === 'bank' ? 'text-[#0df2a2]' : ''}`}>payments</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Bank (Demo)</span>
                                    </div>
                                </div>

                                <button
                                    onClick={processPayment}
                                    disabled={isPaying}
                                    className="w-full bg-[#0df2a2] text-[#0A0A0A] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isPaying ? 'VERWERKEN...' : (selectedPayment === 'ideal' ? 'NU BETALEN (SUCCES)' : 'BETALING OPSLAAN (PENDING)')}
                                    {isPaying && <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}
