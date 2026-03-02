import { createClient } from '@/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CheckoutButton from './components/CheckoutButton'

export const revalidate = 0

const featureLabels: Record<string, string> = {
    has_properties: 'Woningen beheren',
    has_agenda: 'Agenda & Planning',
    has_leads: 'Leads Management',
    has_materials: 'Materialen bibliotheek',
    has_archive: 'Archief',
    has_statistics: 'Statistieken & Analytics',
    has_reviews: 'Klantbeoordelingen',
    has_webshop: 'Webshop toegang',
    has_billing: 'Facturatie module',
    has_voice: 'Voice AI Assistent',
}

export default async function PackagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch current plan from subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle()

    const currentPlanId = subscription?.plan || null

    // Fetch live packages from DB (use anon client – no auth needed, RLS allows public read)
    const anonClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    )

    const { data: packages } = await anonClient
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

    const plans = packages ?? []

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/settings/billing" className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#0df2a2] transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Pakket & Module Matrix</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vergelijk de pakketten en kies wat het best bij jouw kantoor past.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                {plans.map((plan, i) => {
                    const isCurrent = currentPlanId === plan.id || (!currentPlanId && i === 0)
                    const isPopular = plan.is_popular

                    const includedFeatures = Object.entries(featureLabels)
                        .filter(([key]) => plan[key])
                        .map(([, label]) => label)

                    const propertyText = plan.property_limit >= 999
                        ? 'Onbeperkt woningen'
                        : `Max ${plan.property_limit} woningen`

                    return (
                        <div
                            key={plan.id}
                            className={`relative rounded-3xl p-8 flex flex-col ${isPopular
                                ? 'bg-gradient-to-b from-slate-card to-[#0df2a2]/5 border-2 border-[#0df2a2] shadow-2xl shadow-[#0df2a2]/10'
                                : 'bg-white dark:bg-slate-card border border-gray-100 dark:border-white/10'
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0df2a2] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                    Meest Gekozen
                                </div>
                            )}

                            {isCurrent && (
                                <div className="absolute top-4 right-4">
                                    <span className="bg-[#0df2a2]/10 text-[#0df2a2] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#0df2a2]/20">
                                        Actief
                                    </span>
                                </div>
                            )}

                            <div className="mb-4">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-4 flex items-baseline gap-1.5">
                                <span className="text-4xl font-black text-gray-900 dark:text-white whitespace-nowrap tracking-tight">
                                    € {plan.monthly_price}
                                </span>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">per maand</span>
                            </div>

                            {/* Property limit badge */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0df2a2]/8 border border-[#0df2a2]/20 mb-5">
                                <span className="material-symbols-outlined text-[#0df2a2] text-[16px]">home</span>
                                <span className="text-[13px] font-bold text-[#0df2a2]">{propertyText}</span>
                            </div>

                            <div className="flex-1">
                                <ul className="space-y-3 mb-8">
                                    {includedFeatures.map((feature, fi) => (
                                        <li key={fi} className="flex items-start gap-3">
                                            <span className="material-symbols-outlined text-[#0df2a2] text-[20px] shrink-0">check_circle</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-auto pt-6">
                                {isCurrent ? (
                                    <button disabled className="w-full py-3.5 px-4 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold border border-gray-200 dark:border-white/10 cursor-not-allowed">
                                        Huidig Plan
                                    </button>
                                ) : (
                                    <CheckoutButton
                                        planId={plan.id}
                                        cta={`Kies ${plan.name}`}
                                        className={isPopular || i === plans.length - 1
                                            ? 'bg-[#0df2a2] hover:bg-[#0bc081] text-black shadow-lg shadow-[#0df2a2]/20'
                                            : 'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-12 text-center p-8 rounded-2xl border border-gray-100 dark:border-white/10 bg-white/50 dark:bg-slate-card/50">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hulp nodig bij het kiezen?</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-lg mx-auto">Onze experts helpen je graag met het vinden van het perfecte pakket voor jouw makelaarskantoor.</p>
                <button className="text-sm font-bold text-[#0df2a2] hover:underline flex items-center justify-center gap-2 mx-auto">
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                    Neem contact op met Sales
                </button>
            </div>
        </div>
    )
}
