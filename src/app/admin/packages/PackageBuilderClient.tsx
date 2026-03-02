'use client'

import { useState, useEffect, useCallback } from 'react'
import { updatePackage, createPackage, deletePackage, reorderPackages } from './actions'
import toast from 'react-hot-toast'
import {
    Package, Save, Home, Calendar, Users, PackageSearch, Archive,
    BarChart2, Star, ShoppingCart, Receipt, Mic, Euro, Trash2, Plus,
    ChevronUp, ChevronDown, Eye, EyeOff
} from 'lucide-react'

const MODULE_LIST = [
    { key: 'has_properties', label: 'Woningen', icon: Home, description: 'Woningbeheer & listings' },
    { key: 'has_agenda', label: 'Agenda', icon: Calendar, description: 'Planning & afspraken' },
    { key: 'has_leads', label: 'Leads', icon: Users, description: 'Leads & CRM' },
    { key: 'has_materials', label: 'Materialen', icon: PackageSearch, description: 'Materialen bibliotheek' },
    { key: 'has_archive', label: 'Archief', icon: Archive, description: 'Document archief' },
    { key: 'has_statistics', label: 'Statistieken', icon: BarChart2, description: 'Analytics & rapportages' },
    { key: 'has_reviews', label: 'Klantbeoordelingen', icon: Star, description: 'Review management' },
    { key: 'has_webshop', label: 'Webshop', icon: ShoppingCart, description: 'Online winkel' },
    { key: 'has_billing', label: 'Facturatie', icon: Receipt, description: 'Facturen & betalingen' },
    { key: 'has_voice', label: 'Voice AI Assist', icon: Mic, description: 'AI spraakassistent' },
] as const

