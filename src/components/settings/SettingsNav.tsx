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
        <aside className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto hide-scrollbar pb-3 md:pb-0 sticky top-[72px] md:top-0 z-30 bg-[#F8F9FB] dark:bg-[#050505] md:bg-transparent px-0 md:px-0 scroll-smooth">
            {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href === '/settings/profile' && pathname === '/settings')
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-6 py-3 rounded-full md:rounded-2xl transition-all font-bold text-[13px] whitespace-nowrap shrink-0 border duration-200 ${isActive
                            ? 'bg-emerald-500 text-white md:bg-emerald-500/10 md:text-emerald-500 border-emerald-500 md:border-emerald-500/20 shadow-lg shadow-emerald-500/20'
                            : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                        <span>{item.name}</span>
                    </Link>
                )
            })}
        </aside>
    )
}
