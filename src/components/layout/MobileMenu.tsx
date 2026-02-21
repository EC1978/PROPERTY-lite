'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import ThemeToggle from '../ThemeToggle'

interface MobileMenuProps {
    userEmail?: string
}

export default function MobileMenu({ userEmail }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

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

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-[#0df2a2] transition-colors"
                aria-label="Toggle Menu"
            >
                <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 left-0 bottom-0 z-[999999] w-[280px] !bg-white dark:!bg-[#0a0a0a] shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)] transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{ backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#ffffff' }}
            >
                <div className="flex flex-col h-full p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className="size-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[20px]">graphic_eq</span>
                            </div>
                            <span className="font-bold text-lg text-gray-900 dark:text-white">VoiceRealty AI</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="size-10 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-2 py-4 overflow-y-auto">
                        {navigation.map((item) => {
                            const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border ${active
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#0df2a2] font-bold border-emerald-500/20'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border-transparent'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                                    <span className="text-[15px] font-bold">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer - Fixed bottom */}
                    <div className="mt-auto pt-6 border-t border-gray-200 dark:border-white/5 space-y-4 bg-white dark:bg-[#0a0a0a]">
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white/20">
                                    {userEmail?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">{userEmail?.split('@')[0]}</span>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">Premium Account</span>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 font-bold transition-all border border-red-100 dark:border-red-500/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            Uitloggen
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
