import { LayoutDashboard, Users, ShoppingCart, TrendingUp, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
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
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0df2a2]/30 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Users className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Users className="w-5 h-5 text-[#0df2a2]" />
                            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Totaal Makelaars</h3>
                        </div>
                        <p className="text-4xl font-black text-white">24</p>
                    </div>
                </div>

                <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0df2a2]/30 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <ShoppingCart className="w-5 h-5 text-[#0df2a2]" />
                            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Actieve Bestellingen</h3>
                        </div>
                        <p className="text-4xl font-black text-white">12</p>
                    </div>
                </div>

                <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-[#0df2a2]/30 transition-colors">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-24 h-24 text-[#0df2a2]" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-[#0df2a2]" />
                            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Platform Omzet (Maand)</h3>
                        </div>
                        <p className="text-4xl font-black text-[#0df2a2]">€ 4.250</p>
                    </div>
                </div>
            </div>

            <div className="px-5">
                <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 p-6 rounded-3xl">
                    <div className="flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-zinc-500" />
                        <h3 className="text-lg font-bold text-white">Recente Activiteit</h3>
                    </div>

                    <div className="py-8 text-center border border-dashed border-zinc-800 rounded-2xl bg-[#111]">
                        <p className="text-zinc-500 font-medium">Deze sectie wordt later gevuld met live audit logs vanuit Supabase.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
