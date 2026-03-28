import { getExtensionToken } from './actions'
import ExtensionSettingsClient from './ExtensionSettingsClient'

export const metadata = {
    title: 'Browser Extensie | VoiceRealty AI',
}

export default async function ExtensionPage() {
    const { token } = await getExtensionToken()

    return (
        <div className="flex flex-col gap-8 fade-in">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#10b77f]">extension</span>
                    </div>
                    Browser Extensie
                </h1>
                <p className="text-slate-500 dark:text-[#a1a1aa] mt-3 max-w-2xl leading-relaxed">
                    Importeer woningen direct vanuit Funda naar VoiceRealty met één klik. 
                    Installeer de extensie in Chrome en koppel je account met jouw persoonlijke token.
                </p>
            </div>

            <div className="w-full h-px bg-gray-200 dark:bg-white/10" />

            <ExtensionSettingsClient initialToken={token || null} />
        </div>
    )
}
