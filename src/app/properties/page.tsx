import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MobileMenu from '@/components/layout/MobileMenu'

export default async function PropertiesIndexPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={user.email} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MobileMenu userEmail={user.email || undefined} />
                    <span className="font-bold text-lg tracking-tight">Woningoverzicht</span>
                </div>
                <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-6 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            Woningoverzicht
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Beheer je actieve en gearchiveerde woningen.
                        </p>
                    </div>
                    <Link href="/properties/new" className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-transform active:scale-95">
                        <span className="material-symbols-outlined">add</span>
                        Woning Toevoegen
                    </Link>
                </div>

                {/* Stats Row (Mock Data for Visuals) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Totaal Aanbod</p>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{properties?.length || 0}</div>
                    </div>
                    <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Totale Waarde</p>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            € {(properties?.reduce((acc, curr) => acc + (curr.price || 0), 0) || 0).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Properties Grid */}
                {properties && properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {properties.map((property) => (
                            <div
                                key={property.id}
                                className="relative rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Stretched overlay link for the whole card */}
                                <Link href={`/properties/${property.id}`} className="absolute inset-0 z-0" aria-label={property.address} />
                                <div className="flex flex-col h-full">
                                    {/* Image */}
                                    <div className="h-44 relative bg-gray-100 dark:bg-white/5">
                                        {property.image_url ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center"
                                                style={{ backgroundImage: `url("${property.image_url}")` }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[48px]">image</span>
                                            </div>
                                        )}
                                        {/* Status Badge */}
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                                            <span className="material-symbols-outlined text-[#0df2a2] text-[10px] animate-pulse">fiber_manual_record</span>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                                {property.status === 'active' ? 'Actief' : property.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-5 flex flex-col justify-between flex-1">
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{property.address}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                {property.city || 'Den Haag'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-4 mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Prijs</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">€{property.price?.toLocaleString()}</span>
                                                </div>
                                                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider">Status</span>
                                                    <span className="text-base font-bold text-[#0df2a2]">
                                                        {property.status === 'active' ? 'Actief' : property.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/properties/${property.id}/ready`}
                                            className="relative z-10 w-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 group/qr border border-transparent hover:border-[#0df2a2]/50"
                                        >
                                            <span className="material-symbols-outlined text-[20px] text-[#0df2a2] group-hover/qr:scale-110 transition-transform">qr_code_2</span>
                                            <span>QR-code downloaden</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 border-dashed">
                        <div className="size-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-gray-400 text-[40px]">add_home_work</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Nog geen woningen</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                            Start met het bouwen van je portfolio. Voeg je eerste woning toe om AI-functies te ontgrendelen.
                        </p>
                        <Link href="/properties/new" className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2">
                            <span className="material-symbols-outlined">upload_file</span>
                            Upload Woning PDF
                        </Link>
                    </div>
                )}
            </main>

            <MobileNav />
        </div>
    )
}
