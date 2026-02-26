import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getAnalyticsStats } from './actions'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MobileMenu from '@/components/layout/MobileMenu'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: stats, error } = await getAnalyticsStats()

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={user.email} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MobileMenu userEmail={user.email || undefined} />
                    <span className="font-bold text-lg tracking-tight">Statistieken</span>
                </div>
                <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-4 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 w-full min-w-0">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                            Analytics Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-sm">
                            Inzicht in je prestaties, woningen en afspraken.
                        </p>
                    </div>

                    {error ? (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl text-sm font-bold">
                            ⚠️ Fout bij het ophalen van data: {error}
                        </div>
                    ) : (
                        <AnalyticsClient stats={stats!} />
                    )}
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
