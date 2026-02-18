const tiers = [
    {
        name: 'Essential',
        price: '€49',
        features: ['3 Woning-objecten', 'Basis functies', 'PDF Import'],
        cta: 'Kies Essential',
        href: '/pricing?plan=essential',
        recommended: false,
        highlight: false,
    },
    {
        name: 'Professional',
        price: '€129',
        features: ['15 Woning-objecten', 'Analytics Dashboard', 'Custom Branding'],
        cta: 'Start Professional',
        href: '/pricing?plan=professional',
        recommended: true,
        highlight: true,
    },
    {
        name: 'Elite',
        price: '€299',
        features: ['Onbeperkt Objecten', 'Voice Cloning', 'CRM Integratie'],
        cta: 'Neem contact op',
        href: '/pricing?plan=elite',
        recommended: false,
        highlight: false,
    },
]

import Link from 'next/link';

export default function Pricing() {
    return (
        <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-white">Tarieven</h3>
                <span className="text-xs text-[#10b77f] font-medium">Bespaar 20% p/j</span>
            </div>
            <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
                {tiers.map((tier) => (
                    <div
                        key={tier.name}
                        className={`min-w-[280px] snap-center rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${tier.highlight
                            ? 'bg-gradient-to-b from-[#10b77f]/20 to-[#0A0A0A] border border-[#10b77f]/50 shadow-lg shadow-[#10b77f]/5'
                            : 'glass-card border border-white/10'
                            }`}
                    >
                        {tier.recommended && (
                            <div className="absolute top-0 right-0 bg-[#10b77f] px-3 py-1 rounded-bl-xl text-[10px] font-bold text-black uppercase tracking-wider">
                                Meest Gekozen
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <h4 className={`text-sm font-medium ${tier.highlight ? 'text-[#10b77f]' : 'text-gray-400'}`}>
                                {tier.name}
                            </h4>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">{tier.price}</span>
                                <span className="text-sm text-gray-500">/mnd</span>
                            </div>
                        </div>

                        <ul className="flex flex-col gap-3 my-2">
                            {tier.features.map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                                    <span className="material-symbols-outlined text-[#10b77f] text-[18px]">check_circle</span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href={tier.href}
                            className={`mt-auto w-full py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center ${tier.highlight
                                ? 'bg-[#10b77f] text-[#0A0A0A] hover:bg-[#10b77f]/90'
                                : 'border border-white/10 hover:bg-white/5 text-white'
                                }`}
                        >
                            {tier.cta}
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
