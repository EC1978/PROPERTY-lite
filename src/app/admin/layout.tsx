import Logo from '@/components/Logo'
import Link from 'next/link'
import { LayoutDashboard, Users, ShoppingCart, Settings, LogOut, Package, CreditCard, Globe, Wrench, History, AlertCircle, Mail, Server } from 'lucide-react'
import NotificationBell from '@/components/layout/NotificationBell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const defaultNavItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Landingspagina', path: '/admin/landing', icon: Globe },
        { label: 'Makelaars', path: '/admin/users', icon: Users },
        { label: 'Template Manager', path: '/admin/emails', icon: Mail },
        { label: 'SMTP Server', path: '/admin/smtp', icon: Server },
        { label: 'Pakket Builder', path: '/admin/packages', icon: CreditCard },
        { label: 'Bestellingen', path: '/admin/orders', icon: ShoppingCart },
        { label: 'Betaalmethodes', path: '/admin/payments', icon: CreditCard },
        { label: 'Reclamaties', path: '/admin/complaints', icon: AlertCircle },
        { label: 'Producten', path: '/admin/products', icon: Package },
        { label: 'Systeemonderhoud', path: '/admin/system', icon: Wrench },
        { label: 'Audit Logboek', path: '/admin/audit', icon: History },
        { label: 'Instellingen', path: '/admin/settings', icon: Settings },
    ]

    return (
        <div className="flex h-screen bg-[#0A0A0A] text-white font-sans antialiased">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0A0A0A] border-r border-[#222] flex flex-col">
                <div className="p-6">
                    <Logo isUppercase={false} textClassName="text-xl" />
                    <p className="text-[10px] text-[#10b77f] uppercase tracking-widest font-bold mt-1">Superadmin</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {defaultNavItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-[#1A1A1A] hover:text-[#0df2a2] hover:shadow-[0_0_15px_rgba(13,242,162,0.1)] transition-all group font-medium"
                        >
                            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-[#222]">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center space-x-3 w-full py-3.5 px-4 bg-[#1A1A1A] text-zinc-300 font-bold rounded-xl hover:bg-[#252525] hover:text-white transition-all active:scale-95 border border-white/5"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Afsluiten Admin</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                {/* Top Header */}
                <header className="h-16 border-b border-[#222] bg-[#0A0A0A] flex items-center justify-end px-8 shrink-0 relative z-40">
                    <NotificationBell isAdminView={true} />
                </header>

                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    )
}
