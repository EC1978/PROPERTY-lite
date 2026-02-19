import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserPlan } from '@/utils/saas'

export default async function BillingSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const plan = await getUserPlan(supabase, user.id)

    const invoices = [
        { id: 'INV-2024-001', date: '01 Feb 2024', amount: '€ 49.00', status: 'Paid' },
        { id: 'INV-2024-002', date: '01 Jan 2024', amount: '€ 49.00', status: 'Paid' },
        { id: 'INV-2023-012', date: '01 Dec 2023', amount: '€ 49.00', status: 'Paid' },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Abonnement & Facturatie</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Beheer je abonnement en bekijk je facturen.</p>
            </div>

            {/* Current Plan */}
            <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <span className="material-symbols-outlined text-[120px] text-emerald-500">verified</span>
                </div>
                <div className="relative z-10">
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Huidig Plan</h4>
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan}</span>
                        <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-1 rounded-full border border-emerald-500/20">Actief</span>
                    </div>

                    <div className="flex gap-3">
                        {plan !== 'Elite' ? (
                            <Link href="/pricing" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                                Upgrade naar Elite
                            </Link>
                        ) : (
                            <button className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white font-semibold py-2.5 px-6 rounded-xl transition-colors">
                                Abonnement Beheren
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoices */}
            <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Recente Facturen</h4>
                <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Factuur #</th>
                                <th className="px-6 py-3 font-medium">Datum</th>
                                <th className="px-6 py-3 font-medium">Bedrag</th>
                                <th className="px-6 py-3 font-medium text-right">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Download</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{invoice.id}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{invoice.date}</td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white">{invoice.amount}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-1 rounded-full">
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">download</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
