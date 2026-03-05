import { getSystemSettings } from '@/app/admin/system/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
    // Haal de live status message op
    const settings = await getSystemSettings()
    const message = settings?.live_status_message || 'Alle systemen operationeel'

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-[#050505] p-6 text-slate-900 dark:text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            <div className="max-w-md w-full text-center space-y-8 relative z-10">

                {/* Icon Container */}
                <div className="mx-auto size-24 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/10 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-3xl animate-pulse" />
                    <span className="material-symbols-outlined text-5xl text-emerald-500 relative z-10">engineering</span>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                        We zijn bezig met <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">onderhoud</span>
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 text-lg">
                        VoiceRealty is momenteel niet bereikbaar wegens gepland systeemonderhoud. We zijn snel weer online.
                    </p>
                </div>

                {/* Status Box */}
                <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl shadow-black/5 text-left">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        <h2 className="font-bold text-sm tracking-widest uppercase text-slate-700 dark:text-gray-300">Live Status</h2>
                    </div>
                    <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>

                {/* Footer Link */}
                <div className="pt-8">
                    <Link href="https://voicerealty.nl/contact" className="text-sm text-slate-400 hover:text-emerald-500 font-medium transition-colors">
                        Heb je dringend hulp nodig? Neem contact op.
                    </Link>
                </div>

            </div>
        </div>
    )
}
