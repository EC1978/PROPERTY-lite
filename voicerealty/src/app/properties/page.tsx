import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

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
                <div className="flex items-center gap-2">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <Link key={property.id} href={`/properties/${property.id}`} className="group block">
                                <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1">
                                    <div className="h-56 bg-gray-200 dark:bg-[#222] bg-cover bg-center relative" style={{ backgroundImage: `url(${property.image_url || '/placeholder-house.jpg'})` }}>
                                        {!property.image_url && (
                                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
                                                <span className="material-symbols-outlined text-[48px]">image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-900 dark:text-white shadow-sm border border-black/5">
                                            {property.status === 'active' ? 'Active' : property.status}
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                            <div className="bg-black/60 backdrop-blur-md text-white text-xs px-2 py-1 rounded-lg">
                                                {new Date(property.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">{property.address}</h3>
                                        <p className="text-emerald-500 font-bold mb-4">€ {property.price?.toLocaleString()}</p>

                                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/5 pt-4">
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[18px]">square_foot</span>
                                                {property.surface_area} m²
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[18px]">bed</span>
                                                {property.bedrooms || '-'}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[18px]">bathtub</span>
                                                {property.bathrooms || '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
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
