'use client'


import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { impersonateUser, updateTenantFeature, updateTenantPackage, getAdminUserDetail } from '@/app/admin/actions'
import toast from 'react-hot-toast'
import {
    UserSearch, Package, Puzzle, Eye, EyeOff, GripVertical,
    ChevronDown, Calendar, Users as UsersIcon, ShoppingCart,
    Receipt, Mic, Home, Star, Archive, PackageSearch, BarChart2
} from 'lucide-react'

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

const defaultFeatures: TenantFeatures & { planId: string | null } = {
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
}

export default function AdminUserDetailPage() {
    const params = useParams()
    const userId = params.id as string
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [features, setFeatures] = useState<TenantFeatures & { planId: string | null }>(defaultFeatures)
    const [packages, setPackages] = useState<DbPackage[]>([])
    const [loading, setLoading] = useState(true)
    const [orders, setOrders] = useState<any[]>([])

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
                setFeatures(f)
                setOrders(o)
            }
            setLoading(false)
        }
        loadData()
    }, [userId])

    async function handleImpersonate() {
        const loadingToast = toast.loading('Ghost login voorbereiden...')
        const result = await impersonateUser(userId)
        if (result?.error) {
            toast.error(result.error, { id: loadingToast })
        } else if (result?.url) {
            toast.success('Inloggen als klant...', { id: loadingToast })
            window.location.href = result.url
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
            toast.success('Module opgeslagen')
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
            toast.success(`Pakket gewijzigd naar ${pkg.name}`, { id: loadingToast })
        }
    }

    if (loading) return <div className="flex items-center justify-center h-96 text-zinc-500 text-sm">Laden...</div>
    if (!user) return <div className="p-8 text-zinc-400">Makelaar niet gevonden.</div>

    const currentPkg = packages.find(p => p.id === features.planId)

    return (
        <div className="font-sans antialiased pb-10 max-w-lg mx-auto md:max-w-4xl space-y-6">

            {/* Header */}
            <header className="py-4 flex flex-col gap-4 sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-lg rounded-xl border-b border-[#222]">
                <div className="px-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0df2a2] to-emerald-900 flex items-center justify-center text-[#0A0A0A] font-bold text-xl uppercase">
                            {user.full_name?.substring(0, 2) || 'EC'}
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-white">{user.full_name || 'Naam Onbekend'}</h1>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{user.email}</p>
                        </div>
                    </div>
                    {currentPkg && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{
                            color: '#0df2a2',
                            borderColor: 'rgba(13,242,162,0.3)',
                            background: 'rgba(13,242,162,0.08)'
                        }}>
                            {currentPkg.name}
                        </span>
                    )}
                </div>
                <div className="px-5">
                    <button
                        onClick={handleImpersonate}
                        className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#0df2a2] text-[#0A0A0A] font-bold rounded-xl hover:shadow-[0_0_15px_rgba(13,242,162,0.3)] transition-all active:scale-95">
                        <UserSearch className="w-5 h-5" />
                        <span className="text-sm">Inloggen als klant</span>
                    </button>
                </div>
            </header>

            <main className="px-5 grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Pakket Beheer */}
                <section className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-6 border border-white/5 h-fit">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Pakket Beheer</h2>
                        <Package className="w-5 h-5 text-zinc-500" />
                    </div>

                    {/* Package cards */}
                    <div className="space-y-2 mb-4">
                        {packages.map((pkg) => (
                            <button
                                key={pkg.id}
                                onClick={() => handlePackageChange(pkg)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${features.planId === pkg.id
                                    ? 'bg-[#0df2a2]/10 border-[#0df2a2]/40 shadow-[0_0_12px_rgba(13,242,162,0.1)]'
                                    : 'bg-[#252525] border-transparent hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate ${features.planId === pkg.id ? 'text-[#0df2a2]' : 'text-white'}`}>{pkg.name}</p>
                                        <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">{pkg.description}</p>
                                        <p className="text-[10px] text-[#0df2a2] mt-1 font-bold">
                                            {pkg.property_limit >= 999 ? 'Onbeperkt' : pkg.property_limit} woningen
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0 ml-2">
                                        <p className={`font-black text-lg ${features.planId === pkg.id ? 'text-[#0df2a2]' : 'text-white'}`}>€{pkg.monthly_price}</p>
                                        <p className="text-[10px] text-zinc-600">/maand</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest">Pakket selecteren wijzigt de modules automatisch</p>
                </section>

                {/* Module Licenties */}
                <section className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-6 border border-white/5 row-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Module Licenties</h2>
                        <Puzzle className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div className="space-y-1">
                        {MODULE_CONFIG.map(({ key, label, icon: Icon }, i) => (
                            <div key={key} className={`flex items-center justify-between py-3.5 ${i < MODULE_CONFIG.length - 1 ? 'border-b border-zinc-800/50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-800/50 rounded-lg">
                                        <Icon className="w-4 h-4 text-[#0df2a2]" />
                                    </div>
                                    <span className="font-semibold text-zinc-200 text-sm">{label}</span>
                                </div>
                                <label className="relative inline-block w-11 h-6 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={features[key as keyof TenantFeatures] as boolean}
                                        onChange={() => handleToggleFeature(key as keyof TenantFeatures)}
                                    />
                                    <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2a2]"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Shop Orders */}
                <section className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-3xl p-6 border border-white/5 md:col-span-2 h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white">Recente Bestellingen</h2>
                        <ShoppingCart className="w-5 h-5 text-zinc-500" />
                    </div>
                    {orders.length === 0 ? (
                        <div className="py-10 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
                            <span className="material-symbols-outlined text-zinc-600 mb-2 text-3xl block">inbox</span>
                            <p className="text-sm text-zinc-500">Geen bestellingen gevonden voor deze makelaar.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-zinc-800/50">
                            <table className="w-full text-left text-sm text-zinc-400">
                                <thead className="bg-[#222] text-xs uppercase font-bold text-zinc-500">
                                    <tr>
                                        <th className="px-5 py-3">Ordnummer</th>
                                        <th className="px-5 py-3">Datum</th>
                                        <th className="px-5 py-3">Bedrag</th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#181818]">
                                    {orders.slice(0, 5).map(order => (
                                        <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-5 py-4 font-mono text-xs">{order.order_number}</td>
                                            <td className="px-5 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleDateString('nl-NL')}</td>
                                            <td className="px-5 py-4 font-bold text-white">€{order.total_amount}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
