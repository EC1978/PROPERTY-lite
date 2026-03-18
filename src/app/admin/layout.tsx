'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import NotificationBell from '@/components/layout/NotificationBell'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen bg-[#0A0A0A] text-white font-sans antialiased overflow-hidden">
            {/* Sidebar (handles its own mobile drawer logic) */}
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 border-b border-[#222] bg-[#0A0A0A] flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-40">
                    {/* Hamburger — visible only on mobile */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Spacer so bell always goes to the right */}
                    <div className="flex-1" />

                    <NotificationBell isAdminView={true} />
                </header>

                <div className="px-4 pb-8 lg:p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    )
}
