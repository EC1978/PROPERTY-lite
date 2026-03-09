'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import ThemeToggle from '../ThemeToggle'
import Logo from '../Logo'
import { createClient } from '@/utils/supabase/client'

interface SidebarProps {
    userEmail?: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
    const pathname = usePathname()
    const supabase = createClient()

    const [features, setFeatures] = useState({
        has_properties: true,
        has_agenda: true,
        has_leads: true,
        has_materials: true,
        has_archive: true,
        has_statistics: true,
        has_reviews: true,
        has_webshop: true,
    })

    useEffect(() => {
        async function loadFeatures() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('tenant_features')
                    .select('*')
                    .eq('user_id', user.id)
                    .single()

                if (data) {
                    setFeatures({
                        has_properties: data.has_properties ?? true,
                        has_agenda: data.has_agenda,
                        has_leads: data.has_leads,
                        has_materials: data.has_materials ?? true,
                        has_archive: data.has_archive ?? true,
                        has_statistics: data.has_statistics ?? true,
                        has_reviews: data.has_reviews ?? true,
                        has_webshop: data.has_webshop,
                    })
                }
            }
        }
        loadFeatures()
    }, [supabase])

    const NavLink = ({ href, icon, label, show = true }: { href: string, icon: string, label: string, show?: boolean }) => {
        if (!show) return null;
        const active = pathname === href
        return (
            <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-500/10 text-emerald-500' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}`}>
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
                <span className="font-medium text-sm">{label}</span>
            </Link>
        )
    }

    return (
        <aside className="hidden md:flex w-72 flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#0A0A0A] fixed inset-y-0 left-0 z-50 transition-colors duration-300">
            <div className="p-6">
                <Logo className="mb-8" />

                <div className="space-y-1">
                    <NavLink href="/dashboard" icon="dashboard" label="Dashboard" />
                    <NavLink href="/properties" icon="real_estate_agent" label="Woningen" show={features.has_properties} />
                    <NavLink href="/agenda" icon="calendar_month" label="Agenda" show={features.has_agenda} />
                    <NavLink href="/dashboard/reviews" icon="star" label="Klantbeoordelingen" show={features.has_reviews} />
                    <NavLink href="/dashboard/materialen" icon="inventory" label="Materialen" show={features.has_materials} />
                    <NavLink href="/archive" icon="archive" label="Archief" show={features.has_archive} />
                    <NavLink href="/leads" icon="groups" label="Leads" show={features.has_leads} />
                    <NavLink href="/analytics" icon="monitoring" label="Statistieken" show={features.has_statistics} />
                    <NavLink href="/shop" icon="shopping_bag" label="Shop" show={features.has_webshop} />
                    <NavLink href="/settings" icon="settings" label="Instellingen" />
                    <NavLink href="/support" icon="help" label="Ondersteuning" />
                </div>
            </div>

            <div className="mt-auto p-6 border-t border-gray-200 dark:border-white/5 space-y-4">
                <div className="flex items-center gap-2 justify-between w-full p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-500/20">
                            {userEmail?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-col hidden lg:flex">
                            <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{userEmail?.split('@')[0]}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">Premium</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <ThemeToggle />
                        <button
                            onClick={() => signOut()}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Uitloggen"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    )
}
