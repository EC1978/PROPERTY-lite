import { getUserIntegrations } from './actions'
import IntegrationCards from './components/IntegrationCards'

export const metadata = {
    title: 'Integraties | VoiceRealty AI',
}

export default async function IntegrationsPage() {
    const { integrations, error } = await getUserIntegrations()

    if (error) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Integratie Center
                    </h1>
                    <p className="text-[#a1a1aa] mt-2">
                        Fout bij het laden van integraties. Log opnieuw in.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 shadow-[0_0_15px_rgba(13,242,162,0.15)] flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#0df2a2]">extension</span>
                        </div>
                        Integratie Center
                    </h1>
                    <p className="text-[#a1a1aa] mt-3 max-w-2xl leading-relaxed">
                        Koppel uw favoriete tools om uw workflow te automatiseren. Verbind uw agenda voor naadloze bezichtigingsplanning of integreer met uw CRM zoals Realworks.
                    </p>
                </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent"></div>

            {/* Modern, glowing cards layout */}
            <IntegrationCards initialIntegrations={integrations} />
        </div>
    )
}
