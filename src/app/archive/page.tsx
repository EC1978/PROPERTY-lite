import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function ArchivePage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'archived')
        .order('updated_at', { ascending: false })

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={user.email} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">Archief</span>
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
                            Woning Archief
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Hier vind je alle woningen die je gearchiveerd of verkocht hebt gemarkeerd.
                        </p>
                    </div>
                </div>

                {/* Properties Grid */}
                {properties && properties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {properties.map((property) => (
                            <div
                                key={property.id}
                                className="relative rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                            >
                                <Link href={`/properties/${property.id}`} className="absolute inset-0 z-0" aria-label={property.address} />
                                <div className="flex flex-col h-full">
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
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                                            <span className="material-symbols-outlined text-orange-500 text-[10px]">archive</span>
                                            <span className="text-xs font-bold text-white uppercase tracking-wider">Gearchiveerd</span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col justify-between flex-1">
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{property.address}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                                {property.city}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-base font-bold text-gray-900 dark:text-white">€{property.price?.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bekijk & De-archiveer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 border-dashed">
                        <div className="size-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-gray-400 text-[40px]">inventory_2</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Leeg Archief</h2>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            Zodra je woningen archiveert, verschijnen ze hier in een overzicht.
                        </p>
                    </div>
                )}
            </main>

            <MobileNav />
        </div>
    )
}
