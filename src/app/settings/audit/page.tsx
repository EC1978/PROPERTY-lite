'use client'

import { useEffect, useState } from 'react'
import { getAuditLogs } from './actions'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { toast, Toaster } from 'react-hot-toast'

export const dynamic = 'force-dynamic'

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchLogs() {
            try {
                const result = await getAuditLogs()
                if (result.error) {
                    setError(result.error)
                } else {
                    setLogs(result.logs || [])
                }
            } catch (err) {
                console.error("Failed to fetch logs", err)
                setError("Kan audit logs niet laden.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchLogs()
    }, [])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-3xl">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 mb-4">
                    <span className="material-symbols-outlined">error</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Toegang Geweigerd</h3>
                <p className="text-slate-500 dark:text-gray-400">{error}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
            <Toaster position="bottom-center" toastOptions={{
                style: { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
            }} />

            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-500">
                        <span className="material-symbols-outlined text-xl">history</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Audit Logboek</h1>
                </div>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
                    Beveiligd logboek van beheerderacties en systeemwijzigingen.
                </p>
            </header>

            <div className="mt-4 border border-gray-100 dark:border-white/5 rounded-2xl overflow-hidden bg-gray-50/30 dark:bg-black/10">
                {logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-800/50 mb-4 border border-gray-100 dark:border-white/5">
                            <span className="material-symbols-outlined text-3xl text-gray-400">history_toggle_off</span>
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Geen logs gevonden</h3>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Er zijn nog geen beheerderacties geregistreerd in het systeem.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
                        <table className="w-full text-sm text-left border-collapse min-w-[700px]">
                            <thead className="text-[10px] text-slate-500 dark:text-gray-400 bg-gray-100/50 dark:bg-white/[0.03] uppercase tracking-widest font-bold">
                                <tr>
                                    <th scope="col" className="px-5 py-3 border-b border-gray-100 dark:border-white/5">Tijdstip</th>
                                    <th scope="col" className="px-5 py-3 border-b border-gray-100 dark:border-white/5">Beheerder</th>
                                    <th scope="col" className="px-5 py-3 border-b border-gray-100 dark:border-white/5">Actie</th>
                                    <th scope="col" className="px-5 py-3 border-b border-gray-100 dark:border-white/5">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5 shadow-sm">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white dark:hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-5 py-4 whitespace-nowrap text-slate-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-emerald-500/50">schedule</span>
                                                <span className="text-[12px]">{format(new Date(log.created_at), "d MMM yyyy, HH:mm", { locale: nl })}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="px-2 py-0.5 inline-flex rounded-lg text-xs font-semibold bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                                                {log.admin_email}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="font-bold text-[12px] text-slate-900 dark:text-white uppercase">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 min-w-[200px]">
                                            <div className="font-mono text-[10px] text-slate-500 dark:text-gray-500 break-all bg-gray-100 dark:bg-black/20 p-2 rounded-lg border border-gray-200/50 dark:border-white/5 line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                                                {JSON.stringify(log.details)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
