import Link from 'next/link'

export default function PaymentMethodPage() {
    return (
        <div className="space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link href="/settings/billing" className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#0df2a2] transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Betaalmethode Wijzigen</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Beheer de actieve betaalmethode voor je VoiceRealty abonnement.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Huidige Betaalmethode</h4>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-[#0df2a2]/30 bg-[#0df2a2]/5 group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-10 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white font-bold tracking-wider text-xs shadow-sm">
                                MC
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Mastercard <span className="text-gray-400 font-normal">eindigend op 4242</span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vervalt op 10/26</div>
                            </div>
                        </div>
                        <span className="bg-[#0df2a2]/10 text-[#0df2a2] text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-[#0df2a2]/20">
                            Standaard
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Nieuwe Betaalmethode Toevoegen</h4>

                    <div className="space-y-3">
                        {/* iDEAL Mock */}
                        <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="pt-1">
                                <input type="radio" name="payment_method" className="w-4 h-4 text-[#0df2a2] focus:ring-[#0df2a2] dark:bg-white/10 dark:border-white/20" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white mb-1">iDEAL</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Betaal veilig en direct via je eigen bank.</p>
                            </div>
                            <div className="w-12 h-8 rounded bg-pink-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                iDEAL
                            </div>
                        </label>

                        {/* Creditcard Mock */}
                        <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="pt-1">
                                <input type="radio" name="payment_method" className="w-4 h-4 text-[#0df2a2] focus:ring-[#0df2a2] dark:bg-white/10 dark:border-white/20" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white mb-1">Creditcard</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Ondersteunt Visa, Mastercard en American Express.</p>

                                <div className="mt-4 opacity-50 cursor-not-allowed">
                                    {/* Mock Strip Elements Container */}
                                    <div className="h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center px-4">
                                        <span className="text-sm text-gray-400 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[16px]">credit_card</span>
                                            Cardnummer, datum, CVC...
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">lock</span>
                                        Beveiligd door Stripe / Mollie
                                    </p>
                                </div>
                            </div>
                        </label>

                        {/* SEPA Mock */}
                        <label className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <div className="pt-1">
                                <input type="radio" name="payment_method" className="w-4 h-4 text-[#0df2a2] focus:ring-[#0df2a2] dark:bg-white/10 dark:border-white/20" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-900 dark:text-white mb-1">Handmatige Overboeking (SEPA)</div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Ontvang een factuur met betaalinstructies voor SEPA overboeking.</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex justify-end">
                    <button className="bg-[#0df2a2] hover:bg-[#0bc081] text-black font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-[#0df2a2]/20">
                        Opslaan
                    </button>
                </div>
            </div>
        </div>
    )
}
