'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface Address {
    id: string;
    name: string;
    contact: string;
    street: string;
    city: string;
    zipcode: string;
    is_default: boolean;
}

export default function AddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        street: '',
        city: '',
        zipcode: '',
        is_default: false
    })
    const [isSaving, setIsSaving] = useState(false)

    const fetchAddresses = async () => {
        setIsLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data, error } = await supabase
                .from('user_addresses')
                .select('*')
                .order('created_at', { ascending: false })

            if (data) setAddresses(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchAddresses()
    }, [])

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        try {
            // If setting as default, unset others first (simplification: just one default)
            if (formData.is_default) {
                await supabase
                    .from('user_addresses')
                    .update({ is_default: false })
                    .eq('user_id', user.id)
            }

            const { error } = await supabase
                .from('user_addresses')
                .insert([{
                    ...formData,
                    user_id: user.id
                }])

            if (error) throw error

            setIsModalOpen(false)
            setFormData({ name: '', contact: '', street: '', city: '', zipcode: '', is_default: false })
            fetchAddresses()
        } catch (error) {
            console.error('Error saving address:', error)
            alert('Fout bij het opslaan van adres.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAddress = async (id: string) => {
        if (!confirm('Weet u zeker dat u dit adres wilt verwijderen?')) return

        const supabase = createClient()
        const { error } = await supabase
            .from('user_addresses')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Fout bij verwijderen.')
        } else {
            setAddresses(addresses.filter(a => a.id !== id))
        }
    }

    const filteredAddresses = addresses.filter(addr =>
        addr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
        addr.contact.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Adresboek</span>
                </div>
            </nav>

            {/* Header with Add Button */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn adressen</h1>
                    <p className="text-gray-500 text-sm font-medium">Beheer uw verzend- en factuuradressen.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#0df2a2] text-[#0A0A0A] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(13,242,162,0.3)] active:scale-95 whitespace-nowrap"
                >
                    Adres toevoegen
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-2xl">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 group-focus-within:text-[#0df2a2] transition-colors">search</span>
                </div>
                <input
                    type="text"
                    placeholder="Zoek naar naam of adres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-full pl-16 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0df2a2]/20 focus:border-[#0df2a2]/30 transition-all placeholder:text-gray-600"
                    suppressHydrationWarning
                />
            </div>

            {/* Grid of Address Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="h-64 bg-white/5 rounded-[40px] animate-pulse border border-white/5"></div>
                    ))}
                </div>
            ) : filteredAddresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAddresses.map((address) => (
                        <div
                            key={address.id}
                            className={`bg-[#1A1D1C]/20 border ${address.is_default ? 'border-[#0df2a2]/30' : 'border-white/5'} rounded-[40px] p-8 backdrop-blur-sm hover:border-[#0df2a2]/50 transition-all group relative overflow-hidden`}
                        >
                            {address.is_default && (
                                <div className="absolute top-0 right-0 py-1.5 px-6 bg-[#0df2a2] text-[#0A0A0A] text-[9px] font-black uppercase tracking-widest rounded-bl-3xl">
                                    Standaard
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`size-10 ${address.is_default ? 'bg-[#0df2a2]/10 text-[#0df2a2]' : 'bg-white/5 text-gray-500'} rounded-xl flex items-center justify-center border border-white/5`}>
                                    <span className="material-symbols-outlined text-[20px]">location_on</span>
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight group-hover:text-[#0df2a2] transition-colors">{address.name}</h3>
                            </div>

                            <div className="space-y-1.5 mb-8 pl-1">
                                <p className="text-sm font-bold text-gray-300">{address.contact}</p>
                                <p className="text-sm text-gray-500">{address.street}</p>
                                <p className="text-sm text-gray-500">{address.zipcode} {address.city}</p>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex items-center gap-6">
                                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0df2a2] hover:opacity-70 transition-opacity">
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                    Wijzig
                                </button>
                                <button
                                    onClick={() => handleDeleteAddress(address.id)}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Verwijderen
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <span className="material-symbols-outlined text-6xl text-gray-800 mb-4 block">address_book</span>
                    <p className="text-gray-500 font-bold">Geen adressen gevonden.</p>
                </div>
            )}

            {/* Add Address Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0A0A0A]/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl bg-[#1A1D1C] border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white tracking-tight underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Adres toevoegen</h2>
                            <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSaveAddress} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Naam (bv. Kantoor)</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Contactpersoon</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Straat & Huisnummer</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.street}
                                        onChange={e => setFormData({ ...formData, street: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Postcode</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.zipcode}
                                        onChange={e => setFormData({ ...formData, zipcode: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Stad</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_default: !formData.is_default })}
                                className="flex items-center gap-3 group cursor-pointer"
                            >
                                <div className={`size-6 rounded-lg border flex items-center justify-center transition-all ${formData.is_default ? 'bg-[#0df2a2] border-[#0df2a2]' : 'border-white/10 bg-white/5'}`}>
                                    {formData.is_default && <span className="material-symbols-outlined text-[#0A0A0A] text-sm font-bold">check</span>}
                                </div>
                                <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">Stel in als standaard adres</span>
                            </button>

                            <div className="pt-4">
                                <button
                                    disabled={isSaving}
                                    type="submit"
                                    className="w-full bg-[#0df2a2] text-[#0A0A0A] py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(13,242,162,0.2)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSaving ? 'Bezig met opslaan...' : 'Adres opslaan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
