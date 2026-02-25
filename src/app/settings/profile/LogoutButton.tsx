'use client'

export default function LogoutButton() {
    return (
        <button className="w-full sm:w-auto px-10 py-4 text-[#ef4444] hover:text-[#f87171] text-sm font-bold transition-all flex items-center justify-center gap-2 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/15 active:bg-red-500/20 active:scale-[0.98]">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Account Uitloggen
        </button>
    )
}
