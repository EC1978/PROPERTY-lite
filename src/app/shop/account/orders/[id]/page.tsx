'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'
import { linkFileToOrder } from '../../files/actions'

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
    const [isUploading, setIsUploading] = useState(false)

    // Library Modal State
    const [showLibraryModal, setShowLibraryModal] = useState(false)
    const [libraryFiles, setLibraryFiles] = useState<any[]>([])
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false)
    const [isLinkingFromLibrary, setIsLinkingFromLibrary] = useState(false)

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

    const fetchLibraryFiles = async () => {
        setIsLoadingLibrary(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data } = await supabase.storage.from('design_uploads').list(user.id, {
                limit: 100, sortBy: { column: 'created_at', order: 'desc' },
            })
            if (data) {
                const formattedFiles = data.map(f => ({
                    name: f.name,
                    size: f.metadata?.size || 0,
                    type: f.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGE',
                    created_at: f.created_at,
                    thumbnailUrl: ''
                }))

                const imageFiles = formattedFiles.filter(f => f.type === 'IMAGE')
                if (imageFiles.length > 0) {
                    const paths = imageFiles.map(f => `${user.id}/${f.name}`)
                    const { data: signedUrlsData } = await supabase.storage.from('design_uploads').createSignedUrls(paths, 3600)
                    if (signedUrlsData) {
                        signedUrlsData.forEach((item, index) => {
                            if (!item.error) imageFiles[index].thumbnailUrl = item.signedUrl
                        })
                    }
                }
                setLibraryFiles(formattedFiles)
            }
        }
        setIsLoadingLibrary(false)
    }

    const openLibraryModal = () => {
        setShowLibraryModal(true)
        if (libraryFiles.length === 0) fetchLibraryFiles()
    }

    const handleLinkFromLibrary = async (fileName: string) => {
        setIsLinkingFromLibrary(true)
        const toastId = toast.loading('Bezig met koppelen...')
        const result = await linkFileToOrder(order.id, fileName)
        
        if (result.success) {
            toast.success('Bestand is succesvol gekoppeld!', { id: toastId })
            setShowLibraryModal(false)
            fetchOrder() // Ververs order details
        } else {
            toast.error(result.error || 'Fout bij koppelen.', { id: toastId })
        }
        setIsLinkingFromLibrary(false)
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
                image: item.shop_products.images?.[0] || '',
                shippingCost: 0
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

        // Map selected IDs to objects with name and quantity
        const detailedSelectedItems = order.shop_order_items
            .filter((item: any) => selectedComplaintItems.includes(item.id))
            .map((item: any) => ({
                id: item.id,
                name: item.shop_products?.name || 'Onbekend Product',
                quantity: item.quantity
            }))

        const { error } = await supabase
            .from('shop_complaints')
            .insert({
                user_id: user.id,
                order_id: id,
                claim_number: claimNumber,
                description: description,
                selected_items: detailedSelectedItems
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
            fetchOrder()
        }, 3000)
    }

    const processPayment = async () => {
        if (!order) return
        setIsPaying(true)

        try {
            const { getOrderPaymentUrl } = await import('../actions')
            const result = await getOrderPaymentUrl(order.id)

            if (result.success && result.checkoutUrl) {
                // Redirect user to Mollie
                window.location.href = result.checkoutUrl
            } else {
                throw new Error(result.error || 'Kon geen betaallink genereren')
            }
        } catch (error: any) {
            console.error('Payment error:', error)
            toast.error(`Fout bij betalen: ${error.message}`)
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

    const renderTrackingNumber = (tracking: string | null) => {
        if (!tracking) return <span className="text-[11px] font-medium text-gray-500 italic">Nog geen tracking beschikbaar</span>

        const urlRegex = /(https?:\/\/[^\s]+)/g
        const match = tracking.match(urlRegex)

        if (match) {
            return (
                <a
                    href={match[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#0df2a2] underline tracking-tight transition-all hover:text-[#0df2a2]/80"
                >
                    Volg je pakket
                </a>
            )
        }

        return <span className="text-[11px] font-bold text-[#0df2a2] tracking-tight">{tracking}</span>
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'pending': 'In afwachting',
            'awaiting_payment': 'Wacht op betaling',
            'processing': 'In behandeling',
            'production': 'In productie',
            'shipped': 'Verzonden',
            'delivered': 'Geleverd',
            'cancelled': 'Geannuleerd',
            'paid': 'Betaald'
        }
        return labels[status.toLowerCase()] || status
    }

    const handleBrokerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !order) return

        setIsUploading(true)
        const loadingToast = toast.loading('Bestand uploaden...')

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${order.id}-${Math.random()}.${fileExt}`
            const filePath = `design-uploads/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('shop-designs')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('shop-designs')
                .getPublicUrl(filePath)

            // Import and use server action for database update
            const { updateOrderDesign } = await import('../../../../admin/products/actions')
            const result = await updateOrderDesign(order.id, publicUrl)

            if (!result.success) {
                throw new Error(result.error || 'Fout bij bijwerken order')
            }

            toast.success('Bestand succesvol geüpload!', { id: loadingToast })
            await fetchOrder()
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error('Upload mislukt: ' + error.message, { id: loadingToast })
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    function addDays(date: Date, days: number): Date {
        const result = new Date(date)
        result.setDate(result.getDate() + days)
        return result
    }

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <Link href="/dashboard" className="hover:text-[#0df2a2]">Account</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <Link href="/shop/account/orders" className="hover:text-[#0df2a2]">Bestellingen</Link>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-white">{order.order_number || `FACT-${order.id.slice(0, 8)}`}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6">
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

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Ontwerp & Bestanden</p>
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {order.design_url && (
                                            <Link href={order.design_url} target="_blank" className="inline-flex items-center gap-2 bg-[#0df2a2]/10 text-[#0df2a2] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0df2a2]/20 transition-all">
                                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                Bekijk bestand
                                            </Link>
                                        )}
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${order.design_status === 'approved' ? 'bg-[#0df2a2]/10 text-[#0df2a2]' :
                                            order.design_status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                                order.design_status === 'waiting' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-yellow-500/10 text-yellow-500'
                                            }`}>
                                            {order.design_status === 'approved' ? 'Goedgekeurd' :
                                                order.design_status === 'rejected' ? 'Afgekeurd' :
                                                    order.design_status === 'waiting' ? 'Wacht op bestanden' :
                                                        'In controle'
                                            }
                                        </div>
                                    </div>

                                    {order.design_remarks && (
                                        <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="material-symbols-outlined text-gray-500 text-[14px]">info</span>
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Feedback van Admin</span>
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{order.design_remarks}</p>
                                        </div>
                                    )}

                                    {order.design_status !== 'approved' && (
                                        <div className="pt-2">
                                            <label className={`block w-full ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}>
                                                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0df2a2]/10 border border-[#0df2a2]/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0df2a2] hover:bg-[#0df2a2]/20 transition-all">
                                                    <span className="material-symbols-outlined text-[16px] animate-none">
                                                        {isUploading ? 'sync' : 'upload'}
                                                    </span>
                                                    {isUploading ? 'Bezig met uploaden...' : (order.design_url ? 'Nieuw Bestand Uploaden' : 'Ontwerp Uploaden')}
                                                </div>
                                                <input type="file" className="hidden" onChange={handleBrokerFileUpload} disabled={isUploading} />
                                            </label>
                                            
                                            <button 
                                                onClick={openLibraryModal}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">folder_open</span>
                                                Kies uit Mijn Bestanden
                                            </button>
                                            
                                            {order.design_status === 'rejected' && (
                                                <p className="text-[9px] text-red-400/80 font-bold uppercase tracking-widest mt-2 px-2 italic">
                                                    Uw vorige bestand is afgekeurd. Upload a.u.b. een gecorrigeerd bestand.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Verzending & Tracking</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                        <div className="size-10 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center text-[#0df2a2]">
                                            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-white">{renderTrackingNumber(order.tracking_number)}</div>
                                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                {order.delivery_date ? (
                                                    <>Verwachte levering: <span className="text-[#0df2a2]">{format(new Date(order.delivery_date), 'd MMM yyyy', { locale: nl })}</span></>
                                                ) : (
                                                    <>Geschatte levering: {format(addDays(new Date(order.created_at), 5), 'd MMM yyyy', { locale: nl })}</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {complaints.length > 0 && (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-[40px] p-8 md:p-10 animate-in fade-in slide-in-from-top-4 duration-500 shadow-[0_0_50px_rgba(239,68,68,0.05)]">
                            <h3 className="text-xl font-black text-white tracking-tight mb-8 flex items-center gap-3">
                                <span className="material-symbols-outlined text-red-500">report_problem</span>
                                Actieve Reclamatie
                            </h3>
                            <div className="space-y-4">
                                {complaints.map((c, idx) => (
                                    <div key={idx} className="bg-[#1A1D1C]/60 border border-white/5 rounded-3xl p-6 hover:border-red-500/20 transition-all">
                                        <div className="flex flex-col md:flex-row gap-8">
                                            <div className="flex-1 space-y-4">
                                                <p className="text-gray-400 text-sm leading-relaxed italic pr-10">&quot;{c.description}&quot;</p>
                                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                    <span>{format(new Date(c.created_at), 'd MMMM yyyy', { locale: nl })}</span>
                                                    <span>•</span>
                                                    <span>{c.claim_number}</span>
                                                </div>
                                            </div>
                                            <div className="md:w-64 space-y-4">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 block mb-2">Status</span>
                                                    <div className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 border ${c.status === 'Opgelost' ? 'bg-[#0df2a2]/10 border-[#0df2a2]/20 text-[#0df2a2]' :
                                                        c.status === 'Afgewezen' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                            'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                                                        }`}>
                                                        {c.status !== 'Opgelost' && c.status !== 'Afgewezen' && (
                                                            <span className="size-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                                        )}
                                                        {c.status || 'In Behandeling'}
                                                    </div>
                                                </div>

                                                {c.admin_response && (
                                                    <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-2">Reactie Admin</span>
                                                        <p className="text-xs text-gray-300 leading-relaxed italic">&quot;{c.admin_response}&quot;</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8">
                            <div className="flex items-center gap-2 mb-6 text-gray-500">
                                <span className="material-symbols-outlined text-[20px]">receipt</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Factuuradres</p>
                            </div>
                            <div className="text-sm font-medium text-white space-y-1">
                                <p className="text-lg font-black mb-2">{order.billing_address?.name || '-'}</p>
                                <p className="text-gray-400">{order.billing_address?.contact || '-'}</p>
                                <p className="text-gray-400">{order.billing_address?.street || '-'}</p>
                                <p className="text-gray-400">{order.billing_address?.zipcode || ''} {order.billing_address?.city || '-'}</p>
                            </div>
                        </section>

                        <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8">
                            <div className="flex items-center gap-2 mb-6 text-gray-500">
                                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Bezorgadres</p>
                            </div>
                            <div className="text-sm font-medium text-white space-y-1">
                                <p className="text-lg font-black mb-2">{order.shipping_address?.name || '-'}</p>
                                <p className="text-gray-400">{order.shipping_address?.contact || '-'}</p>
                                <p className="text-gray-400">{order.shipping_address?.street || '-'}</p>
                                <p className="text-gray-400">{order.shipping_address?.zipcode || ''} {order.shipping_address?.city || '-'}</p>
                            </div>
                        </section>
                    </div>

                    <section className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center md:text-left">Details bekeken? U kunt de order herhalen of een klacht indienen.</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button onClick={handleReorder} className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                                <span className="material-symbols-outlined text-[18px]">replay</span>
                                Herhaal order
                            </button>
                            <button onClick={() => setShowComplaintModal(true)} className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-red-400/80 hover:bg-red-500/5 transition-all">
                                <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                                Klacht
                            </button>
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-10">
                    <section className="bg-[#1A1D1C]/40 border border-white/5 rounded-[32px] p-8 space-y-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Factuurnummer</p>
                                <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{order.order_number || `FACT-${order.id.slice(0, 8)}`}</h2>
                            </div>
                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${(order.status !== 'pending' && order.status !== 'unpaid' && order.status !== 'awaiting_payment') ? 'bg-[#0df2a2]/10 text-[#0df2a2]' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                {(order.status !== 'pending' && order.status !== 'unpaid' && order.status !== 'awaiting_payment') ? 'Betaald' : 'Openstaand'}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between text-sm py-3 border-b border-white/5">
                                <span className="text-gray-500 font-medium">Subtotaal</span>
                                <span className="text-white font-bold">€ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm py-3 border-b border-white/5">
                                <span className="text-gray-500 font-medium">BTW (21%)</span>
                                <span className="text-white font-bold">€ {tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-4 rounded-2xl">
                                <span className="text-lg font-black text-white">Totaal</span>
                                <span className="text-3xl font-black text-[#0df2a2]">€ {Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </div>

                        {(order.status === 'pending' || order.status === 'unpaid' || order.status === 'awaiting_payment') && (
                            <button onClick={() => setShowPaymentModal(true)} className="w-full bg-[#0df2a2] text-[#0A0A0A] py-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(13,242,162,0.2)] active:scale-95">
                                Nu Betalen
                            </button>
                        )}
                    </section>

                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 text-center">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Heeft u vragen?</p>
                        <p className="text-[11px] text-[#0df2a2] font-black uppercase tracking-widest mt-2">Contact Support</p>
                    </div>
                </div>
            </div>

            {/* Complaint Modal */}
            {showComplaintModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#1A1D1C] border border-white/10 rounded-[40px] w-full max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight">Klacht indienen</h3>
                            <button onClick={() => setShowComplaintModal(false)} className="size-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10">
                                <span className="material-symbols-outlined text-white">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmitComplaint} className="p-8 space-y-6">
                            {complaintSent ? (
                                <div className="text-center py-10">
                                    <div className="size-20 bg-[#0df2a2]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-4xl">check_circle</span>
                                    </div>
                                    <h4 className="text-xl font-black text-white mb-2">Klacht verzonden</h4>
                                    <p className="text-gray-500">We nemen zo snel mogelijk contact met je op.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Selecteer de betreffende artikelen</p>
                                        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {order.shop_order_items?.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleComplaintItem(item.id)}
                                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedComplaintItems.includes(item.id) ? 'bg-[#0df2a2]/10 border-[#0df2a2]/30' : 'bg-white/5 border-white/5'}`}
                                                >
                                                    <div className={`size-5 rounded flex items-center justify-center border-2 transition-all ${selectedComplaintItems.includes(item.id) ? 'bg-[#0df2a2] border-[#0df2a2]' : 'border-white/20'}`}>
                                                        {selectedComplaintItems.includes(item.id) && <span className="material-symbols-outlined text-[14px] text-black font-black">check</span>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-white leading-tight">{item.shop_products?.name}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{item.selected_options?.[0]?.value || 'Standaard'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Beschrijf de situatie</p>
                                        <textarea required name="description" rows={5} className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white focus:border-[#0df2a2]/50 transition-all outline-none resize-none" placeholder="Geef aan wat er precies niet goed is gegaan..."></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-[#0df2a2] text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95">Verstuur klacht</button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#1A1D1C] border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(13,242,162,0.1)]">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight">Betaalmethode</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="size-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-white">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex justify-between items-center group">
                                    <div>
                                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1">Te betalen</span>
                                        <span className="text-2xl font-black text-[#0df2a2]">€ {Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-1">Factuur</span>
                                        <span className="text-sm font-bold text-white">{order.order_number || `FACT-${order.id.slice(0, 8)}`}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2">Kies uw betaalmethode</p>

                                    {/* iDEAL / Wero Option */}
                                    <div
                                        onClick={() => setSelectedPayment('ideal')}
                                        className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${selectedPayment === 'ideal' ? 'bg-[#0df2a2]/10 border-[#0df2a2]/40 shadow-[0_0_20px_rgba(13,242,162,0.05)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="size-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm shrink-0">
                                            <img src="https://www.mollie.com/external/icons/payment-methods/ideal.svg" alt="iDEAL" className="w-full h-auto" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-white uppercase tracking-tight">iDEAL / Wero</span>
                                                <span className="text-[8px] bg-[#0df2a2] text-black px-1.5 py-0.5 rounded font-black">POPULAIR</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium">Betalen via uw eigen bank</p>
                                        </div>
                                        <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedPayment === 'ideal' ? 'border-[#0df2a2] bg-[#0df2a2]' : 'border-white/20'}`}>
                                            {selectedPayment === 'ideal' && <span className="material-symbols-outlined text-[14px] text-black font-black">check</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={processPayment}
                                        disabled={isPaying || !selectedPayment}
                                        className="w-full bg-[#0df2a2] text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        {isPaying ? 'Betaalomgeving laden...' : 'Nu afrekenen'}
                                        {isPaying && <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>}
                                    </button>
                                    <p className="text-center text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-[12px]">verified_user</span>
                                        Beveiligde betaling via Mollie
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Library Modal */}
            {showLibraryModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#1A1D1C] border border-white/10 rounded-[40px] w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                            <h3 className="text-2xl font-black text-white tracking-tight">Kies uit Mijn Bestanden</h3>
                            <button onClick={() => setShowLibraryModal(false)} className="size-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined text-white">close</span>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <p className="text-sm text-gray-400 mb-6">Selecteer een bestand uit je bibliotheek om aan deze bestelling te koppelen.</p>
                            
                            {isLoadingLibrary ? (
                                <div className="py-20 text-center">
                                    <div className="size-8 border-2 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">Bestanden ophalen...</p>
                                </div>
                            ) : libraryFiles.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {libraryFiles.map((file, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => !isLinkingFromLibrary && handleLinkFromLibrary(file.name)}
                                            className={`bg-white/5 border border-white/10 hover:border-[#0df2a2]/50 rounded-[24px] p-4 cursor-pointer transition-all group overflow-hidden ${isLinkingFromLibrary ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            <div className="h-32 w-full mb-4 bg-black/50 rounded-2xl overflow-hidden relative">
                                                {file.type === 'IMAGE' && file.thumbnailUrl ? (
                                                    <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                                        <span className="material-symbols-outlined text-[#0df2a2] text-4xl mb-2 opacity-50">
                                                            {file.type === 'PDF' ? 'picture_as_pdf' : 'image'}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                                                    <span className="bg-[#0df2a2] text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">Bijvoegen</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-white text-xs truncate" title={file.name}>{file.name}</h3>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">Ontwerp</span>
                                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{format(new Date(file.created_at), 'dd/MM/yyyy')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                                    <span className="material-symbols-outlined text-6xl text-gray-800 mb-4 block">folder_open</span>
                                    <p className="text-gray-500 font-bold mb-2">Je hebt nog geen bestanden geüpload.</p>
                                    <Link href="/shop/account/files" className="text-[#0df2a2] text-xs font-black hover:underline uppercase tracking-widest">Ga naar Mijn Bestanden</Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
