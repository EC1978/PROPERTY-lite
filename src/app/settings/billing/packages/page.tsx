import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CheckoutButton from './components/CheckoutButton'

export default async function PackagesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch current plan
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle()

    const currentPlan = subscription?.plan || 'Essential'

    const plans = [
        {
            name: 'Essential',
            price: '€ 49',
            period: 'per maand',
            description: 'Perfect voor de startende makelaar.',
            features: [
                'Tot 10 AI voice agents per maand',
                'Standaard stemmen (NL/EN)',
                'QR-code generatie',
                'Basis email support'
            ],
            cta: 'Kies Essential',
        },
        {
            name: 'Professional',
            price: '€ 149',
            period: 'per maand',
            description: 'Voor het groeiende kantoor met ambities.',
            features: [
                'Onbeperkt AI voice agents',
                'Premium & Custom stemmen',
                'Realworks/CRM integratie',
                'Lead management board',
                'Prioriteit support'
            ],
            popular: true,
            cta: 'Kies Professional',
        },
        {
            name: 'Elite',
            price: '€ 299',
            period: 'per maand',
            description: 'Volledige suite voor topkantoren.',
            features: [
                'Alles uit Professional',
                'White-label portal voor klanten',
                'Dedicated account manager',
                'Custom AI trainingen',
                'API Toegang'
            ],
            cta: 'Upgrade naar Elite',
            highlight: true
        }
    ]

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
                {plans.map((plan) => {
                    const isCurrent = plan.name === currentPlan

                    return (
                        <div
                            key={plan.name}
                            className={`relative rounded-3xl p-8 flex flex-col ${plan.popular
                                ? 'bg-gradient-to-b from-slate-card to-[#0df2a2]/5 border-2 border-[#0df2a2] shadow-2xl shadow-[#0df2a2]/10'
                                : 'bg-white dark:bg-slate-card border border-gray-100 dark:border-white/10'
                                }`}
                        >
                            {plan.popular && (
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

                            <div className="mb-6">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</p>
                            </div>

                            <div className="mb-8 flex items-baseline gap-1.5">
                                <span className="text-4xl font-black text-gray-900 dark:text-white whitespace-nowrap tracking-tight">
                                    {plan.price}
                                </span>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {plan.period}
                                </span>
                            </div>

                            <div className="flex-1">
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
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
                                        planName={plan.name}
                                        cta={plan.cta}
                                        className={plan.highlight || plan.popular
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-lg mx-auto">Onze experts helpen je graag met het vinden van het perfecte pakket voor jouw makelaarskantoor. Neem contact met ons op via live chat of email.</p>
                <button className="text-sm font-bold text-[#0df2a2] hover:underline flex items-center justify-center gap-2 mx-auto">
                    <span className="material-symbols-outlined text-[18px]">support_agent</span>
                    Neem contact op met Sales
                </button>
            </div>
        </div>
    )
}
