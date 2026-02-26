'use client'

import { useEffect, useState, useTransition } from 'react'
import { getSystemSettings, updateSystemSettings } from './actions'
import { toast, Toaster } from 'react-hot-toast'
import SubmitButton from '@/components/SubmitButton'
import { useRouter } from 'next/navigation'

export default function SystemSettingsPage() {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')

    useEffect(() => {
        async function fetchSettings() {
            try {
                const data = await getSystemSettings() as any
                if (data) {
                    setMaintenanceMode(data.maintenance_mode)
                    setStatusMessage(data.live_status_message)
                }
            } catch (error) {
                console.error("Failed to load settings", error)
                toast.error("Kan systeeminstellingen niet laden.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await updateSystemSettings(formData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Systeem instellingen opgeslagen!')
                router.refresh()
            }
        })
    }

    if (isLoading) {
        return <div className="animate-pulse flex space-x-4 p-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4"></div></div></div>
    }

    return (
        <div className="space-y-6">
            <Toaster position="bottom-center" toastOptions={{
                style: { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
            }} />

            <header className="flex flex-col gap-1 mb-8">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                        <span className="material-symbols-outlined text-xl">engineering</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Systeemonderhoud</h1>
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
                    Beheer de onderhoudsmodus van de applicatie. Als deze geactiveerd is, kunnen normale gebruikers niet meer inloggen of het dashboard bezoeken.
                </p>
            </header>

            <form action={handleSubmit} className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[50px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

                <div className="flex items-center justify-between z-10 relative">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Onderhoudsmodus activeren</h3>
                        <p className="text-sm text-slate-500 dark:text-gray-400">Plaats de volledige applicatie in tijdelijk onderhoud.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="maintenance_mode"
                            checked={maintenanceMode}
                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500 shadow-inner"></div>
                    </label>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-white/5 z-10 relative">
                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Live Status Bericht</label>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mb-3">
                        Dit bericht wordt getoond aan gebruikers die de applicatie proberen te bezoeken tijdens het onderhoud.
                    </p>
                    <textarea
                        name="live_status_message"
                        value={statusMessage}
                        onChange={(e) => setStatusMessage(e.target.value)}
                        rows={4}
                        className="w-full bg-[#F8F9FB] dark:bg-[#0A0A0A] border z-10 relative border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none shadow-inner"
                        placeholder="Voorbeeld: We voeren momenteel een belangrijke update uit. Bestemmingstijd: 14:00."
                    />
                </div>

                <div className="flex justify-end pt-4 z-10 relative">
                    <SubmitButton text="Wijzigingen Opslaan" loadingText="Opslaan..." />
                </div>
            </form>
        </div>
    )
}
