'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import ThemeToggle from '../ThemeToggle'
import { createPortal } from 'react-dom'

interface MobileMenuProps {
    userEmail?: string
}

export default function MobileMenu({ userEmail }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Close menu when pathname changes
    useEffect(() => {
        setIsOpen(false)
    }, [pathname])

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const navigation = [
        { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { href: '/properties', icon: 'real_estate_agent', label: 'Woningen' },
        { href: '/archive', icon: 'archive', label: 'Archief' },
        { href: '/leads', icon: 'groups', label: 'Leads' },
        { href: '/analytics', icon: 'monitoring', label: 'Statistieken' },
        { href: '/shop', icon: 'shopping_bag', label: 'Shop' },
        { href: '/settings', icon: 'settings', label: 'Instellingen' },
        { href: '/support', icon: 'help', label: 'Ondersteuning' },
    ]

    const menuContent = (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9999998] bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 left-0 bottom-0 z-[9999999] w-[300px] transition-transform duration-300 transform shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)] ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{
                    backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#050505' : '#ffffff',
                    opacity: 1
                }}
            >
                <div className="flex flex-col h-full relative z-[10] overflow-hidden">
                    {/* Header */}
                    <div className="p-6 pb-2 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="size-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <span className="material-symbols-outlined text-white text-[22px]">graphic_eq</span>
                            </div>
                            <span className="font-extrabold text-xl text-gray-900 dark:text-white tracking-tight">VoiceRealty</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="size-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 no-scrollbar">
                        {navigation.map((item) => {
                            const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all border ${active
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#0df2a2] font-bold border-emerald-500/20 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border-transparent'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                    <span className="text-[16px] font-bold">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-6 pt-4 border-t border-gray-100 dark:border-white/5 space-y-4 flex-shrink-0 bg-white dark:bg-[#050505]">
                        <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/10">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="size-11 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-sm ring-1 ring-gray-100 dark:ring-white/10">
                                    {(userEmail || 'D').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-extrabold text-gray-900 dark:text-white leading-tight truncate">{(userEmail || 'demo').split('@')[0]}</span>
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-black mt-0.5">Premium</span>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 font-extrabold transition-all border border-red-100 dark:border-red-500/20 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            Uitloggen
                        </button>
                    </div>
                </div>
            </div>
        </>
    )

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-[#0df2a2] transition-colors"
                aria-label="Toggle Menu"
            >
                <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
            {mounted && createPortal(menuContent, document.body)}
        </>
    )
}
