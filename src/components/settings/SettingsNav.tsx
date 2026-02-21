'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SettingsNav() {
    const pathname = usePathname()

    const navigation = [
        { name: 'Profiel & Account', href: '/settings/profile', icon: 'person' },
        { name: 'Landingspagina', href: '/settings/landing', icon: 'web' },
        { name: 'Voice AI Config', href: '/settings/voice', icon: 'graphic_eq' },
        { name: 'Abonnement & Facturatie', href: '/settings/billing', icon: 'credit_card' },
        { name: 'Team Beheer', href: '/settings/team', icon: 'group' },
    ]

    return (
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-1 md:gap-1 mb-6 md:mb-0">
            <div className="md:hidden text-[10px] font-black uppercase tracking-widest text-[#0df2a2] mb-1 px-2">Instellingen Menu</div>
            {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href === '/settings/profile' && pathname === '/settings')
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm border transition-all duration-200 ${isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#0df2a2] border-emerald-500/20 shadow-sm'
                            : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill-current' : ''}`}>{item.icon}</span>
                        {item.name}
                    </Link>
                )
            })}
        </aside>
    )
}
