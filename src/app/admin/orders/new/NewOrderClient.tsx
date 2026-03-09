'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { createManualOrder } from '../actions'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, User, Package, Plus, Trash2,
    CheckCircle, Clock, ShieldCheck, CreditCard,
    ChevronDown, ChevronUp, Image as ImageIcon,
    Upload, X, Search
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import Image from 'next/image'
import ImageUpload from '@/components/ImageUpload'

interface ProductOption {
    label: string
    price: number
    image?: string
    icon?: string
    badge?: string
    hidePrice?: boolean
    isDefault?: boolean
}

interface ProductConfigCategory {
    id: string
    name: string
    options: ProductOption[]
    condition?: {
        parentId: string
        showIfIndices: number[]
    }
}

interface Product {
    id: string
    name: string
    slug: string
    base_price: number
    category: string
    images: string[]
    options: any // Raw options from DB
    shipping_cost: number
}

interface AppUser {
    id: string
    full_name: string | null
    email: string
    role: string
}

interface OrderItem {
    productId: string
    name: string
    quantity: number
    price: number // Calculated price per unit after options
    options: any[] // Dynamic options selected
    selections: Record<string, number> // Internal selection indices
    shippingCost: number
}

export default function NewOrderClient({ products, users }: { products: any[], users: AppUser[] }) {
    const router = useRouter()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedUser, setSelectedUser] = useState('')
    const [productSearch, setProductSearch] = useState('')

    const [orderItems, setOrderItems] = useState<OrderItem[]>([])
    const [selectedProductId, setSelectedProductId] = useState('')
    const [configQuantity, setConfigQuantity] = useState(1)

    // Configurator state for the product currently being added
    const [activeConfigProduct, setActiveConfigProduct] = useState<Product | null>(null)
    const [activeSelections, setActiveSelections] = useState<Record<string, number>>({})
    const [expandedStep, setExpandedStep] = useState<string | 'quantity'>('quantity')

    const [paymentMode, setPaymentMode] = useState<'guarantee' | 'awaiting'>('guarantee')
    const [designStatus, setDesignStatus] = useState<'waiting' | 'approved'>('waiting')
    const [adminDesignUrl, setAdminDesignUrl] = useState<string | null>(null)

    const brokers = users.filter(u => {
        const role = (u.role || '').toLowerCase();
        return role !== 'superadmin';
    })

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(productSearch.toLowerCase())
    )

    // Helper to normalize options
    const normalizeOptions = (options: any): ProductConfigCategory[] => {
        if (!options) return []
        if (Array.isArray(options)) {
            return options.map((cat, idx) => ({
                ...cat,
                id: cat.id || `cat-${idx}`,
                options: cat.options.map((opt: any) => ({
                    ...opt,
                    price: opt.price || 0
                }))
            }))
        }
        return Object.entries(options).map(([name, opts], idx) => ({
            id: `legacy-${idx}`,
            name: name,
            options: (opts as any[]).map(opt => ({
                ...opt,
                price: opt.price || 0
            }))
        }))
    }

    // Effect to setup configurator when a product is selected
    useEffect(() => {
        if (selectedProductId) {
            const product = products.find(p => p.id === selectedProductId)
            if (product) {
                const normalized = normalizeOptions(product.options)
                const initialSelections: Record<string, number> = {}
                normalized.forEach(cat => {
                    const defaultIdx = cat.options.findIndex(opt => opt.isDefault)
                    initialSelections[cat.id] = defaultIdx !== -1 ? defaultIdx : 0
                })
                setActiveConfigProduct(product)
                setActiveSelections(initialSelections)
                setExpandedStep('quantity')
            }
        } else {
            setActiveConfigProduct(null)
        }
    }, [selectedProductId, products])

    const visibleOptions = useMemo(() => {
        if (!activeConfigProduct) return []
        const normalized = normalizeOptions(activeConfigProduct.options)
        return normalized.filter(cat => {
            if (!cat.condition || !cat.condition.parentId) return true
            const parentSelectionIdx = activeSelections[cat.condition.parentId] ?? 0
            return cat.condition.showIfIndices.includes(parentSelectionIdx)
        })
    }, [activeConfigProduct, activeSelections])

    const calculateCurrentUnitPrice = () => {
        if (!activeConfigProduct) return 0
        let total = activeConfigProduct.base_price || 0
        visibleOptions.forEach(cat => {
            const idx = activeSelections[cat.id] ?? 0
            const opt = cat.options[idx]
            if (opt) total += opt.price || 0
        })
        return total
    }

    const currentUnitPrice = calculateCurrentUnitPrice()

    const handleAddItem = () => {
        if (!activeConfigProduct) return

        const configuredOptions: any[] = []
        visibleOptions.forEach(cat => {
            const idx = activeSelections[cat.id] ?? 0
            const opt = cat.options[idx]
            if (opt) {
                configuredOptions.push({
                    name: cat.name,
                    value: opt.label,
                    price: opt.price
                })
            }
        })

        setOrderItems([...orderItems, {
            productId: activeConfigProduct.id,
            name: activeConfigProduct.name,
            quantity: configQuantity,
            price: currentUnitPrice,
            options: configuredOptions,
            selections: activeSelections,
            shippingCost: activeConfigProduct.shipping_cost || 0
        }])

        // Reset
        setSelectedProductId('')
        setConfigQuantity(1)
        setActiveConfigProduct(null)
    }

    const handleRemoveItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index))
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shipping = orderItems.reduce((max, item) => Math.max(max, item.shippingCost || 0), 0)
    const finalTotal = paymentMode === 'guarantee' ? 0 : (subtotal + shipping) * 1.21

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedUser) return toast.error('Selecteer een makelaar')
        if (orderItems.length === 0) return toast.error('Voeg minimaal één product toe')

        setIsSubmitting(true)

        const orderData = {
            userId: selectedUser,
            items: orderItems,
            paymentMode,
            designStatus,
            designUrl: adminDesignUrl, // Superadmin direct upload
            shippingCost: shipping
        }

        try {
            const result = await createManualOrder(orderData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Bestelling succesvol aangemaakt!')
                router.push('/admin/orders')
            }
        } catch (error) {
            toast.error('Er is een onverwachte fout opgetreden')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/orders" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors">
                        <ArrowLeft className="size-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Nieuwe <span className="text-[#0df2a2]">Bestelling</span></h1>
                        <p className="text-zinc-500 text-xs font-black tracking-widest uppercase mt-1">Handmatig bestelling plaatsen</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left Column: Form Details */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Selecteer Makelaar */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#0df2a2]/10 rounded-lg">
                                <User className="size-5 text-[#0df2a2]" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white italic">Stap 1: Kies Makelaar</h2>
                        </div>
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            required
                            className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-4 text-sm font-medium text-white focus:outline-none focus:border-[#0df2a2]/50 transition-colors"
                        >
                            <option value="">-- Selecteer een makelaar --</option>
                            {brokers.length === 0 && (
                                <option disabled value="">Geen makelaars gevonden ({users.length} totaal)</option>
                            )}
                            {brokers.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.full_name || 'Naamloos'} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Producten & Configurator */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Package className="size-5 text-blue-500" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white italic">Stap 2: Voeg Producten Toe</h2>
                        </div>

                        {!activeConfigProduct ? (
                            <div className="space-y-6">
                                {/* Product Search */}
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                                    <input
                                        type="text"
                                        placeholder="Zoek product bij naam of categorie..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredProducts.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedProductId(p.id)}
                                            className="group relative p-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-[#0df2a2]/30 transition-all text-left overflow-hidden"
                                        >
                                            <div className="aspect-square bg-white rounded-xl mb-3 p-2 relative overflow-hidden">
                                                <Image
                                                    src={p.images?.[0] || '/placeholder.png'}
                                                    alt={p.name}
                                                    fill
                                                    className="object-contain group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                            <p className="font-black text-xs text-white uppercase tracking-tight truncate">{p.name}</p>
                                            <p className="text-[10px] text-[#0df2a2] font-black uppercase mt-1">Vanaf €{p.base_price.toFixed(2)}</p>

                                            <div className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="size-4 text-[#0df2a2]" />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {orderItems.length > 0 && (
                                    <div className="mt-8 space-y-3 border-t border-white/5 pt-8">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 italic mb-4">Geselecteerde Items</h3>
                                        {orderItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                                                <div>
                                                    <p className="font-black text-sm text-white italic">{item.name}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {item.options.map((opt, oIdx) => (
                                                            <span key={oIdx} className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-zinc-400 font-bold">
                                                                {opt.name}: {opt.value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <span className="text-sm font-black text-white">{item.quantity}x</span>
                                                    <span className="text-sm font-black text-[#0df2a2]">€{(item.price * item.quantity).toFixed(2)}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(idx)}
                                                        className="p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in zoom-in-95 duration-500">
                                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 bg-white rounded-xl relative overflow-hidden p-1">
                                            <Image src={activeConfigProduct.images?.[0] || '/placeholder.png'} alt={activeConfigProduct.name} fill className="object-contain" />
                                        </div>
                                        <div>
                                            <p className="font-black text-white uppercase italic">{activeConfigProduct.name}</p>
                                            <p className="text-[10px] text-[#0df2a2] font-black uppercase italic">Configuratie in gang...</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProductId('')}
                                        className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                                    >
                                        Annuleren
                                    </button>
                                </div>

                                {/* Configurator Accordion */}
                                <div className="space-y-4">
                                    {/* Aantal Step */}
                                    <div className={`rounded-2xl border transition-all ${expandedStep === 'quantity' ? 'border-[#0df2a2]/30 bg-[#0df2a2]/5' : 'border-white/5 bg-black/20'}`}>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedStep('quantity')}
                                            className="w-full flex items-center justify-between p-6"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${expandedStep === 'quantity' ? 'bg-[#0df2a2] text-black' : 'bg-zinc-800 text-zinc-500'}`}>01</div>
                                                <span className="text-xs font-black uppercase tracking-widest text-white">Aantal</span>
                                            </div>
                                            {expandedStep !== 'quantity' && <span className="text-xs font-black text-[#0df2a2] italic">{configQuantity} stuks</span>}
                                        </button>
                                        {expandedStep === 'quantity' && (
                                            <div className="px-6 pb-6 pt-2 space-y-4">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={configQuantity}
                                                    onChange={(e) => setConfigQuantity(parseInt(e.target.value) || 1)}
                                                    className="w-32 bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-black text-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedStep(visibleOptions[0]?.id || 'quantity')}
                                                    className="block w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0df2a2] transition-all"
                                                >
                                                    Volgende stap
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Dynamic Options */}
                                    {visibleOptions.map((cat, catIdx) => {
                                        const isExpanded = expandedStep === cat.id
                                        const selectedIdx = activeSelections[cat.id] ?? 0
                                        const selectedOpt = cat.options[selectedIdx]

                                        return (
                                            <div key={cat.id} className={`rounded-2xl border transition-all ${isExpanded ? 'border-[#0df2a2]/30 bg-[#0df2a2]/5' : 'border-white/5 bg-black/20'}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedStep(cat.id)}
                                                    className="w-full flex items-center justify-between p-6"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`size-8 rounded-full flex items-center justify-center font-black text-xs ${isExpanded ? 'bg-[#0df2a2] text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                                                            {catIdx + 2 < 10 ? `0${catIdx + 2}` : catIdx + 2}
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-widest text-white">{cat.name}</span>
                                                    </div>
                                                    {!isExpanded && selectedOpt && <span className="text-xs font-black text-[#0df2a2] italic">{selectedOpt.label}</span>}
                                                </button>
                                                {isExpanded && (
                                                    <div className="px-6 pb-6 pt-2">
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                            {cat.options.map((opt, optIdx) => (
                                                                <button
                                                                    key={optIdx}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setActiveSelections({ ...activeSelections, [cat.id]: optIdx })
                                                                        const nextIdx = visibleOptions.findIndex(c => c.id === cat.id) + 1
                                                                        if (nextIdx < visibleOptions.length) {
                                                                            setExpandedStep(visibleOptions[nextIdx].id)
                                                                        }
                                                                    }}
                                                                    className={`p-3 rounded-xl border text-left transition-all ${activeSelections[cat.id] === optIdx ? 'border-[#0df2a2] bg-[#0df2a2]/10 ring-1 ring-[#0df2a2]/20' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                                                                >
                                                                    <p className="text-[10px] font-black text-white uppercase tracking-tight leading-tight">{opt.label}</p>
                                                                    {opt.price !== 0 && (
                                                                        <p className="text-[8px] font-bold text-[#0df2a2] mt-1 italic">
                                                                            {opt.price > 0 ? `+€${opt.price.toFixed(2)}` : `-€${Math.abs(opt.price).toFixed(2)}`}
                                                                        </p>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="p-6 bg-black rounded-2xl border border-[#0df2a2]/20 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Stukprijs na opties</p>
                                        <p className="text-2xl font-black text-white italic">€{currentUnitPrice.toFixed(2)}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="px-8 py-4 bg-[#0df2a2] hover:bg-white text-black font-black rounded-xl uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-[#0df2a2]/10 italic"
                                    >
                                        Product toevoegen aan lijst
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ontwerp Upload (Admin) */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Upload className="size-5 text-purple-500" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-tight text-white italic">Stap 3: Direct Ontwerp Uploaden (Optioneel)</h2>
                        </div>

                        <p className="text-xs text-zinc-500 mb-6 font-bold italic">
                            Als je als superadmin het ontwerp al hebt klaargezet, kun je het hier direct uploaden.
                            De makelaar ziet dit bestand dan direct in zijn dashboard.
                        </p>

                        <div className="max-w-md">
                            <ImageUpload
                                defaultValue={adminDesignUrl || undefined}
                                onUpload={(url) => {
                                    setAdminDesignUrl(url)
                                    setDesignStatus('approved') // Auto-approve if file is uploaded
                                }}
                            />
                            {adminDesignUrl && (
                                <button
                                    type="button"
                                    onClick={() => setAdminDesignUrl(null)}
                                    className="mt-4 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                    <X className="size-3" /> Bestand verwijderen
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Configuration & Submit */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Payment Settings */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-6 shadow-2xl">
                        <h3 className="text-sm font-black tracking-widest uppercase text-white border-b border-white/10 pb-4 italic">Betaal Instellingen</h3>

                        <div className="space-y-3">
                            <label className={`block cursor-pointer p-4 rounded-2xl border transition-all ${paymentMode === 'guarantee' ? 'bg-[#0df2a2]/10 border-[#0df2a2]/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="paymentMode"
                                        checked={paymentMode === 'guarantee'}
                                        onChange={() => setPaymentMode('guarantee')}
                                        className="text-[#0df2a2] focus:ring-[#0df2a2] bg-transparent border-white/20"
                                    />
                                    <div className="flex-1">
                                        <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 italic ${paymentMode === 'guarantee' ? 'text-[#0df2a2]' : 'text-gray-400'}`}>
                                            <ShieldCheck className="size-4" /> Garantie / Service
                                        </p>
                                        <p className="text-[10px] text-zinc-500 mt-1 font-medium">100% korting. Direct op betaald.</p>
                                    </div>
                                </div>
                            </label>

                            <label className={`block cursor-pointer p-4 rounded-2xl border transition-all ${paymentMode === 'awaiting' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="paymentMode"
                                        checked={paymentMode === 'awaiting'}
                                        onChange={() => setPaymentMode('awaiting')}
                                        className="text-yellow-500 focus:ring-yellow-500 bg-transparent border-white/20"
                                    />
                                    <div className="flex-1">
                                        <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 italic ${paymentMode === 'awaiting' ? 'text-yellow-500' : 'text-gray-400'}`}>
                                            <CreditCard className="size-4" /> Wacht op betaling
                                        </p>
                                        <p className="text-[10px] text-zinc-500 mt-1 font-medium">Factuur naar makelaar.</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Design Settings */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] space-y-6 shadow-2xl">
                        <h3 className="text-sm font-black tracking-widest uppercase text-white border-b border-white/10 pb-4 italic">Ontwerp Status</h3>

                        <div className="space-y-3">
                            <label className={`block cursor-pointer p-4 rounded-2xl border transition-all ${designStatus === 'waiting' && !adminDesignUrl ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="designStatus"
                                        disabled={!!adminDesignUrl}
                                        checked={designStatus === 'waiting' && !adminDesignUrl}
                                        onChange={() => setDesignStatus('waiting')}
                                        className="text-orange-500 focus:ring-orange-500 bg-transparent border-white/20 disabled:opacity-30"
                                    />
                                    <div className="flex-1">
                                        <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 italic ${(designStatus === 'waiting' && !adminDesignUrl) ? 'text-orange-500' : 'text-gray-400'}`}>
                                            <Clock className="size-4" /> Wacht op bestanden
                                        </p>
                                    </div>
                                </div>
                            </label>

                            <label className={`block cursor-pointer p-4 rounded-2xl border transition-all ${designStatus === 'approved' ? 'bg-[#0df2a2]/10 border-[#0df2a2]/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="designStatus"
                                        checked={designStatus === 'approved'}
                                        onChange={() => setDesignStatus('approved')}
                                        className="text-[#0df2a2] focus:ring-[#0df2a2] bg-transparent border-white/20"
                                    />
                                    <div className="flex-1">
                                        <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 italic ${designStatus === 'approved' ? 'text-[#0df2a2]' : 'text-gray-400'}`}>
                                            <CheckCircle className="size-4" /> Goedgekeurd / Gereed
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-8 bg-black border border-white/10 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0df2a2]/5 blur-3xl rounded-full"></div>

                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase text-zinc-500 italic">
                                <span>Subtotaal excl.</span>
                                <span>€{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase text-zinc-500 italic">
                                <span>Verzending</span>
                                <span className={shipping > 0 ? "text-white not-italic" : "text-[#0df2a2] not-italic"}>
                                    {shipping > 0 ? `€${shipping.toFixed(2)}` : 'GRATIS'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase text-zinc-500 pb-4 border-b border-white/10 italic">
                                <span>BTW (21%)</span>
                                <span>€{((subtotal + shipping) * 0.21).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-end pt-2">
                                <span className="text-xs font-black uppercase tracking-widest text-[#0df2a2] italic">Totaal</span>
                                <div className="text-right">
                                    {paymentMode === 'guarantee' && subtotal > 0 && (
                                        <p className="text-[10px] font-black uppercase text-red-500 tracking-widest italic line-through mb-1">
                                            €{(subtotal * 1.21).toFixed(2)}
                                        </p>
                                    )}
                                    <span className="text-3xl font-black italic tracking-tighter text-white">
                                        €{finalTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            {paymentMode === 'guarantee' && (
                                <p className="text-right text-[10px] font-black uppercase text-[#0df2a2] tracking-widest italic border-t border-white/5 pt-4">
                                    Garantie toegepast (100% korting)
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || orderItems.length === 0 || !selectedUser}
                            className="w-full bg-[#0df2a2] hover:bg-white text-black font-black py-5 rounded-xl uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xl shadow-[#0df2a2]/20 flex justify-center items-center gap-3 relative z-10 italic"
                        >
                            {isSubmitting ? 'Bezig met verwerken...' : 'BESTELLING DEFINITIEF MAKEN'}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    )
}
