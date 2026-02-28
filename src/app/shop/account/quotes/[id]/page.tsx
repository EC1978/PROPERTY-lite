'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useCart } from '@/context/CartContext'

export default function QuoteDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { addItem, clearCart } = useCart()
    const [quote, setQuote] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectionSent, setRejectionSent] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)

    const fetchQuote = async () => {
        setIsLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase
            .from('shop_quotes')
            .select(`
                *,
                shop_quote_items (
                    *,
                    shop_products (*)
                )
            `)
            .eq('id', id)
            .single()

        if (data) {
            setQuote(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchQuote()
    }, [id])

    const handleAccept = async () => {
        if (!quote) return
        setIsProcessing(true)

        const supabase = createClient()

        // 1. Mark quote as approved
        const { error: updateError } = await supabase
            .from('shop_quotes')
            .update({ status: 'approved' })
            .eq('id', quote.id)

        if (updateError) {
            console.error('Error approving quote:', updateError)
            alert('Er is een fout opgetreden bij het goedkeuren.')
            setIsProcessing(false)
            return
        }

        // 2. Clear cart and add quote items
        clearCart()
        quote.shop_quote_items.forEach((item: any) => {
            addItem({
                productId: item.shop_products.slug,
                dbId: item.shop_products.id,
                name: item.shop_products.name,
                basePrice: Number(item.unit_price), // Use quoted price
                options: item.selected_options || [],
                quantity: item.quantity,
                image: item.shop_products.images?.[0] || ''
            })
        })

        // 3. Redirect to checkout (upload design step)
        router.push('/shop/checkout/upload')
    }

    const handleReject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!quote) return
        setIsProcessing(true)

        const target = e.target as HTMLFormElement
        const reason = (target.elements.namedItem('reason') as HTMLSelectElement).value
        const comment = (target.elements.namedItem('comment') as HTMLTextAreaElement).value
        const fullReason = `${reason}: ${comment}`

        const supabase = createClient()
        const { error } = await supabase
            .from('shop_quotes')
            .update({
                status: 'rejected',
                rejection_reason: fullReason
            })
            .eq('id', quote.id)

        if (error) {
            console.error("Error rejecting quote:", error)
            alert("Er is een fout opgetreden bij het afwijzen.")
            setIsProcessing(false)
            return
        }

        setRejectionSent(true)
        setTimeout(() => {
            setShowRejectModal(false)
            setRejectionSent(false)
            setIsProcessing(false)
            fetchQuote()
        }, 2000)
    }

    if (isLoading) {
        return (
            <div className="p-20 text-center">
                <div className="size-12 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">Offerte laden...</p>
            </div>
        )
    }

    if (!quote) {
        return (
            <div className="p-20 text-center">
                <h3 className="text-xl font-bold mb-2 text-white">Offerte niet gevonden</h3>
                <Link href="/shop/account/quotes" className="text-[#0df2a2] font-bold">Terug naar overzicht</Link>
            </div>
        )
    }

    const tax = Number(quote.total_amount) * 0.21
    const subtotal = Number(quote.total_amount) - tax

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <Link href="/dashboard" className="hover:text-[#0df2a2]">Account</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <Link href="/shop/account/quotes" className="hover:text-[#0df2a2]">Offertes</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-white">{quote.quote_number}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Area (Product details) */}
                <div className="lg:col-span-8 space-y-6">
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white tracking-tight leading-tight mb-6">Artikelen in deze offerte</h2>
                            <div className="space-y-6">
                                {quote.shop_quote_items?.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-6">
                                        <div className="size-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 overflow-hidden shrink-0">
                                            <img
                                                src={item.shop_products?.images?.[0] || ''}
                                                alt={item.shop_products?.name}
                                                className="size-full object-contain"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-1 truncate">
                                                {item.shop_products?.name || 'Product'}
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                <p className="text-gray-500 text-xs font-medium">
                                                    {item.selected_options?.[0]?.value || 'Standaard configuratie'}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.quantity} st.</span>
                                                    <span className="text-[10px] font-black text-[#0df2a2] uppercase tracking-widest">€ {Number(item.unit_price).toFixed(2)} /st.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-white/[0.01]">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Toelichting</p>
                            <p className="text-sm font-medium text-gray-400">Deze offerte is speciaal voor u samengesteld en is geldig tot {format(new Date(quote.expires_at), 'd MMMM yyyy', { locale: nl })}.</p>
                        </div>
                    </section>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-6">
                        <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-gray-500 text-[20px]">info</span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Informatie</p>
                            </div>
                            <p className="text-sm font-medium text-white">Geldig tot: <span className="text-[#0df2a2]">{format(new Date(quote.expires_at), 'd MMM yyyy', { locale: nl })}</span></p>
                            <p className="text-sm font-medium text-gray-500 mt-1">Status: {quote.status === 'pending' ? 'Openstaand' : quote.status}</p>
                        </section>

                        <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-gray-500 text-[20px]">support_agent</span>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Contact</p>
                            </div>
                            <p className="text-sm font-medium text-white">Vragen? Bel ons direct op</p>
                            <p className="text-sm font-black text-[#0df2a2] mt-1">+31 (0)85 - 000 00 00</p>
                        </section>
                    </div>
                </div>

                {/* Right Sidebar (Summary & Actions) */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8 space-y-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">Offertenummer</p>
                            <h2 className="text-xl font-black text-white tracking-tight">{quote.quote_number}</h2>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between text-gray-400 font-medium text-xs mb-2">
                                <span>Subtotaal</span>
                                <span className="text-white font-bold">€ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-400 font-medium text-xs mb-2">
                                <span>Btw (21%)</span>
                                <span className="text-white">€ {tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-baseline pt-4 border-t border-white/10">
                                <span className="text-white font-black uppercase tracking-widest text-xs">Totaalbedrag</span>
                                <span className="text-3xl font-black text-[#0df2a2]">€ {quote.total_amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4">
                            {quote.status === 'pending' ? (
                                <>
                                    <button
                                        onClick={handleAccept}
                                        disabled={isProcessing}
                                        className="w-full bg-[#0df2a2] text-[#0A0A0A] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                        Offerte Accepteren
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={isProcessing}
                                        className="w-full bg-white/5 text-gray-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                                        Afwijzen
                                    </button>
                                </>
                            ) : quote.status === 'approved' ? (
                                <>
                                    <div className="w-full bg-[#0df2a2]/10 border border-[#0df2a2]/20 py-5 rounded-2xl flex items-center justify-center gap-3">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-[20px]">verified</span>
                                        <span className="text-[10px] font-black text-[#0df2a2] uppercase tracking-widest">Offerte Goedgekeurd</span>
                                    </div>
                                    <button
                                        onClick={handleAccept}
                                        disabled={isProcessing}
                                        className="w-full bg-[#0df2a2] text-[#0A0A0A] py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
                                        Doorgaan naar afrekenen
                                    </button>
                                </>
                            ) : (
                                <div className="w-full bg-red-500/10 border border-red-500/20 py-5 rounded-2xl flex items-center justify-center gap-3">
                                    <span className="material-symbols-outlined text-red-500 text-[20px]">block</span>
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Offerte Afgewezen</span>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
                    <div className="bg-[#1A1D1C] border border-white/10 rounded-[40px] w-full max-w-lg p-10 shadow-3xl relative overflow-hidden">
                        <button
                            onClick={() => setShowRejectModal(false)}
                            className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-white tracking-tight underline decoration-red-500/30 decoration-4 underline-offset-8">Offerte afwijzen</h3>
                            <p className="text-gray-500 text-sm mt-4 font-medium">We horen graag waarom deze offerte niet aansluit bij uw wensen.</p>
                        </div>

                        {rejectionSent ? (
                            <div className="text-center py-10 animate-in zoom-in duration-500">
                                <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-red-500 text-4xl">check_circle</span>
                                </div>
                                <h4 className="text-xl font-black text-white mb-2">Feedback ontvangen</h4>
                                <p className="text-gray-500 text-sm">Bedankt voor uw terugkoppeling. We nemen dit mee.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleReject} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Reden van afwijzing</label>
                                    <select
                                        name="reason"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="Te duur" className="bg-[#1A1D1C]">Te duur</option>
                                        <option value="Ik ben al voorzien" className="bg-[#1A1D1C]">Ik ben al voorzien</option>
                                        <option value="Specificaties kloppen niet" className="bg-[#1A1D1C]">Specificaties kloppen niet</option>
                                        <option value="Andere reden" className="bg-[#1A1D1C]">Andere reden</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Toelichting (optioneel)</label>
                                    <textarea
                                        name="comment"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 min-h-[100px] transition-all resize-none"
                                        placeholder="Kunt u ons meer vertellen?"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full bg-red-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                >
                                    {isProcessing ? 'VERWERKEN...' : 'BEVESTIG AFWIJZING'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
