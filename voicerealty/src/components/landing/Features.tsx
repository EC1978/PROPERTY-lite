export default function Features() {
    const features = [
        {
            name: 'Directe PDF',
            description: 'Auto-conversie',
            icon: 'description',
        },
        {
            name: '24/7 Agent',
            description: 'Altijd beschikbaar',
            icon: 'schedule',
        },
        {
            name: 'Meertalig',
            description: 'Auto-vertaling',
            icon: 'language',
        },
        {
            name: 'Analytics',
            description: 'Live inzichten',
            icon: 'bar_chart',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((feature) => (
                <div key={feature.name} className="glass-card p-4 rounded-xl flex flex-col gap-3 hover:border-[#10b77f]/30 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-[#10b77f]/20 transition-colors">
                        <span className="material-symbols-outlined text-white/80 group-hover:text-[#10b77f]">{feature.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white mb-1">{feature.name}</h3>
                        <p className="text-xs text-gray-500">{feature.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
