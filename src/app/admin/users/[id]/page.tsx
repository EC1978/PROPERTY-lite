'use client'


import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { impersonateUser, updateTenantFeature, updateTenantPackage, getAdminUserDetail } from '@/app/admin/actions'
import toast from 'react-hot-toast'
import {
    UserSearch, Package, Puzzle, Eye, EyeOff, GripVertical,
    ChevronDown, Calendar, Users as UsersIcon, ShoppingCart,
    Receipt, Mic, Home, Star, Archive, PackageSearch, BarChart2,
    Clock, ShieldCheck, ExternalLink, Mail, User as UserIcon,
    ArrowLeft, TrendingUp, Wallet, Check, Trash2, ShieldAlert
} from 'lucide-react'
import { deleteBrokerAccount } from '@/app/admin/actions'

const MODULE_CONFIG = [
    { key: 'has_properties', label: 'Woningen', icon: Home },
    { key: 'has_agenda', label: 'Agenda', icon: Calendar },
    { key: 'has_leads', label: 'Leads Management', icon: UsersIcon },
    { key: 'has_materials', label: 'Materialen', icon: PackageSearch },
    { key: 'has_archive', label: 'Archief', icon: Archive },
    { key: 'has_statistics', label: 'Statistieken', icon: BarChart2 },
    { key: 'has_reviews', label: 'Klantbeoordelingen', icon: Star },
    { key: 'has_webshop', label: 'Webshop', icon: ShoppingCart },
    { key: 'has_billing', label: 'Facturatie', icon: Receipt },
    { key: 'has_voice', label: 'Voice AI Assist', icon: Mic },
] as const

type TenantFeatures = {
    has_properties: boolean
    has_agenda: boolean
    has_materials: boolean
    has_archive: boolean
    has_leads: boolean
    has_statistics: boolean
    has_reviews: boolean
    has_webshop: boolean
    has_billing: boolean
    has_voice: boolean
}

type DbPackage = {
    id: string
    name: string
    description: string
    monthly_price: number
    annual_price: number
    property_limit: number
    is_popular: boolean
    has_properties: boolean
    has_agenda: boolean
    has_materials: boolean
    has_archive: boolean
    has_leads: boolean
    has_statistics: boolean
    has_reviews: boolean
    has_webshop: boolean
    has_billing: boolean
    has_voice: boolean
}

const ORDER_STATUS_MAP: Record<string, string> = {
    'pending': 'In afwachting',
    'awaiting_payment': 'Wacht op betaling',
    'processing': 'In behandeling',
    'production': 'In productie',
    'shipped': 'Verzonden',
    'delivered': 'Geleverd',
    'completed': 'Voltooid',
    'paid': 'Betaald',
    'cancelled': 'Geannuleerd'
}

const defaultFeatures: TenantFeatures & { planId: string | null, trialExpiresAt: string | null } = {
    has_properties: true,
    has_agenda: false,
    has_materials: false,
    has_archive: false,
    has_leads: false,
    has_statistics: false,
    has_reviews: false,
    has_webshop: false,
    has_billing: false,
    has_voice: false,
    planId: null,
    trialExpiresAt: null,
}

