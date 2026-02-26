'use client'

import { useTheme } from '@/providers/ThemeProvider'

export default function PreferencesSettings() {
    const { theme, toggleTheme } = useTheme()

    return (
        <div className="bg-[#0A0A0A] dark:bg-[#161616]/60 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-lg">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0df2a2]">tune</span>
                    Voorkeuren
                </h3>
            </div>
            <div className="flex flex-col divide-y divide-white/5">
                <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 cursor-default">
                        <span className="material-symbols-outlined text-gray-500 text-[20px]">language</span>
                        <span className="text-sm font-semibold text-white">Taal</span>
                    </div>
                    <select className="bg-[#0A0A0A] border border-white/10 text-white hover:border-white/20 text-xs rounded-xl focus:ring-[#0df2a2] focus:border-[#0df2a2] transition-colors block py-2 px-3 outline-none cursor-pointer pr-8 shadow-sm">
                        <option value="nl">Nederlands</option>
                        <option value="en">English</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>
                <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={toggleTheme}>
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-gray-500 text-[20px]">dark_mode</span>
                        <span className="text-sm font-semibold text-white">Donkere modus</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                        <input type="checkbox" checked={theme === 'dark'} readOnly className="sr-only peer flex" />
                        <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2a2]"></div>
                    </label>
                </div>
            </div>
        </div>
    )
}
