'use client'

import Link from 'next/link'

export default function UpgradeModal() {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#111] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 max-w-md w-full p-6 text-center transition-colors duration-300">
                <div className="h-16 w-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-500 text-[32px]">warning</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Objectlimiet bereikt</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Je hebt al je 3 actieve objecten in het Essential pakket gebruikt. Upgrade naar Professional om tot 15 objecten te beheren en krijg toegang tot Analytics.
                </p>
                <div className="space-y-3">
                    <Link href="/pricing" className="block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(16,183,127,0.3)] hover:shadow-[0_0_30px_rgba(16,183,127,0.5)]">
                        Upgrade naar Professional (€129/mnd)
                    </Link>
                    <Link href="/dashboard" className="block w-full text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-white transition-colors">
                        Terug naar Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
