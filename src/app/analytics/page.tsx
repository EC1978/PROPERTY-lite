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
            <main className="flex-1 md:ml-72 p-4 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 w-full min-w-0">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                            Analytics Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px] md:text-sm">
                            Inzicht in je prestaties, leads en omzet.
                        </p>
                    </div>

                    {/* Scorecards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                            { label: 'Totale Omzet', value: '€ 124.500', change: '+12%', trend: 'up' },
                            { label: 'Nieuwe Leads', value: '48', change: '+24%', trend: 'up' },
                            { label: 'Bezichtigingen', value: '152', change: '+5%', trend: 'up' },
                            { label: 'Avg. Verkooptijd', value: '24 dagen', change: '-2 dagen', trend: 'up' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-[#111] p-5 md:p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
                                <div className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-2">{stat.value}</div>
                                <div className={`flex items-center text-[10px] md:text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    <span className="material-symbols-outlined text-[14px] md:text-[16px] mr-1">{stat.trend === 'up' ? 'trending_up' : 'trending_down'}</span>
                                    {stat.change} <span className="text-gray-400 ml-1">vs vorige maand</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Charts Area */}
                    <div className="grid lg:grid-cols-2 gap-6">
                        {/* Revenue Chart (CSS Mock) */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">Omzetontwikkeling</h3>
                                <select className="bg-gray-100 dark:bg-white/5 border-none text-[10px] rounded-xl px-4 py-2 text-gray-500 font-black uppercase tracking-wider outline-none">
                                    <option>Laatste 6 maanden</option>
                                    <option>Dit jaar</option>
                                </select>
                            </div>
                            <div className="h-48 md:h-64 flex items-end justify-between gap-1.5 md:gap-2">
                                {revenueData.map((h, i) => (
                                    <div key={i} className="w-full bg-emerald-500/10 rounded-t-xl relative group h-full">
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-[#0df2a2] rounded-t-xl transition-all duration-700 hover:brightness-110"
                                            style={{ height: `${h}%` }}
                                        ></div>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            €{h}k
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-6 text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                <span>Jan</span><span>Feb</span><span>Mrt</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span>
                            </div>
                        </div>

                        {/* Leads Chart (CSS Mock) */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">Lead Conversie</h3>
                                <button className="text-[#0df2a2] text-[10px] font-black uppercase tracking-[0.2em] hover:text-emerald-400 transition-colors">Download Rapport</button>
                            </div>
                            <div className="h-48 md:h-64 flex items-end justify-between gap-1.5 md:gap-2">
                                {leadsData.map((h, i) => (
                                    <div key={i} className="w-full bg-blue-500/10 rounded-t-xl relative group h-full">
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-xl transition-all duration-700 hover:brightness-110"
                                            style={{ height: `${h}%` }}
                                        ></div>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {h}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-6 text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                <span>Jan</span><span>Feb</span><span>Mrt</span><span>Apr</span><span>Mei</span><span>Jun</span><span>Jul</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Properties Table */}
                    <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5">
                            <h3 className="font-black text-lg text-gray-900 dark:text-white tracking-tight">Best Presterende Woningen</h3>
                        </div>
                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 border-collapse">
                                <thead className="bg-gray-50 dark:bg-white/5 text-[9px] md:text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-[0.2em]">
                                    <tr>
                                        <th className="px-6 md:px-8 py-5">Woning</th>
                                        <th className="px-6 py-5 hidden md:table-cell">Prijs</th>
                                        <th className="px-6 py-5">Status</th>
                                        <th className="px-6 md:px-8 py-5 text-right">Views</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {[
                                        { address: 'Keizersgracht 455, Amsterdam', price: '€ 1.250.000', status: 'Active', views: '1,240' },
                                        { address: 'Herenstraat 12, Utrecht', price: '€ 450.000', status: 'Under Offer', views: '980' },
                                        { address: 'Wilhelminapark 5, Haarlem', price: '€ 895.000', status: 'Sold', views: '2,450' },
                                        { address: 'Stationsweg 10, Leiden', price: '€ 325.000', status: 'Active', views: '450' },
                                    ].map((prop, i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="px-6 md:px-8 py-5">
                                                <div className="font-black text-gray-900 dark:text-white transition-colors group-hover:text-[#0df2a2] truncate max-w-[150px] md:max-w-none">
                                                    {prop.address}
                                                </div>
                                                <div className="md:hidden text-[10px] font-bold text-gray-400 mt-0.5">{prop.price}</div>
                                            </td>
                                            <td className="px-6 py-5 font-bold text-gray-500 dark:text-gray-400 hidden md:table-cell">{prop.price}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${prop.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    prop.status === 'Sold' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                                                    }`}>
                                                    {prop.status}
                                                </span>
                                            </td>
                                            <td className="px-6 md:px-8 py-5 text-right font-mono font-black text-gray-900 dark:text-white text-xs">
                                                {prop.views}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
