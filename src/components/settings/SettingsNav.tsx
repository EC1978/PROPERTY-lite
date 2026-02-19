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
        <aside className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 md:gap-1 overflow-x-auto hide-scrollbar pb-2 md:pb-0 sticky top-20 md:top-0 z-30 bg-[#F8F9FB] dark:bg-[#050505] md:bg-transparent md:static">
            {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href === '/settings/profile' && pathname === '/settings')
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 md:py-2.5 rounded-xl transition-all font-medium text-sm whitespace-nowrap shrink-0 md:shrink border md:border-transparent ${isActive
                            ? 'bg-white md:bg-emerald-500/10 text-emerald-600 md:text-emerald-500 shadow-sm md:shadow-[0_0_20px_rgba(16,185,129,0.1)] border-gray-100 md:border-transparent'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border-transparent'
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
