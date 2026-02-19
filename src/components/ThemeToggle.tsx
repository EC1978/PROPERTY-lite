'use client'

import { useTheme } from '@/providers/ThemeProvider'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl transition-colors hover:bg-white/10 dark:hover:bg-white/10 active:scale-95 text-gray-500 dark:text-gray-400 group"
            aria-label="Toggle Theme"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            <span className="material-symbols-outlined text-[20px] group-hover:text-emerald-500 transition-colors">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
        </button>
    )
}
