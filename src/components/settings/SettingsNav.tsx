'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SettingsNavProps {
    isSuperadmin?: boolean
}

interface NavItem {
    name: string
    href: string
    icon: string
}

interface NavGroup {
    label: string
    items: NavItem[]
    adminOnly?: boolean
}

export default function SettingsNav({ isSuperadmin = false }: SettingsNavProps) {
    const pathname = usePathname()

    const groups: NavGroup[] = [
        {
            label: 'Mijn Account',
            items: [
                { name: 'Profiel & Account', href: '/settings/profile', icon: 'person' },
                { name: 'Abonnement & Facturatie', href: '/settings/billing', icon: 'credit_card' },
                { name: 'Notificaties', href: '/settings/notifications', icon: 'notifications' },
            ],
        },
        {
            label: 'Kantoorinstellingen',
            items: [
                { name: 'Team Beheer', href: '/settings/team', icon: 'group' },
                { name: 'Geautomatiseerde E-mails', href: '/settings/emails', icon: 'mail' },
            ],
        },
        {
            label: 'Koppelingen & AI',
            items: [
                { name: 'Voice AI Config', href: '/settings/voice', icon: 'graphic_eq' },
                { name: 'Integraties', href: '/settings/integrations', icon: 'extension' },
            ],
        },
        {
            label: 'Superadmin',
            adminOnly: true,
            items: [
                { name: 'Systeemonderhoud', href: '/settings/system', icon: 'build_circle' },
                { name: 'Audit Logboek', href: '/settings/audit', icon: 'history' },
            ],
        },
    ]

    const visibleGroups = groups.filter(g => !g.adminOnly || isSuperadmin)

    return (
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4 sticky top-[72px] md:top-0 z-30">
            {/* Horizontal scroll on mobile */}
            <div className="flex md:hidden gap-2 overflow-x-auto hide-scrollbar pb-3">
                {visibleGroups.flatMap(g => g.items).map((item) => {
                    const isActive = pathname === item.href || (item.href === '/settings/profile' && pathname === '/settings')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all font-bold text-[12px] whitespace-nowrap shrink-0 border duration-200 ${isActive
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </div>

            {/* Grouped vertical list on desktop */}
            <div className="hidden md:flex flex-col gap-5">
                {visibleGroups.map((group) => (
                    <div key={group.label}>
                        <p className={`text-[10px] uppercase tracking-widest font-black px-3 mb-1.5 ${group.adminOnly ? 'text-[#0df2a2]' : 'text-gray-400 dark:text-gray-600'}`}>
                            {group.adminOnly && <span className="mr-1">⚡</span>}
                            {group.label}
                        </p>
                        <div className="flex flex-col gap-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.href === '/settings/profile' && pathname === '/settings')
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold text-[13px] border duration-200 ${isActive
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm'
                                            : group.adminOnly
                                                ? 'bg-[#0df2a2]/5 text-[#0df2a2]/70 border-[#0df2a2]/10 hover:bg-[#0df2a2]/10 hover:text-[#0df2a2]'
                                                : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                        <span>{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    )
}
