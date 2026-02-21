'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-slate-900/90 dark:bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 flex items-center justify-around px-2">
            <Link href="/dashboard" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
                <div className="relative p-1">
                    <span className={`material-symbols-outlined text-[24px] ${pathname === '/dashboard' ? 'text-[#0df2a2]' : 'text-gray-400'} group-hover:scale-110 transition-transform`}>dashboard</span>
                    {pathname === '/dashboard' && (
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0df2a2] rounded-full" />
                    )}
                </div>
                <span className={`text-[10px] font-medium ${pathname === '/dashboard' ? 'text-white' : 'text-gray-400'}`}>Home</span>
            </Link>
            <Link href="/leads" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
                <div className="relative p-1">
                    <span className={`material-symbols-outlined text-[24px] ${pathname === '/leads' ? 'text-[#0df2a2]' : 'text-gray-400'} group-hover:text-white transition-colors`}>groups</span>
                </div>
                <span className={`text-[10px] font-medium ${pathname === '/leads' ? 'text-white' : 'text-gray-400'} group-hover:text-white transition-colors`}>Leads</span>
            </Link>
            <Link href="/shop" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
                <div className="relative p-1">
                    <span className={`material-symbols-outlined text-[24px] ${pathname === '/shop' ? 'text-[#0df2a2]' : 'text-gray-400'} group-hover:text-white transition-colors`}>shopping_bag</span>
                </div>
                <span className={`text-[10px] font-medium ${pathname === '/shop' ? 'text-white' : 'text-gray-400'} group-hover:text-white transition-colors`}>Shop</span>
            </Link>
            <Link href="/settings" className="flex flex-col items-center justify-center w-full h-full gap-1 group">
                <div className="relative p-1">
                    <span className={`material-symbols-outlined text-[24px] ${pathname?.startsWith('/settings') ? 'text-[#0df2a2]' : 'text-gray-400'} group-hover:text-white transition-colors`}>settings</span>
                </div>
                <span className={`text-[10px] font-medium ${pathname?.startsWith('/settings') ? 'text-white' : 'text-gray-400'} group-hover:text-white transition-colors`}>Instellingen</span>
            </Link>
        </nav>
    )
}
