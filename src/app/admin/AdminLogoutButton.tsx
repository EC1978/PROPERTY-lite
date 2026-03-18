'use client'

import { LogOut } from 'lucide-react'
import { signOut } from '@/app/auth/actions'

export default function AdminLogoutButton() {
    return (
        <button
            onClick={() => signOut()}
            className="flex items-center justify-center space-x-3 w-full py-3.5 px-4 bg-[#1A1A1A] text-zinc-300 font-bold rounded-xl hover:bg-[#252525] hover:text-white transition-all active:scale-95 border border-white/5"
        >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Uitloggen</span>
        </button>
    )
}
