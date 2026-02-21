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
        <aside className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-1 md:gap-1 overflow-x-auto hide-scrollbar pb-4 md:pb-0 sticky top-[72px] md:top-0 z-30 bg-white dark:bg-[#050505] md:bg-transparent -mx-6 px-6 md:mx-0 md:px-0 border-b md:border-b-0 border-gray-100 dark:border-white/5">
            {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href === '/settings/profile' && pathname === '/settings')
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-2 px-4 py-3 md:py-2.5 rounded-none md:rounded-2xl transition-all font-bold text-[13px] whitespace-nowrap shrink-0 md:shrink border-b-2 md:border transition-all duration-200 ${isActive
                            ? 'bg-emerald-500/5 md:bg-white dark:md:bg-white/10 text-emerald-600 dark:text-[#0df2a2] border-emerald-500 md:border-gray-100 dark:md:border-white/10'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border-transparent'
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
