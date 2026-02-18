'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-safe pt-2 px-6 z-50 flex items-center justify-between h-[80px]">
            <Link href="/dashboard" className={`flex flex-col items-center gap-1 group ${pathname === '/dashboard' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
                <span className={`material-symbols-outlined text-[24px] ${pathname === '/dashboard' ? 'text-emerald-500' : 'text-white'} group-hover:scale-110 transition-transform`}>dashboard</span>
                <span className="text-[10px] text-white font-medium">Home</span>
            </Link>
            <Link href="/leads" className={`flex flex-col items-center gap-1 group ${pathname === '/leads' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
                <span className={`material-symbols-outlined text-[24px] ${pathname === '/leads' ? 'text-emerald-500' : 'text-white'} group-hover:scale-110 transition-transform`}>groups</span>
                <span className="text-[10px] text-white font-medium">Leads</span>
            </Link>
            <Link href="/properties/new" className="flex flex-col items-center -mt-8">
                <div className="size-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 transform hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[28px] text-white">add</span>
                </div>
            </Link>
            <Link href="/analytics" className={`flex flex-col items-center gap-1 group ${pathname === '/analytics' ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
                <span className={`material-symbols-outlined text-[24px] ${pathname === '/analytics' ? 'text-emerald-500' : 'text-white'} group-hover:scale-110 transition-transform`}>monitoring</span>
                <span className="text-[10px] text-white font-medium">Analytics</span>
            </Link>
            <Link href="/settings" className={`flex flex-col items-center gap-1 group ${pathname?.startsWith('/settings') ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}>
                <span className={`material-symbols-outlined text-[24px] ${pathname?.startsWith('/settings') ? 'text-emerald-500' : 'text-white'} group-hover:scale-110 transition-transform`}>settings</span>
                <span className="text-[10px] text-white font-medium">Instellingen</span>
            </Link>
        </nav>
    )
}
