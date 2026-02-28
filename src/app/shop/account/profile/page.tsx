'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function getUser() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            setIsLoading(false)
        }
        getUser()
    }, [])

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Gegevens</span>
                </div>
            </nav>

            {/* Page Title */}
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn gegevens</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Form Section */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-[#1A1D1C]/20 border border-white/5 rounded-[40px] p-8 md:p-10 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="size-10 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center border border-[#0df2a2]/20">
                                <span className="material-symbols-outlined text-[#0df2a2] text-[20px]">person</span>
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight">Persoonlijke gegevens</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Voornaam</label>
                                <input
                                    type="text"
                                    defaultValue={user?.user_metadata?.first_name || 'Erdem'}
                                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all shadow-inner"
                                    suppressHydrationWarning
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Achternaam</label>
                                <input
                                    type="text"
                                    defaultValue={user?.user_metadata?.last_name || 'Celik'}
                                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all shadow-inner"
                                    suppressHydrationWarning
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">E-mailadres</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        value={user?.email || 'info@prestigebv.nl'}
                                        disabled
                                        className="w-full h-14 bg-white/[0.02] border border-white/5 rounded-2xl px-6 text-sm font-bold text-gray-500 cursor-not-allowed pr-14"
                                        suppressHydrationWarning
                                    />
                                    <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 text-[18px]">lock</span>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Telefoonnummer</label>
                                <div className="flex gap-3">
                                    <div className="h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-4 flex items-center gap-2 min-w-[100px] justify-center text-sm font-bold text-white">
                                        <span className="text-xl">🇳🇱</span>
                                        <span>+31</span>
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="Telefoonnummer"
                                        className="flex-1 h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all shadow-inner"
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Bedrijfsnaam</label>
                                <input
                                    type="text"
                                    defaultValue="Prestige Design"
                                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all shadow-inner"
                                    suppressHydrationWarning
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">KvK-nummer</label>
                                <input
                                    type="text"
                                    placeholder="KvK-nummer"
                                    className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all shadow-inner"
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>

                        <div className="mt-12 flex justify-end">
                            <button className="bg-[#0df2a2] text-[#0A0A0A] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(13,242,162,0.3)] active:scale-95">
                                Wijzigingen opslaan
                            </button>
                        </div>
                    </section>

                    <section className="bg-[#1A1D1C]/20 border border-white/5 rounded-[40px] p-8 md:p-10 backdrop-blur-sm shadow-2xl group">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="size-10 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20">
                                <span className="material-symbols-outlined text-yellow-500 text-[20px]">lock_reset</span>
                            </div>
                            <h2 className="text-xl font-black text-white tracking-tight">Wachtwoord veranderen</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Huidig wachtwoord</label>
                                <input type="password" placeholder="••••••••••••" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all shadow-inner" suppressHydrationWarning />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-4">Nieuw wachtwoord</label>
                                <input type="password" placeholder="••••••••••••" className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 text-sm font-bold text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all shadow-inner" suppressHydrationWarning />
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95">
                                Wachtwoord updaten
                            </button>
                        </div>
                    </section>
                </div>

                {/* Sidebar Section */}
                <div className="space-y-8">
                    {/* Profielfoto */}
                    <section className="bg-[#1A1D1C]/20 border border-white/5 rounded-[40px] p-8 backdrop-blur-sm shadow-2xl text-center flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-8 self-start">
                            <div className="size-8 bg-[#0df2a2]/10 rounded-lg flex items-center justify-center border border-[#0df2a2]/20">
                                <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">photo_camera</span>
                            </div>
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Profielfoto</h2>
                        </div>

                        <div className="size-32 bg-white/5 border border-white/10 rounded-[32px] mb-8 flex items-center justify-center group overflow-hidden relative">
                            <span className="material-symbols-outlined text-gray-800 text-[48px] group-hover:scale-110 transition-transform duration-700">person</span>
                            <div className="absolute inset-0 bg-[#0A0A0A]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#0df2a2] cursor-pointer">
                                <span className="material-symbols-outlined text-[32px]">upload</span>
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-500 font-medium mb-8 max-w-[200px]">Gebruik een vierkante afbeelding voor het beste resultaat.</p>

                        <button className="w-full py-4 rounded-2xl border border-[#0df2a2]/30 text-[#0df2a2] hover:bg-[#0df2a2] hover:text-[#0A0A0A] transition-all text-[10px] font-black uppercase tracking-widest active:scale-95">
                            Nieuwe foto uploaden
                        </button>
                    </section>

                    {/* Danger Zone */}
                    <section className="bg-red-500/5 border border-red-500/10 rounded-[40px] p-8 backdrop-blur-sm shadow-2xl group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 text-red-500">
                                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                            </div>
                            <h2 className="text-xl font-black text-red-500 tracking-tight">Account verwijderen</h2>
                        </div>
                        <p className="text-[11px] text-red-500/60 font-medium mb-8">Let op: deze actie kan niet ongedaan worden gemaakt. Al uw data wordt permanent verwijderd.</p>

                        <button className="w-full py-4 rounded-2xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95">
                            Account verwijderen
                        </button>
                    </section>
                </div>
            </div>
        </div>
    )
}
