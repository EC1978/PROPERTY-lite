import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default async function SupportPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans">

            <Sidebar userEmail={user.email} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg tracking-tight">Support & Help</span>
                </div>
                <div className="size-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-6 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 max-w-7xl mx-auto space-y-8">

                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        Klantenbeheer & Support
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Hulp nodig? Bekijk de FAQ of neem contact op met ons team.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* FAQ Section */}
                    <div className="space-y-6">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">quiz</span>
                            Veelgestelde Vragen
                        </h3>

                        <div className="space-y-4">
                            {[
                                { q: 'Hoe voeg ik een nieuwe woning toe?', a: 'Ga naar "Properties" en klik op "+ Woning Toevoegen". Upload je PDF en de AI doet de rest.' },
                                { q: 'Hoe werkt de Voice AI?', a: 'De Voice AI traint zichzelf op de woninggegevens. Je kunt de stem testen in de instellingen.' },
                                { q: 'Kan ik mijn abonnement pauzeren?', a: 'Ja, ga naar "Instellingen > Abonnement" om je plan aan te passen of te pauzeren.' },
                                { q: 'Hoe exporteer ik leads?', a: 'In het "Leads" overzicht kun je leads exporteren naar CSV via de export knop.' }
                            ].map((faq, i) => (
                                <div key={i} className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{faq.q}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white dark:bg-[#111] p-8 rounded-3xl border border-gray-200 dark:border-white/5 shadow-sm h-fit">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-emerald-500">support_agent</span>
                            Direct Contact
                        </h3>

                        <form className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Onderwerp</label>
                                <select className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 outline-none">
                                    <option>Technische Ondersteuning</option>
                                    <option>Facturatie Vraag</option>
                                    <option>Feature Request</option>
                                    <option>Anders</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Bericht</label>
                                <textarea
                                    rows={5}
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:ring-emerald-500 outline-none resize-none"
                                    placeholder="Beschrijf je probleem of vraag..."
                                ></textarea>
                            </div>

                            <button className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                                Verstuur Bericht
                            </button>
                        </form>
                    </div>
                </div>

            </main>

            <MobileNav />
        </div>
    )
}
