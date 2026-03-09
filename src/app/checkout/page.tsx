import Link from 'next/link'
import Logo from '@/components/Logo'

export default function CheckoutPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const planName = typeof searchParams.plan === 'string' ? searchParams.plan : 'professional'

    const plans: Record<string, { name: string, price: string, interval: string, setup: string, total: string }> = {
        'essential': { name: 'Essential Plan', price: '€ 49.00', interval: '/ maand', setup: '€ 0.00', total: '€ 49.00' },
        'professional': { name: 'Professional Plan', price: '€ 149.00', interval: '/ maand', setup: '€ 0.00', total: '€ 149.00' },
        'elite': { name: 'Elite Plan', price: '€ 299.00', interval: '/ maand', setup: '€ 0.00', total: '€ 299.00' },
    }

    const selectedPlan = plans[planName] || plans['professional']

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-center mb-8">
                    <Logo iconSize="size-10" textClassName="text-2xl" />
                </div>

                <div className="bg-white dark:bg-[#1a1c23] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 dark:border-white/5">

                    {/* Left Side - Checkout Form */}
                    <div className="p-8 md:p-12 md:w-3/5">
                        <Link href="/settings/billing/packages" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-[#0df2a2] transition-colors mb-6 group">
                            <span className="material-symbols-outlined text-[18px] mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                            Terug naar pakketten
                        </Link>

                        <h2 className="text-3xl font-black mb-8">Afrekenen</h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#0df2a2]/20 text-[#0df2a2] flex items-center justify-center text-xs">1</span>
                                    Kantoor Gegevens
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">Voornaam</label>
                                        <input type="text" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-colors" placeholder="Jan" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">Achternaam</label>
                                        <input type="text" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-colors" placeholder="Jansen" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-2">Kantoornaam</label>
                                        <input type="text" className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 placeholder:text-gray-400 focus:outline-none focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] transition-colors" placeholder="Jansen Makelaardij B.V." />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-[#0df2a2]/20 text-[#0df2a2] flex items-center justify-center text-xs">2</span>
                                    Betaalmethode
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-4 rounded-xl border border-[#0df2a2]/50 bg-[#0df2a2]/5 cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <input type="radio" name="checkout_payment" defaultChecked className="w-4 h-4 text-[#0df2a2] focus:ring-[#0df2a2]" />
                                            <span className="font-bold">iDEAL</span>
                                        </div>
                                        <div className="w-10 h-6 rounded bg-pink-500 text-white font-black text-[8px] flex items-center justify-center">iDEAL</div>
                                    </label>
                                    <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                                        <div className="flex items-center gap-4">
                                            <input type="radio" name="checkout_payment" className="w-4 h-4 text-[#0df2a2] focus:ring-[#0df2a2]" />
                                            <span className="font-bold">Creditcard</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-8 h-6 rounded bg-blue-600 text-white font-black text-[8px] flex items-center justify-center italic">VISA</div>
                                            <div className="w-8 h-6 rounded bg-gray-800 text-white font-black text-[8px] flex items-center justify-center">MC</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button className="w-full bg-[#0df2a2] hover:bg-[#0bc081] text-black font-black text-lg py-4 px-6 rounded-xl transition-all shadow-xl shadow-[#0df2a2]/20 flex justify-center items-center gap-2 group">
                                <span className="material-symbols-outlined text-[20px]">lock</span>
                                Betaal {selectedPlan.total}
                                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform ml-1">arrow_forward</span>
                            </button>
                            <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                Veilige en versleutelde betaling via Stripe/Mollie
                            </p>
                        </div>
                    </div>

                    {/* Right Side - Order Summary */}
                    <div className="bg-gray-50 dark:bg-white/5 p-8 md:p-12 md:w-2/5 border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 flex flex-col">
                        <h3 className="text-xl font-bold mb-6">Besteloverzicht</h3>

                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h4 className="font-bold text-lg text-[#0df2a2]">{selectedPlan.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatische incasso</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg">{selectedPlan.price}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{selectedPlan.interval}</div>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">check</span>
                                    Direct toegang tot VoiceRealty AI
                                </li>
                                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">check</span>
                                    Elke maand opzegbaar
                                </li>
                                <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">check</span>
                                    Inclusief gratis onboarding
                                </li>
                            </ul>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-white/10 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Subtotaal</span>
                                <span>{selectedPlan.price}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                                <span>Setup kosten</span>
                                <span>{selectedPlan.setup}</span>
                            </div>
                            <div className="pt-3 flex justify-between items-center text-lg font-bold border-t border-gray-200 dark:border-white/10">
                                <span>Totaal te betalen</span>
                                <span className="text-2xl text-[#0df2a2]">{selectedPlan.total}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 text-right">Inclusief BTW (indien van toepassing)</p>
                        </div>
                    </div>

                </div>

                <div className="mt-8 flex justify-center gap-6 opacity-30">
                    {/* Fake payment provider logos for authenticity */}
                    <div className="h-6 w-12 bg-white rounded-md flex items-center justify-center font-bold text-[8px] text-black">iDEAL</div>
                    <div className="h-6 w-12 bg-blue-800 rounded-md flex items-center justify-center font-bold text-[8px] text-white">VISA</div>
                    <div className="h-6 w-12 bg-gray-900 rounded-md flex items-center justify-center font-bold text-[8px] text-white">MC</div>
                    <div className="h-6 w-12 bg-black rounded-md flex items-center justify-center font-bold text-[8px] text-white">Apple Pay</div>
                </div>
            </div>
        </div>
    )
}
