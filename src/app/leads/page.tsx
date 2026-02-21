import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MobileMenu from '@/components/layout/MobileMenu'
import LeadsBoard from '@/components/leads/LeadsBoard'

export default async function LeadsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={user.email} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MobileMenu userEmail={user.email || undefined} />
                    <span className="font-bold text-lg tracking-tight">Leads Inbox</span>
                </div>
                <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-6 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 max-w-7xl mx-auto space-y-8">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            Team Inbox
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Beheer inkomende leads en wijs ze toe aan je team.
                        </p>
                    </div>
                </div>

                <LeadsBoard />

            </main>

            <MobileNav />
        </div>
    )
}
