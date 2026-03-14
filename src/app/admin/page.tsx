import { LayoutDashboard, Users, ShoppingCart, TrendingUp, Activity, ArrowRight } from 'lucide-react'
import { getAdminStats } from './actions'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'

export default async function AdminDashboardPage() {
    const stats = await getAdminStats()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <header className="py-4 flex flex-col gap-4 sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-lg rounded-xl border-b border-[#222]">
                <div className="px-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-[#0df2a2] to-emerald-900 text-[#0A0A0A]">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-white">Superadmin Dashboard</h1>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Platform Overzicht</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 px-5">
                <Link href="/admin/users" className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0df2a2]/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#0df2a2]" />
                                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Totaal Makelaars</h3>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#0df2a2] transition-colors" />
                        </div>
                        <p className="text-4xl font-black text-white">{stats.totalBrokers}</p>
                    </div>
                </Link>

                <Link href="/admin/orders" className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0df2a2]/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-[#0df2a2]" />
                                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Actieve Bestellingen</h3>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#0df2a2] transition-colors" />
                        </div>
                        <p className="text-4xl font-black text-white">{stats.activeOrders}</p>
                    </div>
                </Link>

                <Link href="/admin/payments" className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0df2a2]/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-24 h-24 text-[#0df2a2]" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#0df2a2]" />
                                <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Platform Omzet (Maand)</h3>
                            </div>
                            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-[#0df2a2] transition-colors" />
                        </div>
                        <p className="text-4xl font-black text-[#0df2a2]">{formatCurrency(stats.monthlyRevenue)}</p>
                    </div>
                </Link>
            </div>

            <div className="px-5">
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#0df2a2]" />
                            <h3 className="text-lg font-bold text-white">Recente Activiteit</h3>
                        </div>
                        <Link href="/admin/audit" className="text-xs text-[#0df2a2] hover:underline font-bold uppercase tracking-widest flex items-center gap-1">
                            Alle logs bekijken <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 rounded-lg bg-[#0df2a2]/10 text-[#0df2a2]">
                                            <Activity className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{log.action}</p>
                                            <p className="text-xs text-zinc-500 italic">
                                                {log.admin_email} 
                                                {log.details?.orderId && ` • Order: ${log.details.orderId.substring(0, 8)}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-400 font-medium">
                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: nl })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-[#111]">
                                <p className="text-zinc-500 font-medium">Geen recente activiteit gevonden.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}


