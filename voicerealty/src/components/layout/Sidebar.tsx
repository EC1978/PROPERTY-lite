'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
    userEmail?: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
    const pathname = usePathname()

    const NavLink = ({ href, icon, label }: { href: string, icon: string, label: string }) => {
        const active = pathname === href
        return (
            <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-500/10 text-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
                <span className="font-medium text-sm">{label}</span>
            </Link>
        )
    }

    return (
        <aside className="hidden md:flex w-72 flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] fixed inset-y-0 left-0 z-50">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="size-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[20px]">graphic_eq</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">VoiceRealty AI</span>
                </div>

                <div className="space-y-1">
                    <NavLink href="/dashboard" icon="dashboard" label="Dashboard" />
                    <NavLink href="/properties" icon="real_estate_agent" label="Properties" />
                    <NavLink href="/leads" icon="groups" label="Leads" />
                    <NavLink href="/analytics" icon="monitoring" label="Analytics" />
                    <NavLink href="/settings" icon="settings" label="Settings" />
                    <NavLink href="/support" icon="help" label="Support" />
                </div>
            </div>

            <div className="mt-auto p-6 border-t border-gray-200 dark:border-white/5">
                <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-left">
                    <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
                        {userEmail?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{userEmail?.split('@')[0]}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">Premium Tier</div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">expand_more</span>
                </button>
            </div>
        </aside>
    )
}