export default function AdminUserDetailPage() {
    const params = useParams()
    const userId = params.id as string
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [features, setFeatures] = useState<TenantFeatures & { planId: string | null, trialExpiresAt: string | null }>(defaultFeatures)
    const [packages, setPackages] = useState<DbPackage[]>([])
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<any[]>([])
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [confirmName, setConfirmName] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const result = await getAdminUserDetail(userId)

            if (result.error) {
                toast.error(result.error)
                setLoading(false)
                return
            }

            if (result.success && result.data) {
                const { user: u, packages: p, features: f, orders: o } = result.data
                setUser(u)
                setPackages(p)
                
                // Merge profile data (tier and trial) into features state
                setFeatures({
                    ...f,
                    planId: u.subscription_tier || null,
                    trialExpiresAt: u.trial_expires_at || null
                })
                setOrders(o)
            }
            setLoading(false)
        }
        loadData()
    }, [userId])

    async function handleImpersonate() {
        const loadingToast = toast.loading('Ghost login voorbereiden...')
        try {
            const response = await fetch('/api/admin/ghost-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId })
            })
            const result = await response.json()
            if (result?.error) {
                toast.error(result.error, { id: loadingToast })
            } else if (result?.url) {
                toast.success('Overschakelen naar account...', { id: loadingToast })
                window.location.href = result.url
            }
        } catch (error) {
            toast.error('Geweigerd.', { id: loadingToast })
        }
    }

    async function handleToggleFeature(featureKey: keyof TenantFeatures) {
        const newValue = !features[featureKey]
        setFeatures(prev => ({ ...prev, [featureKey]: newValue, planId: null }))
        const result = await updateTenantFeature(userId, featureKey, newValue)
        if (result.error) {
            setFeatures(prev => ({ ...prev, [featureKey]: !newValue }))
            toast.error(result.error)
        } else {
            toast.success('Module bijgewerkt')
        }
    }

    async function handlePackageChange(pkg: DbPackage) {
        const loadingToast = toast.loading('Pakket bijwerken...')
        const result = await updateTenantPackage(userId, pkg.id)
        if (result.error) {
            toast.error(result.error, { id: loadingToast })
        } else {
            setFeatures(prev => ({
                ...prev,
                has_properties: pkg.has_properties,
                has_agenda: pkg.has_agenda,
                has_materials: pkg.has_materials,
                has_archive: pkg.has_archive,
                has_leads: pkg.has_leads,
                has_statistics: pkg.has_statistics,
                has_reviews: pkg.has_reviews,
                has_webshop: pkg.has_webshop,
                has_billing: pkg.has_billing,
                has_voice: pkg.has_voice,
                planId: pkg.id
            }))
            toast.success(`Pakket: ${pkg.name}`, { id: loadingToast })
        }
    }

    async function handleExtendTrial() {
        const { updateTrialExpiration } = await import('@/app/admin/actions')
        const loadingToast = toast.loading('Trial verlengen...')
        const result = await updateTrialExpiration(userId, 30)
        if (result.error) {
            toast.error(result.error, { id: loadingToast })
        } else {
            setFeatures(prev => ({ ...prev, trialExpiresAt: result.newDate || prev.trialExpiresAt }))
            toast.success(`Verlengd!`, { id: loadingToast })
            window.location.reload()
        }
    }

    async function handleDeleteAccount() {
        if (confirmName !== user.full_name) {
            toast.error('Naam komt niet overeen.')
            return
        }

        setIsDeleting(true)
        const loadingToast = toast.loading('Account en data verwijderen...')
        
        try {
            const result = await deleteBrokerAccount(userId)
            if (result.success) {
                toast.success('Account definitief verwijderd', { id: loadingToast })
                window.location.href = '/admin/users'
            } else {
                toast.error(result.error || 'Fout bij verwijderen', { id: loadingToast })
                setIsDeleting(false)
            }
        } catch (error) {
            toast.error('Er is een fout opgetreden', { id: loadingToast })
            setIsDeleting(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="w-8 h-8 border-2 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Makelaar data ophalen...</p>
        </div>
    )

    if (!user) return <div className="p-8 text-zinc-400">Makelaar niet gevonden.</div>

    // Case-insensitive matching for the current package
    const currentPkg = packages.find(p => 
        p.id.toLowerCase() === features.planId?.toLowerCase()
    )
    
    const totalRevenue = orders
        .filter(o => ['paid', 'production', 'shipped', 'completed'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Breadcrumb & Quick Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 lg:px-0 gap-4 sm:gap-3">
                <Link href="/admin/users" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group text-sm font-bold uppercase tracking-widest shrink-0">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="hidden sm:inline">Terug naar overzicht</span>
                    <span className="sm:hidden">Terug</span>
                </Link>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] hidden sm:inline">Snelacties:</span>
                    <button
                        onClick={handleExtendTrial}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white transition-all min-h-[44px]"
                    >
                        +30 D Trial
                    </button>
                </div>
            </div>

            {/* Profile Header Block */}
            <div className="relative overflow-hidden bg-[#111] border border-white/5 rounded-[2.5rem] p-6 md:p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#0df2a2]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10 flex flex-col items-center md:flex-row md:items-start justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-[#0df2a2] to-emerald-900 rounded-full blur opacity-25 group-hover:opacity-40 transition-opacity" />
                            <div className="relative w-28 h-28 md:w-40 md:h-40 rounded-full bg-zinc-900 border-4 border-white/5 flex items-center justify-center text-[#0df2a2] font-black text-4xl md:text-5xl uppercase shadow-2xl">
                                {user.full_name?.substring(0, 2) || <UserIcon />}
                            </div>
                            <div className="absolute bottom-2 right-2 w-8 h-8 bg-[#0df2a2] rounded-full border-4 border-[#111] flex items-center justify-center">
                                <ShieldCheck className="w-4 h-4 text-black" />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex flex-col md:flex-row items-center gap-3">
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                                    {user.full_name || 'Naam Onbekend'}
                                </h1>
                                <span className="px-3 py-1 bg-[#0df2a2]/10 text-[#0df2a2] border border-[#0df2a2]/20 rounded-full text-[10px] font-black uppercase tracking-[0.1em]">
                                    {user.role || 'makelaar'}
                                </span>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-zinc-500 font-medium text-sm">
                                <span className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /> <span className="truncate max-w-[200px]">{user.email}</span></span>
                                <span className="flex items-center gap-2 tracking-tight">Klant sinds {new Date(user.created_at).toLocaleDateString('nl-NL')}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleImpersonate}
                        className="group relative w-full md:w-auto px-8 py-4 md:py-5 bg-[#0df2a2] hover:bg-white text-black font-black rounded-2xl transition-all active:scale-95 shadow-[0_20px_40px_rgba(13,242,162,0.15)] flex items-center justify-center gap-3 overflow-hidden min-h-[56px]"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        <UserSearch className="w-5 h-5 relative z-10" />
                        <span className="text-sm uppercase tracking-widest relative z-10">Ghost Login</span>
                    </button>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Stats Card: Current Plan */}
                <div className="bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-[#0df2a2]/20 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Huidig Pakket</p>
                        <div className="p-2 bg-zinc-900 rounded-xl group-hover:text-[#0df2a2] transition-colors"><TrendingUp className="w-4 h-4" /></div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">
                            {currentPkg?.name || features.planId || 'Vrij Pakket'}
                        </h2>
                        <p className="text-sm text-zinc-500">{currentPkg ? `€${currentPkg.monthly_price}/maand` : (features.planId ? 'Aangepast pakket' : 'Personalized modules')}</p>
                    </div>
                </div>

                {/* Stats Card: Trial Status */}
                <div className="bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-[#0df2a2]/20 transition-all group">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Trial Status</p>
                        <div className="p-2 bg-zinc-900 rounded-xl group-hover:text-[#0df2a2] transition-colors"><Clock className="w-4 h-4" /></div>
                    </div>
                    <div className="space-y-2">
                        {features.trialExpiresAt ? (
                            <>
                                <h2 className="text-3xl font-black text-white tracking-tight">
                                    {(() => {
                                        const diff = Math.ceil((new Date(features.trialExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        return diff > 0 ? `${diff} Dagen` : 'Verlopen';
                                    })()}
                                </h2>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                    Verloopt op: {new Date(features.trialExpiresAt).toLocaleDateString('nl-NL')}
                                </p>
                            </>
                        ) : (
                            <h2 className="text-3xl font-black text-white tracking-tight">Onbeperkt</h2>
                        )}
                        <button 
                            onClick={handleExtendTrial} 
                            className="mt-4 w-full py-3 bg-[#0df2a2]/10 hover:bg-[#0df2a2] text-[#0df2a2] hover:text-black border border-[#0df2a2]/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            +30 Dagen Verlengen
                        </button>
                    </div>
                </div>

                {/* Stats Card: Total Revenue */}
                <div className="bg-gradient-to-br from-[#0df2a2]/5 to-transparent backdrop-blur-xl border border-[#0df2a2]/20 rounded-3xl p-8 group">
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.3em]">Levenslange Omzet</p>
                        <div className="p-2 bg-[#0df2a2]/10 rounded-xl text-[#0df2a2]"><Wallet className="w-4 h-4" /></div>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-4xl font-black text-white">€{totalRevenue.toFixed(2)}</h2>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{orders.length} Bestellingen</p>
                    </div>
                </div>
            </div>

            {/* Configuration Container */}
            <div className="flex flex-col gap-6">
                
                {/* Top: Package Management */}
                <div className="bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Package className="w-5 h-5 text-[#0df2a2]" />
                            Pakket Management
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {packages.map((pkg) => (
                            <button
                                key={pkg.id}
                                onClick={() => handlePackageChange(pkg)}
                                className={`group relative p-6 rounded-2xl border text-left transition-all overflow-hidden ${
                                    features.planId === pkg.id
                                        ? 'bg-[#0df2a2]/5 border-[#0df2a2]/40 shadow-[0_0_40px_rgba(13,242,162,0.1)]'
                                        : 'bg-[#222]/40 border-white/5 hover:border-white/20'
                                }`}
                            >
                                {features.planId === pkg.id && (
                                    <div className="absolute top-4 right-4 size-5 bg-[#0df2a2] rounded-full flex items-center justify-center">
                                        <Check className="w-3 h-3 text-black" />
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div>
                                        <h4 className={`text-lg font-black uppercase ${features.planId === pkg.id ? 'text-[#0df2a2]' : 'text-white'}`}>
                                            {pkg.name}
                                        </h4>
                                        <p className="text-xs text-zinc-600 font-medium line-clamp-1">{pkg.description}</p>
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div className="font-mono text-[10px] text-zinc-400">
                                            {pkg.property_limit >= 999 ? '∞' : pkg.property_limit} woningen limit
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">€{pkg.monthly_price}</span>
                                            <span className="text-[10px] text-zinc-600 font-bold block">/maand</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom: Module Toggles in 2 Rows */}
                <div className="bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Puzzle className="w-5 h-5 text-[#0df2a2]" />
                            Module Details
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {MODULE_CONFIG.map(({ key, label, icon: Icon }) => (
                            <div key={key} className="flex flex-col items-center justify-center p-5 bg-[#222]/40 rounded-2xl border border-white/5 group hover:border-white/20 transition-all gap-4">
                                <div className="flex flex-col items-center gap-3 w-full">
                                    <div className={`p-4 rounded-xl transition-colors ${features[key as keyof TenantFeatures] ? 'bg-[#0df2a2]/10 text-[#0df2a2] shadow-[0_0_20px_rgba(13,242,162,0.15)]' : 'bg-zinc-800/50 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-400'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest text-center ${features[key as keyof TenantFeatures] ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer mt-auto">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={features[key as keyof TenantFeatures] as boolean}
                                        onChange={() => handleToggleFeature(key as keyof TenantFeatures)}
                                    />
                                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2a2]" />
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Row: Orders */}
            <div className="bg-[#111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 md:p-10 flex items-center justify-between border-b border-white/5">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <ShoppingCart className="w-6 h-6 text-[#0df2a2]" />
                            Shop Bestellingen
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1 italic">Totaaloverzicht van geplaatste orders</p>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 text-zinc-700">
                            <Archive className="w-10 h-10" />
                        </div>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Geen bestellingen gevonden</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: Card layout */}
                        <div className="sm:hidden divide-y divide-white/5">
                            {orders.slice(0, 15).map(order => (
                                <div key={order.id} className="p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono text-xs font-black text-[#0df2a2] py-1 px-2 bg-[#0df2a2]/10 rounded-lg">
                                            #{order.id.substring(0, 8)}
                                        </span>
                                        <Link
                                            href={`/admin/orders?orderId=${order.id}`}
                                            className="p-2 bg-white/5 hover:bg-[#0df2a2] text-zinc-400 hover:text-black rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-zinc-400 font-medium">
                                            {new Date(order.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            ['completed', 'shipped', 'paid'].includes(order.status)
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : order.status === 'cancelled'
                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                        }`}>
                                            {ORDER_STATUS_MAP[order.status] || order.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Betaald</span>
                                        <span className="text-base font-black text-white">€{Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Table layout */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/[0.02]">
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-600">Order ID</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-600">Datum</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-600">Status</th>
                                        <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-600 text-right">Betaald</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {orders.slice(0, 15).map(order => (
                                        <tr key={order.id} className="group hover:bg-white/[0.01] transition-colors">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-xs font-black text-[#0df2a2] py-1 px-2 bg-[#0df2a2]/10 rounded-lg">
                                                        #{order.id.substring(0, 8)}
                                                    </span>
                                                    <Link
                                                        href={`/admin/orders?orderId=${order.id}`}
                                                        className="p-1.5 opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-[#0df2a2] text-zinc-400 hover:text-black rounded-lg transition-all"
                                                    >
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-sm text-zinc-400 font-medium">
                                                {new Date(order.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    ['completed', 'shipped', 'paid'].includes(order.status)
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : order.status === 'cancelled'
                                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                }`}>
                                                    {ORDER_STATUS_MAP[order.status] || order.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <div className="text-lg font-black text-white">€{Number(order.total_amount).toFixed(2)}</div>
                                                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Excl. Korting</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5 text-center md:text-left">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Danger Zone</h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Verwijder dit account en alle bijbehorende data definitief</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full md:w-auto px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 min-h-[52px]"
                    >
                        <Trash2 className="w-4 h-4" />
                        Account Verwijderen
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto animate-pulse">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Weet je het zeker?</h3>
                                <p className="text-sm text-zinc-400">
                                    Je staat op het punt om het account van <span className="text-white font-bold">{user.full_name}</span> permanent te verwijderen. Dit kan niet ongedaan worden gemaakt.
                                </p>
                            </div>

                            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl text-left space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block px-1">
                                    Type <span className="text-red-500">{user.full_name}</span> om te bevestigen
                                </label>
                                <input 
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder="Naam overtypen..."
                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all"
                                />
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleDeleteAccount}
                                    disabled={confirmName !== user.full_name || isDeleting}
                                    className="w-full py-4 bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:grayscale text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                                >
                                    {isDeleting ? 'Verwijderen...' : 'Ja, definitief verwijderen'}
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsDeleteModalOpen(false)
                                        setConfirmName('')
                                    }}
                                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    Annuleren
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
