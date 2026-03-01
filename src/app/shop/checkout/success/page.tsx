'use client'

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const { total, clearCart } = useCart();
    const [orderTotal, setOrderTotal] = useState(0);

    // Use a ref to ensure we only capture the total once and avoid loops
    useEffect(() => {
        if (total > 0) {
            setOrderTotal(total * 1.21);
            clearCart();
        }
    }, [total, clearCart]);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#F8FAFC] font-sans flex flex-col items-center">
            {/* Header / Nav */}
            <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full border-b border-white/5 md:border-transparent">
                <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="bg-[#0df2a2] size-8 rounded-lg flex items-center justify-center text-[#0A0A0A]">
                        <span className="material-symbols-outlined text-xl font-bold">parking_sign</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">VoiceRealty <span className="text-[#0df2a2]">Shop</span></span>
                </Link>
                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-full hover:bg-white/5 transition-colors">
                        <span className="material-symbols-outlined">notifications</span>
                    </button>
                    <div className="size-10 rounded-full bg-[#1A1D1C] border border-[#0df2a2]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#0df2a2]">person</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 pb-32">
                {/* Success Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-[#0df2a2]/10 mb-6">
                        <span className="material-symbols-outlined text-[#0df2a2] text-4xl">check_circle</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">Bedankt voor je bestelling!</h1>
                    <p className="text-gray-400">Ordernummer: <span className="text-[#0df2a2] font-mono font-bold">#{orderId ? `RS-2024-${orderId.slice(0, 4).toUpperCase()}` : 'Wordt verwerkt...'}</span></p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Section 1: Next Steps */}
                    <div className="md:col-span-2 bg-[#1A1D1C]/60 backdrop-blur-md rounded-xl p-8 border border-[#0df2a2]/10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-[#0df2a2]">mark_email_read</span>
                                <h2 className="text-xl font-bold">Volgende stappen</h2>
                            </div>
                            <p className="text-gray-400 leading-relaxed max-w-md">
                                We hebben een orderbevestiging gestuurd naar je e-mailadres. Hierin vind je een overzicht van je bestelling en de factuur.
                                <br /><br />
                                Geen mail ontvangen? Controleer ook even je spam-folder.
                            </p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-sm text-gray-400 bg-white/5 p-3 rounded-lg w-fit border border-white/5">
                            <span className="material-symbols-outlined text-sm text-[#0df2a2]">info</span>
                            <span>Gemiddelde levertijd: <strong className="text-white font-medium">3-5 werkdagen</strong> na goedkeuring bestanden.</span>
                        </div>
                    </div>

                    {/* Section 2: View Order */}
                    <div className="md:col-span-1 bg-[#1A1D1C]/60 backdrop-blur-md rounded-xl p-8 border border-[#0df2a2]/10 border-l-4 border-l-[#0df2a2] flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 size-32 bg-[#0df2a2]/5 rounded-full blur-3xl"></div>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-[#0df2a2]">inventory_2</span>
                                <h2 className="text-xl font-bold">Mijn Bestelling</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed relative z-10">
                                Bekijk direct de status en details van je bestelling in je persoonlijke account-dashboard.
                            </p>
                        </div>
                        <Link href={orderId ? `/shop/account/orders/${orderId}` : '/shop/account/orders'} className="bg-[#0df2a2] text-[#0A0A0A] font-extrabold py-4 rounded-xl flex items-center justify-center gap-2 group shadow-[0_0_15px_rgba(13,242,162,0.3)] hover:shadow-[0_0_25px_rgba(13,242,162,0.5)] transition-all active:scale-[0.98] relative z-10">
                            Bestelling inzien
                            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">double_arrow</span>
                        </Link>
                    </div>

                    {/* Section 3: Payment Status */}
                    <div className="md:col-span-1 bg-[#1A1D1C]/60 backdrop-blur-md rounded-xl p-8 border border-[#0df2a2]/10 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-[#0df2a2]">payments</span>
                                <h2 className="text-xl font-bold">Betaling</h2>
                            </div>
                            <div className="bg-[#0df2a2]/5 rounded-xl p-4 border border-[#0df2a2]/10 mb-4">
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="text-gray-400">Status</span>
                                    <span className="text-[#0df2a2] font-medium flex items-center gap-1">
                                        Voltooid <span className="material-symbols-outlined text-[14px]">check</span>
                                    </span>
                                </div>
                                <div className="text-2xl font-bold">€ {orderTotal.toFixed(2)}</div>
                            </div>
                            <p className="text-gray-500 text-xs leading-relaxed">
                                Je betaling is succesvol verwerkt. We starten de productie zodra je bestanden zijn goedgekeurd.
                            </p>
                        </div>
                    </div>

                    {/* Section 4: Shop More */}
                    <div className="md:col-span-2 bg-[#1A1D1C]/60 backdrop-blur-md rounded-xl p-8 border border-[#0df2a2]/10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 group">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-3 group-hover:text-[#0df2a2] transition-colors">Plaats nog een bestelling</h2>
                            <p className="text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
                                Nog andere promotieborden of raamstickers nodig? Voeg ze toe aan een nieuwe order en profiteer van onze combi-kortingen.
                            </p>
                            <Link href="/shop" className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#F8FAFC] font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all w-fit">
                                Verder winkelen
                                <span className="material-symbols-outlined">shopping_cart</span>
                            </Link>
                        </div>
                        <div className="hidden md:block w-48 h-32 rounded-xl bg-cover bg-center opacity-40 border border-[#0df2a2]/20 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAJIKEn1zkYrlCzy-_RUb_AkP0epPqalRvFxKlWNO0qCfcEiYBjhtB_U5Eh6tpMJeuoNJO8A1Hq2raNptG1Y4XlgWE2-LvemTlYptVi9xJkBIW4FERSnVV59hQUa1HlSmqNwNefFx2H_WHITqzzExXsOfPZwzgpF4wTgX_k8Azp6ENotzV0wn-umo8DGO1O0RMgPce-KRcuw4yX-uJtkY_bTtnjFfBI5RY08IQxJJt8pGyNeSo1PuP_027cODec96Mnpg_qBbHrPf4')" }}>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-10 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm">Bestelling laden...</p>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
