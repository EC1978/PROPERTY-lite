'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

export default function ShopAccountSidebar() {
    const pathname = usePathname()

    const navItems = [
        { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { href: '/shop', icon: 'shopping_bag', label: 'Producten' },
        { href: '/shop/account/orders', icon: 'receipt_long', label: 'Bestellingen' },
        { href: '/shop/account/files', icon: 'upload_file', label: 'Bestanden' },
        { href: '/shop/account/open', icon: 'calendar_today', label: 'Openstaand' },
        { href: '/shop/account/quotes', icon: 'description', label: 'Offertes' },
        { href: '/shop/account/favorites', icon: 'favorite', label: 'Favorieten' },
        { href: '/shop/account/claims', icon: 'report', label: 'Reclamaties' },
    ]

    const accountItems = [
        { href: '/shop/account/profile', icon: 'person', label: 'Gegevens' },
        { href: '/shop/account/addresses', icon: 'location_on', label: 'Adresboek' },
    ]

    const NavLink = ({ href, icon, label }: { href: string, icon: string, label: string }) => {
        const active = href === '/shop'
            ? (pathname === '/shop' || pathname.startsWith('/shop/product'))
            : (pathname === href || pathname.startsWith(href + '/'))
        return (
            <Link
                href={href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active
                    ? 'bg-[#0df2a2] text-[#0A0A0A] shadow-[0_4px_15px_rgba(13,242,162,0.2)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
            >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'fill-1' : ''}`}>{icon}</span>
                <span className="font-bold text-sm tracking-tight">{label}</span>
                {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0A0A0A]"></div>
                )}
            </Link>
        )
    }

    return (
        <aside className="hidden md:flex w-72 flex-col bg-[#1A1D1C]/40 backdrop-blur-xl border-r border-white/5 fixed inset-y-0 left-0 z-50 transition-all duration-500">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-10 pl-2">
                    <div className="size-10 bg-[#0df2a2] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(13,242,162,0.3)]">
                        <span className="material-symbols-outlined text-[#0A0A0A] text-[24px]">shopping_bag</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-lg tracking-tighter text-white uppercase leading-none">Shop</span>
                        <span className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.2em]">Portal</span>
                    </div>
                </div>

                <div className="space-y-1">
                    {navItems.map((item) => (
                        <NavLink key={item.href} {...item} />
                    ))}

                    <div className="my-8 h-px bg-white/5 mx-4"></div>

                    {accountItems.map((item) => (
                        <NavLink key={item.href} {...item} />
                    ))}

                    <form action={signOut} className="w-full mt-4">
                        <button
                            type="submit"
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-300"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            <span className="font-bold text-sm tracking-tight">Uitloggen</span>
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-auto p-6">
                <Link
                    href="/shop"
                    className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95 group"
                >
                    <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Naar Catalogus
                </Link>
            </div>
        </aside>
    )
}
