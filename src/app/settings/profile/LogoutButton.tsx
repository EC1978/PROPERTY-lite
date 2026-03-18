'use client'

import { startTransition, useState } from 'react'
import { signOut } from '@/app/auth/actions'

export default function LogoutButton() {
    const [isPending, setIsPending] = useState(false)

    const handleLogout = (e: React.FormEvent) => {
        if (!confirm('Weet je zeker dat je wilt uitloggen?')) {
            e.preventDefault()
        } else {
            setIsPending(true)
        }
    }

    return (
        <form action={signOut} onSubmit={handleLogout} className="w-full sm:w-auto">
            <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-10 py-4 text-[#ef4444] hover:text-[#f87171] text-sm font-bold transition-all flex items-center justify-center gap-2 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 active:bg-red-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? (
                    <span className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></span>
                ) : (
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                )}
                {isPending ? 'Uitloggen...' : 'Account Uitloggen'}
            </button>
        </form>
    )
}
