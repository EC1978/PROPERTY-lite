import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MobileMenu from '@/components/layout/MobileMenu'

export default async function AnalyticsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Mock Data for Charts
    const revenueData = [40, 65, 45, 80, 55, 90, 70]
    const leadsData = [20, 35, 25, 45, 30, 55, 40]

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={user.email} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MobileMenu userEmail={user.email || undefined} />
                    <span className="font-bold text-lg tracking-tight">Kantoor Statistieken</span>
                </div>
                <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-6 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 max-w-7xl mx-auto space-y-8">

                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        Analytics Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Inzicht in je prestaties, leads en omzet.
                    </p>
                </div>

                {/* Scorecards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Totale Omzet', value: '€ 124.500', change: '+12%', trend: 'up' },
                        { label: 'Nieuwe Leads', value: '48', change: '+24%', trend: 'up' },
                        { label: 'Bezichtigingen', value: '152', change: '+5%', trend: 'up' },
                        { label: 'Avg. Verkooptijd', value: '24 dagen', change: '-2 dagen', trend: 'up' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{stat.label}</p>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                            <div className={`flex items-center text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                <span className="material-symbols-outlined text-[16px] mr-1">{stat.trend === 'up' ? 'trending_up' : 'trending_down'}</span>
                                {stat.change} vs vorige maand
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Revenue Chart (CSS Mock) */}
                    <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Omzetontwikkeling</h3>
                            <select className="bg-gray-100 dark:bg-white/5 border-none text-xs rounded-lg px-3 py-1 text-gray-500 font-bold">
                                <option>Laatste 6 maanden</option>
                                <option>Dit jaar</option>
                            </select>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {revenueData.map((h, i) => (
                                <div key={i} className="w-full bg-emerald-500/10 rounded-t-xl relative group">
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-t-xl transition-all duration-500 hover:bg-emerald-400"
                                        style={{ height: `${h}%` }}
                                    ></div>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        €{h}k
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs text-gray-400 font-bold uppercase">
                            <span>Jan</span><span>Feb</span><span>Mrt</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span>
                        </div>
                    </div>

                    {/* Leads Chart (CSS Mock) */}
                    <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Lead Conversie</h3>
                            <button className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Download Rapport</button>
                        </div>
                        <div className="h-64 flex items-end justify-between gap-2">
                            {leadsData.map((h, i) => (
                                <div key={i} className="w-full bg-blue-500/10 rounded-t-xl relative group">
                                    <div
                                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-xl transition-all duration-500 hover:bg-blue-400"
                                        style={{ height: `${h}%` }}
                                    ></div>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs text-gray-400 font-bold uppercase">
                            <span>Jan</span><span>Feb</span><span>Mrt</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span>
                        </div>
                    </div>
                </div>

                {/* Top Properties Table */}
                <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-white/5">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Best Presterende Woningen</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">Woning</th>
                                    <th className="px-6 py-4">Prijs</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Views</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                {[
                                    { address: 'Keizersgracht 455, Amsterdam', price: '€ 1.250.000', status: 'Active', views: '1,240' },
                                    { address: 'Herenstraat 12, Utrecht', price: '€ 450.000', status: 'Under Offer', views: '980' },
                                    { address: 'Wilhelminapark 5, Haarlem', price: '€ 895.000', status: 'Sold', views: '2,450' },
                                    { address: 'Stationsweg 10, Leiden', price: '€ 325.000', status: 'Active', views: '450' },
                                ].map((prop, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{prop.address}</td>
                                        <td className="px-6 py-4">{prop.price}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${prop.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                                prop.status === 'Sold' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {prop.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-900 dark:text-white">{prop.views}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>

            <MobileNav />
        </div>
    )
}
