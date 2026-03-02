import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function Pricing() {
    const supabase = await createClient();

    // Fetch active packages marked for landing page, ordered by sort_order
    const { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .eq('show_on_landing', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Pricing fetch error:', error);
        return null;
    }

    if (!packages || packages.length === 0) return null;

    // Helper to get features list from module booleans
    const getFeatures = (pkg: any) => {
        const features = [];
        if (pkg.property_limit >= 999) features.push('Onbeperkt Woningen');
        else if (pkg.property_limit > 0) features.push(`${pkg.property_limit} Woning-objecten`);

        if (pkg.has_agenda) features.push('Agenda & Planning');
        if (pkg.has_leads) features.push('CRM & Leadbeheer');
        if (pkg.has_statistics) features.push('Analytics Dashboard');
        if (pkg.has_voice) features.push('Voice AI Assistant');
        if (pkg.has_materials) features.push('Materialen beheer');
        if (pkg.has_archive) features.push('Document Archief');
        if (pkg.has_reviews) features.push('Klantbeoordelingen');
        if (pkg.has_webshop) features.push('Webshop integratie');

        // Add basic features if list is too short
        if (features.length < 3) features.push('Basis functies');

        return features.slice(0, 4); // Keep it concise for landing page
    };

    return (
        <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tarieven</h3>
                <span className="text-xs text-[#10b77f] font-medium">Bespaar 20% p/j</span>
            </div>
            <div className={`flex overflow-x-auto hide-scrollbar gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory md:grid md:overflow-visible md:mx-0 md:px-0 ${packages.length === 2 ? 'md:grid-cols-2' :
                packages.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
                    'md:grid-cols-3'
                }`}>
                {packages.map((pkg) => {
                    const features = getFeatures(pkg);
                    return (
                        <div
                            key={pkg.id}
                            className={`min-w-[280px] snap-center rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 ${pkg.is_popular
                                ? 'bg-gradient-to-b from-[#10b77f]/20 to-[#0A0A0A] border border-[#10b77f]/50 shadow-lg shadow-[#10b77f]/5'
                                : 'bg-[#0A0A0A] border border-white/10'
                                }`}
                        >
                            {pkg.is_popular && (
                                <div className="absolute top-0 right-0 bg-[#10b77f] px-3 py-1 rounded-bl-xl text-[10px] font-bold text-black uppercase tracking-wider">
                                    Meest Gekozen
                                </div>
                            )}

                            <div className="flex flex-col gap-1">
                                <h4 className={`text-sm font-medium ${pkg.is_popular ? 'text-[#10b77f]' : 'text-gray-400'}`}>
                                    {pkg.name}
                                </h4>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">€{pkg.monthly_price}</span>
                                    <span className="text-sm text-gray-500">/mnd</span>
                                </div>
                            </div>

                            <ul className="flex flex-col gap-3 my-2">
                                {features.map((item) => (
                                    <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                                        <span className="material-symbols-outlined text-[#10b77f] text-[18px]">check_circle</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={`/register?plan=${pkg.id}`}
                                className={`mt-auto w-full py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center ${pkg.is_popular
                                    ? 'bg-[#10b77f] text-[#0A0A0A] hover:bg-[#10b77f]/90'
                                    : 'border border-gray-200 dark:border-white/10 hover:bg-gray-800 dark:hover:bg-white/5 text-white'
                                    }`}
                            >
                                Start met {pkg.name}
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
