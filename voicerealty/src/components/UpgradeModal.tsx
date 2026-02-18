'use client'

import Link from 'next/link'

export default function UpgradeModal() {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center">
                <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-red-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Objectlimiet bereikt</h2>
                <p className="text-gray-600 mb-6">
                    Je hebt al je 3 actieve objecten in het Essential pakket gebruikt. Upgrade naar Professional om tot 15 objecten te beheren en krijg toegang tot Analytics.
                </p>
                <div className="space-y-3">
                    <button disabled className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors opacity-50 cursor-not-allowed">
                        Upgrade naar Professional (€129/mnd)
                    </button>
                    <Link href="/dashboard" className="block w-full text-gray-500 font-medium hover:text-gray-700">
                        Terug naar Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
