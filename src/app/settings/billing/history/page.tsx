import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getInvoiceHistory } from '../actions'
import DownloadInvoiceButton from '../components/DownloadInvoiceButton'

export default async function InvoiceHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch all invoices
    const rawInvoices = await getInvoiceHistory()

    const shortMonths = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

    const invoices = (rawInvoices || []).map((inv) => {
        const d = new Date(inv.date)
        return {
            id: inv.invoice_number,
            date: `${String(d.getDate()).padStart(2, '0')} ${shortMonths[d.getMonth()]} ${d.getFullYear()}`,
            amount: `€ ${Number(inv.amount).toFixed(2)}`,
            status: inv.status,
            document: inv.document_type || 'Factuur',
            download_url: inv.download_url,
        }
    })

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/settings/billing" className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#0df2a2] transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Factuurhistorie</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Download al je voorgaande en huidige facturen.</p>
                    </div>
                    {/* Placeholder voor jaartal filter in de toekomst */}
                    <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-card border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2 cursor-pointer hover:border-gray-200 dark:hover:border-white/20 transition-colors">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">2024</span>
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">expand_more</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {invoices.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                        <span className="material-symbols-outlined text-3xl mb-2 block opacity-30">receipt_long</span>
                        Nog geen facturen beschikbaar.
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Factuur</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Datum</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Bedrag</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Doc. Type</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actie</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {invoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-[rgba(13,242,162,0.1)] text-[#0df2a2] flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-[16px]">receipt</span>
                                                    </div>
                                                    <span className="font-bold text-gray-900 dark:text-white">{invoice.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-gray-500 dark:text-gray-400">{invoice.date}</td>
                                            <td className="px-6 py-5 text-gray-900 dark:text-white font-bold">{invoice.amount}</td>
                                            <td className="px-6 py-5 text-gray-500 dark:text-gray-400">{invoice.document}</td>
                                            <td className="px-6 py-5">
                                                {invoice.status === 'Betaald' ? (
                                                    <span className="bg-[#0df2a2]/10 text-[#0df2a2] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#0df2a2]/20">
                                                        {invoice.status}
                                                    </span>
                                                ) : (
                                                    <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-amber-500/20">
                                                        {invoice.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right flex justify-end">
                                                <DownloadInvoiceButton invoice={invoice} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-300 hover:text-white hover:bg-[#0df2a2] transition-colors font-bold text-xs" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                            {invoices.map((invoice) => (
                                <div key={invoice.id} className="p-5 flex flex-col gap-4 hover:bg-white/5 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[rgba(13,242,162,0.1)] text-[#0df2a2] flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[20px]">receipt</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{invoice.id}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{invoice.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-gray-900 dark:text-white mb-1">{invoice.amount}</div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${invoice.status === 'Betaald' ? 'bg-[#0df2a2]/10 text-[#0df2a2] border-[#0df2a2]/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <DownloadInvoiceButton invoice={invoice} className="w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
