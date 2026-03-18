'use client'

import { useEffect } from 'react'
import Logo from '@/components/Logo'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, ShoppingCart, Settings, Package,
    CreditCard, Globe, Wrench, History, AlertCircle, Mail, Server, X
} from 'lucide-react'
import AdminLogoutButton from './AdminLogoutButton'

const navGroups = [
    {
        title: 'Overzicht',
        items: [
            { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
            { label: 'Makelaars', path: '/admin/users', icon: Users },
            { label: 'Landingspagina', path: '/admin/landing', icon: Globe },
        ]
    },
    {
        title: 'Verkoop & Shop',
        items: [
            { label: 'Bestellingen', path: '/admin/orders', icon: ShoppingCart },
            { label: 'Producten', path: '/admin/products', icon: Package },
            { label: 'Betaalmethodes', path: '/admin/payments', icon: CreditCard },
            { label: 'Reclamaties', path: '/admin/complaints', icon: AlertCircle },
        ]
    },
    {
        title: 'Communicatie',
        items: [
            { label: 'Template Manager', path: '/admin/emails', icon: Mail },
            { label: 'SMTP Server', path: '/admin/smtp', icon: Server },
        ]
    },
    {
        title: 'Beheer & Systeem',
        items: [
            { label: 'Pakket Builder', path: '/admin/packages', icon: CreditCard },
            { label: 'Systeemonderhoud', path: '/admin/system', icon: Wrench },
            { label: 'Audit Logboek', path: '/admin/audit', icon: History },
            { label: 'Instellingen', path: '/admin/settings', icon: Settings },
        ]
    }
]

interface AdminSidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname()

    // Close sidebar on route change (mobile)
    useEffect(() => {
        onClose()
    }, [pathname])

    // Lock body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={`
                    fixed top-0 left-0 z-50 h-full w-72 bg-[#0A0A0A] border-r border-[#222] flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    lg:relative lg:translate-x-0 lg:w-64 lg:z-auto lg:flex-shrink-0
                `}
            >
                {/* Logo + close button */}
                <div className="p-6 flex items-center justify-between">
                    <div>
                        <Logo isUppercase={false} textClassName="text-xl" />
                        <p className="text-[10px] text-[#10b77f] uppercase tracking-widest font-bold mt-1">Superadmin</p>
                    </div>
                    {/* Close button – only visible on mobile */}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Sluit menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 space-y-8 mt-2 overflow-y-auto pb-10 custom-scrollbar">
                    {navGroups.map((group) => (
                        <div key={group.title} className="space-y-2">
                            <h3 className="px-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path))
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all group font-medium min-h-[44px]
                                                ${isActive
                                                    ? 'bg-[#0df2a2]/10 text-[#0df2a2] shadow-[0_0_15px_rgba(13,242,162,0.08)] border border-[#0df2a2]/20'
                                                    : 'text-zinc-400 hover:bg-[#1A1A1A] hover:text-[#0df2a2] hover:shadow-[0_0_15px_rgba(13,242,162,0.1)] border border-transparent'
                                                }`}
                                        >
                                            <item.icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
                                            <span className="text-xs">{item.label}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-[#222]">
                    <AdminLogoutButton />
                </div>
            </aside>
        </>
    )
}
