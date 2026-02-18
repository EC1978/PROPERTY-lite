'use client'

import React from 'react'

interface ProfileFormProps {
    userEmail?: string;
}

export default function ProfileForm({ userEmail }: ProfileFormProps) {
    return (
        <form className="space-y-6 max-w-lg">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voornaam</label>
                        <input
                            type="text"
                            defaultValue="Erdem"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Achternaam</label>
                        <input
                            type="text"
                            defaultValue=""
                            placeholder="Optioneel"
                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email Adres</label>
                    <input
                        type="email"
                        defaultValue={userEmail}
                        disabled
                        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400">Email adres kan niet worden gewijzigd.</p>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5" onClick={(e) => e.preventDefault()}>
                    Wijzigingen Opslaan
                </button>
            </div>
        </form>
    )
}
