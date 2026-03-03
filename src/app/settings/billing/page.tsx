import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getSubscription, getInvoices, handlePaymentMethod } from './actions'
import DownloadInvoiceButton from './components/DownloadInvoiceButton'

export default async function BillingSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch subscription
    const subscription = await getSubscription()

    // Fetch package details to get the correct name (e.g. "Essential" vs "Essential-ID")
    let planName = 'Geen Pakket'
    if (subscription?.plan) {
        const { data: pkg } = await supabase
            .from('packages')
            .select('name')
            .eq('id', subscription.plan)
            .single()
        if (pkg) planName = pkg.name
    } else {
        planName = 'Essential' // Default starting state
    }

    const plan = planName
    const status = subscription?.status || 'active'

    // Format next billing date
    let nextBillingDate = 'Niet beschikbaar'
    if (subscription?.period_end) {
        const d = new Date(subscription.period_end)
        const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
        nextBillingDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
    }

    // Fetch recent invoices (max 3)
    const invoices = await getInvoices(3)

    const formattedInvoices = (invoices || []).map((inv) => {
        const d = new Date(inv.date)
        const shortMonths = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
        return {
            id: inv.invoice_number,
            date: `${String(d.getDate()).padStart(2, '0')} ${shortMonths[d.getMonth()]} ${d.getFullYear()}`,
            amount: `€ ${Number(inv.amount).toFixed(2)}`,
            status: inv.status,
        }
    })

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Abonnement & Facturatie</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Beheer je abonnement, betaalmethodes en bekijk je facturen.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Plan */}
                <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 p-6 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <span className="material-symbols-outlined text-[120px] text-[#0df2a2]">verified</span>
                    </div>
                    <div className="relative z-10 mb-8">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Huidig Plan</h4>
                        <div className="flex items-center gap-4 mb-2">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${status === 'active' ? 'bg-[#0df2a2]/10 text-[#0df2a2] border-[#0df2a2]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                {status === 'active' ? 'Actief' : 'Inactief'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Je volgende factuur is op {nextBillingDate}.</p>
                    </div>

                    <div className="relative z-10 flex gap-3">
                        <Link href="/settings/billing/packages" className="bg-[#0df2a2] hover:bg-[#0bc081] text-black font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-[#0df2a2]/20 text-sm">
                            {plan !== 'Elite' ? 'Upgrade Plan' : 'Pakketten Bekijken'}
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 p-6 flex flex-col justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Snelle Acties</h4>
                        <div className="space-y-3">
                            <form action={handlePaymentMethod}>
                                <button type="submit" className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-[#0df2a2] transition-colors">
                                            <span className="material-symbols-outlined">credit_card</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-gray-900 dark:text-white text-sm">Betaalmethode</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Mastercard eindigend op 4242</div>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">chevron_right</span>
                                </button>
                            </form>

                            <Link href="/settings/billing/history" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:text-[#0df2a2] transition-colors">
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-900 dark:text-white text-sm">Factuurhistorie</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Bekijk en download oude facturen</div>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">chevron_right</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Invoices Preview */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Recente Facturen</h4>
                    <Link href="/settings/billing/history" className="text-xs font-bold text-[#0df2a2] hover:underline">
                        Bekijk Alles
                    </Link>
                </div>
                <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                    {formattedInvoices.length === 0 ? (
                        <div className="p-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                            <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">receipt_long</span>
                            Nog geen facturen beschikbaar.
                        </div>
                    ) : (
                        <div className="hidden md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Factuur #</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Datum</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Bedrag</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Status</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Download</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {formattedInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{invoice.id}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{invoice.date}</td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-bold">{invoice.amount}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${invoice.status === 'Betaald'
                                                    ? 'bg-[#0df2a2]/10 text-[#0df2a2] border-[#0df2a2]/20'
                                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DownloadInvoiceButton invoice={invoice} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