type DbPackage = {
    id: string
    name: string
    description: string
    monthly_price: number
    annual_price: number
    property_limit: number
    is_popular: boolean
    is_active: boolean
    show_on_landing: boolean
    sort_order: number
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

interface PackageCardProps {
    pkg: DbPackage
    isFirst: boolean
    isLast: boolean
    isDirty: boolean
    isSaving: boolean
    onUpdate: (updates: Partial<DbPackage>) => void
    onSave: () => void
    onDelete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
}

function PackageCard({ pkg, isFirst, isLast, isDirty, isSaving, onUpdate, onSave, onDelete, onMoveUp, onMoveDown }: PackageCardProps) {
    const [deleting, setDeleting] = useState(false)

    const tierColors: Record<string, string> = {
        Basic: 'text-zinc-400 border-zinc-700',
        Pro: 'text-[#0df2a2] border-[#0df2a2]/40',
        Premium: 'text-purple-400 border-purple-500/40',
    }

    return (
        <div className={`bg-[#111] border border-white/[0.06] rounded-3xl p-6 flex flex-col gap-5 relative transition-all ${deleting ? 'opacity-50 pointer-events-none' : ''} ${!pkg.is_active ? 'opacity-70 grayscale-[0.5]' : ''}`}>
            {/* Header Content */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${tierColors[pkg.id] || 'text-zinc-400 border-zinc-700'}`}>
                            {pkg.id}
                        </span>
                        {!pkg.is_active && (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                                Inactief
                            </span>
                        )}
                    </div>
                    <input
                        className="block text-2xl font-black text-white bg-transparent border-0 border-b border-transparent hover:border-zinc-700 focus:border-[#0df2a2] focus:outline-none transition-colors w-full pb-1"
                        value={pkg.name || ''}
                        onChange={e => onUpdate({ name: e.target.value })}
                        placeholder="Pakketnaam..."
                    />
                    <input
                        className="block mt-1 text-sm text-zinc-500 bg-transparent border-0 border-b border-transparent hover:border-zinc-700 focus:border-[#0df2a2] focus:outline-none transition-colors w-full pb-1"
                        value={pkg.description || ''}
                        onChange={e => onUpdate({ description: e.target.value })}
                        placeholder="Beschrijving..."
                    />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-zinc-900/80 rounded-xl p-1 border border-white/5">
                        <button onClick={onMoveUp} disabled={isFirst} className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors">
                            <ChevronUp className="w-5 h-5" />
                        </button>
                        <button onClick={onMoveDown} disabled={isLast} className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors">
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </div>
                    <button onClick={onDelete} disabled={deleting} className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Visibility & Popularity toggles */}
            <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-white/5 cursor-pointer group hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${pkg.is_active ? 'bg-[#0df2a2]/10 text-[#0df2a2]' : 'bg-zinc-800 text-zinc-500'}`}>
                            {pkg.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Actief</span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Zichtbaar</span>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="checkbox" checked={!!pkg.is_active} onChange={e => onUpdate({ is_active: e.target.checked })} className="sr-only peer" />
                        <div className="w-10 h-6 bg-zinc-800 peer-checked:bg-[#0df2a2] rounded-full transition-all duration-300"></div>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${pkg.is_active ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-white/5 cursor-pointer group hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${pkg.is_popular ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            <Star className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Tag</span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Populair</span>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="checkbox" checked={!!pkg.is_popular} onChange={e => onUpdate({ is_popular: e.target.checked })} className="sr-only peer" />
                        <div className="w-10 h-6 bg-zinc-800 peer-checked:bg-amber-500 rounded-full transition-all duration-300"></div>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${pkg.is_popular ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 border border-white/5 cursor-pointer group hover:border-white/10 transition-colors col-span-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg transition-colors ${pkg.show_on_landing ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
                            <PackageSearch className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-white font-black uppercase tracking-widest">Landingpage</span>
                            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Tonen op Landing</span>
                        </div>
                    </div>
                    <div className="relative">
                        <input type="checkbox" checked={!!pkg.show_on_landing} onChange={e => onUpdate({ show_on_landing: e.target.checked })} className="sr-only peer" />
                        <div className="w-10 h-6 bg-zinc-800 peer-checked:bg-blue-500 rounded-full transition-all duration-300"></div>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${pkg.show_on_landing ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                </label>
            </div>

            {/* Pricing & Limits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
                        <Euro className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Maand Prijs</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-zinc-500 font-bold">€</span>
                        <input
                            type="number"
                            className="w-full bg-transparent text-white text-xl font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={pkg.monthly_price ?? 0}
                            onChange={e => onUpdate({ monthly_price: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
                        <Euro className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Jaar Prijs</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-zinc-500 font-bold">€</span>
                        <input
                            type="number"
                            className="w-full bg-transparent text-white text-xl font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={pkg.annual_price ?? 0}
                            onChange={e => onUpdate({ annual_price: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div className="bg-zinc-900/60 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-1.5 text-zinc-500 mb-2">
                        <Home className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-widest">Woning Limiet</span>
                    </div>
                    <input
                        type="number"
                        className="w-full bg-transparent text-white text-xl font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        value={pkg.property_limit === 999 ? '' : (pkg.property_limit ?? 0)}
                        placeholder="∞"
                        onChange={e => onUpdate({ property_limit: e.target.value === '' ? 999 : Number(e.target.value) })}
                    />
                    <p className="text-[10px] text-zinc-600 mt-0.5">{pkg.property_limit >= 999 ? 'onbeperkt' : `max ${pkg.property_limit} woningen`}</p>
                </div>
            </div>

            {/* Module Toggles */}
            <div className="flex-1">
                <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-3 flex items-center justify-between">
                    <span>Inbegrepen modules</span>
                    <span className="text-[#0df2a2]">{MODULE_LIST.filter(m => !!pkg[m.key as keyof DbPackage]).length} / {MODULE_LIST.length}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                    {MODULE_LIST.map(({ key, label, icon: Icon }) => {
                        const enabled = !!pkg[key as keyof DbPackage]
                        return (
                            <button
                                key={key}
                                onClick={() => onUpdate({ [key]: !enabled })}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${enabled
                                    ? 'bg-[#0df2a2]/5 border-[#0df2a2]/20 text-[#0df2a2]'
                                    : 'bg-zinc-900/20 border-zinc-800/40 text-zinc-600 hover:border-zinc-700'
                                    }`}
                            >
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${enabled ? 'text-[#0df2a2]' : 'text-zinc-700'}`} />
                                <span className="text-[12px] font-bold truncate">{label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Save button */}
            <button
                onClick={onSave}
                disabled={isSaving || !isDirty}
                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isDirty
                    ? 'bg-[#0df2a2] text-black hover:shadow-[0_0_20px_rgba(13,242,162,0.3)] active:scale-95'
                    : 'bg-zinc-900/50 text-zinc-600 border border-white/5 cursor-not-allowed'
                    }`}
            >
                {isSaving ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                ) : (
                    <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Bezig...' : isDirty ? 'Opslaan & Live Zetten' : 'Alle Wijzigingen Opgeslagen'}
            </button>
        </div>
    )
}

export default function PackageBuilderClient({ packages }: { packages: DbPackage[] }) {
    const [localPackages, setLocalPackages] = useState<DbPackage[]>(packages)
    const [dirtyIds, setDirtyIds] = useState<Record<string, boolean>>({})
    const [savingIds, setSavingIds] = useState<Record<string, boolean>>({})
    const [creating, setCreating] = useState(false)
    const [isReordering, setIsReordering] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleAddItem = async () => {
        setCreating(true)
        const result = await createPackage('Nieuw Pakket')
        setCreating(false)
        if (result.error) toast.error(result.error)
        else {
            toast.success('Pakket toegevoegd! Je kunt het nu bewerken.')
            if (result.package) {
                setLocalPackages(prev => [...prev, result.package as DbPackage])
            }
        }
    }

    const handleUpdate = useCallback(async (id: string, updates: Partial<DbPackage>) => {
        setLocalPackages(prev => {
            const pkg = prev.find(p => p.id === id)
            if (!pkg) return prev

            const updatedPkg = { ...pkg, ...updates }
            const newList = prev.map(p => p.id === id ? updatedPkg : p)

            // AUTO-SAVE for toggles that affect layout/visibility
            if (updates.hasOwnProperty('is_active') || updates.hasOwnProperty('is_popular') || updates.hasOwnProperty('show_on_landing')) {
                setSavingIds(s => ({ ...s, [id]: true }))
                updatePackage(id, updatedPkg).then(result => {
                    setSavingIds(s => ({ ...s, [id]: false }))
                    if (result.error) {
                        toast.error(result.error)
                        // Optional: revert local state on error? 
                        // For now just alert the user.
                    } else {
                        setDirtyIds(d => ({ ...d, [id]: false }))
                        toast.success('Wijziging opgeslagen')
                    }
                })
            } else {
                setDirtyIds(d => ({ ...d, [id]: true }))
            }

            return newList
        })
    }, [])

    const handleSave = async (id: string) => {
        const pkg = localPackages.find(p => p.id === id)
        if (!pkg) return

        setSavingIds(prev => ({ ...prev, [id]: true }))
        const result = await updatePackage(id, {
            name: pkg.name,
            description: pkg.description,
            monthly_price: pkg.monthly_price,
            annual_price: pkg.annual_price,
            property_limit: pkg.property_limit,
            is_popular: !!pkg.is_popular,
            is_active: !!pkg.is_active,
            has_properties: !!pkg.has_properties,
            has_agenda: !!pkg.has_agenda,
            has_leads: !!pkg.has_leads,
            has_materials: !!pkg.has_materials,
            has_archive: !!pkg.has_archive,
            has_statistics: !!pkg.has_statistics,
            has_reviews: !!pkg.has_reviews,
            has_webshop: !!pkg.has_webshop,
            has_billing: !!pkg.has_billing,
            has_voice: !!pkg.has_voice,
            show_on_landing: !!pkg.show_on_landing,
        })
        setSavingIds(prev => ({ ...prev, [id]: false }))

        if (result.error) toast.error(result.error)
        else {
            toast.success(`Pakket "${pkg.name}" opgeslagen!`)
            setDirtyIds(prev => ({ ...prev, [id]: false }))
        }
    }

    const handleDelete = async (id: string) => {
        const pkg = localPackages.find(p => p.id === id)
        if (!pkg) return
        if (!confirm(`Weet je zeker dat je het pakket "${pkg.name}" wilt verwijderen?`)) return

        const result = await deletePackage(id)
        if (result.error) toast.error(result.error)
        else {
            toast.success('Pakket verwijderd')
            setLocalPackages(prev => prev.filter(p => p.id !== id))
        }
    }

    const movePackage = async (id: string, direction: 'up' | 'down') => {
        const pkg = localPackages.find(p => p.id === id)
        if (!pkg) return

        const sameGroup = localPackages.filter(p => p.is_active === pkg.is_active)
        const indexInGroup = sameGroup.findIndex(p => p.id === id)
        const targetIndexInGroup = direction === 'up' ? indexInGroup - 1 : indexInGroup + 1

        if (targetIndexInGroup < 0 || targetIndexInGroup >= sameGroup.length) return

        const otherPkg = sameGroup[targetIndexInGroup]
        const fullIndex = localPackages.findIndex(p => p.id === id)
        const otherFullIndex = localPackages.findIndex(p => p.id === otherPkg.id)

        const newPkgs = [...localPackages]
        newPkgs[fullIndex] = otherPkg
        newPkgs[otherFullIndex] = pkg

        const withNewOrders = newPkgs.map((p, i) => ({ ...p, sort_order: i }))
        setLocalPackages(withNewOrders)

        setIsReordering(true)
        const result = await reorderPackages(withNewOrders.map((p, i) => ({ id: p.id, sort_order: i })))
        setIsReordering(false)
        if (result.error) toast.error(result.error)
    }

    const activePackages = localPackages.filter(p => p.is_active)
    const inactivePackages = localPackages.filter(p => !p.is_active)

    if (!isMounted) return null

    return (
        <div className="space-y-10 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-2xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 shadow-[0_0_15px_rgba(13,242,162,0.1)]">
                            <Package className="w-6 h-6 text-[#0df2a2]" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Pakket Builder</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isReordering && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-[#0df2a2]"></div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Synchroniseren...</span>
                        </div>
                    )}
                    <button
                        onClick={handleAddItem}
                        disabled={creating}
                        className="flex items-center gap-2 bg-[#0df2a2] text-black px-6 py-3 rounded-2xl font-black text-sm hover:shadow-[0_0_20px_rgba(13,242,162,0.4)] transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Plus className="w-5 h-5" />
                        {creating ? 'Toevoegen...' : 'Nieuw Pakket'}
                    </button>
                </div>
            </div>

            {/* Active Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-[#0df2a2]/10 text-[#0df2a2] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#0df2a2]/20">
                        Zichtbaar ({activePackages.length})
                    </div>
                    <div className="h-px grow bg-gradient-to-r from-[#0df2a2]/20 to-transparent"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activePackages.map((pkg, i) => (
                        <PackageCard
                            key={pkg.id}
                            pkg={pkg}
                            isFirst={i === 0}
                            isLast={i === activePackages.length - 1}
                            isDirty={!!dirtyIds[pkg.id]}
                            isSaving={!!savingIds[pkg.id]}
                            onUpdate={(updates) => handleUpdate(pkg.id, updates)}
                            onSave={() => handleSave(pkg.id)}
                            onDelete={() => handleDelete(pkg.id)}
                            onMoveUp={() => movePackage(pkg.id, 'up')}
                            onMoveDown={() => movePackage(pkg.id, 'down')}
                        />
                    ))}
                </div>
            </section>

            {/* Inactive Section */}
            {inactivePackages.length > 0 && (
                <section className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4 opacity-50">
                        <div className="px-3 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/5">
                            Inactief ({inactivePackages.length})
                        </div>
                        <div className="h-px grow bg-zinc-800"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {inactivePackages.map((pkg, i) => (
                            <PackageCard
                                key={pkg.id}
                                pkg={pkg}
                                isFirst={i === 0}
                                isLast={i === inactivePackages.length - 1}
                                isDirty={!!dirtyIds[pkg.id]}
                                isSaving={!!savingIds[pkg.id]}
                                onUpdate={(updates) => handleUpdate(pkg.id, updates)}
                                onSave={() => handleSave(pkg.id)}
                                onDelete={() => handleDelete(pkg.id)}
                                onMoveUp={() => movePackage(pkg.id, 'up')}
                                onMoveDown={() => movePackage(pkg.id, 'down')}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
