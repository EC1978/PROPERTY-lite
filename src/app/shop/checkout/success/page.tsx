'use client'

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const { total, clearCart } = useCart();
    const [orderTotal, setOrderTotal] = useState(0);

    const [status, setStatus] = useState<string>('verwerken...');

    // 1. Clear Cart & Set Initial Total
    useEffect(() => {
        if (total > 0) {
            setOrderTotal(total * 1.21);
            clearCart();
        } else {
            // Even if total is 0 (already cleared), ensure we have a fallback for the UI
            // However, it's better to get the real total from the order if possible
        }
    }, []); // Run once on mount

    // 2. Poll for Order Status (Webhook sync)
    useEffect(() => {
        if (!orderId) return;

        const supabase = createClient();
        let pollCount = 0;
        const maxPolls = 10; // Poll for 20 seconds maximum (2s intervals)

        const checkStatus = async () => {
            const { data, error } = await supabase
                .from('shop_orders')
                .select('status, total_amount')
                .eq('id', orderId)
                .single();

            if (data) {
                if (data.status === 'paid') {
                    setStatus('betaald');
                    setOrderTotal(Number(data.total_amount));
                    return true; // Stop polling
                }
                setOrderTotal(Number(data.total_amount));
            }
            return false;
        };

        // Initial check
        checkStatus();

        const interval = setInterval(async () => {
            pollCount++;
            const isPaid = await checkStatus();
            if (isPaid || pollCount >= maxPolls) {
                clearInterval(interval);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [orderId]);

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-[#F8FAFC] font-sans flex flex-col items-center">
            {/* Header / Nav */}
            <header className="flex items-center justify-between p-8 max-w-7xl mx-auto w-full relative z-10">
                <Link href="/dashboard" className="flex items-center gap-4 group">
                    <div className="bg-[#10b77f] size-10 rounded-xl flex items-center justify-center text-[#0A0A0A] shadow-[0_0_20px_rgba(16,183,127,0.3)] group-hover:scale-110 transition-transform duration-500">
                        <span className="material-symbols-outlined text-2xl font-black">parking_sign</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase italic">VoiceRealty <span className="text-[#10b77f]">Shop</span></span>
                </Link>
                <div className="flex items-center gap-6">
                    <button className="p-3 rounded-xl hover:bg-white/5 transition-colors group">
                        <span className="material-symbols-outlined text-zinc-500 group-hover:text-white transition-colors">notifications</span>
                    </button>
                    <div className="size-12 rounded-2xl bg-zinc-900 border border-[#10b77f]/20 flex items-center justify-center shadow-inner group-hover:border-[#10b77f]/50 transition-all cursor-pointer">
                        <span className="material-symbols-outlined text-[#10b77f] font-black">person</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8 pb-32">
                {/* Success Hero */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#10b77f]/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="inline-flex items-center justify-center size-24 rounded-[2rem] bg-[#10b77f]/10 border border-[#10b77f]/20 mb-8 shadow-[0_0_50px_rgba(16,183,127,0.15)] relative z-10">
                        <span className="material-symbols-outlined text-[#10b77f] text-5xl font-black drop-shadow-[0_0_15px_rgba(16,183,127,0.5)]">check_circle</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase italic relative z-10">Bedankt voor je <span className="text-[#10b77f]">Bestelling</span></h1>
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.3em] italic relative z-10">Ordernummer: <span className="text-[#10b77f] font-black not-italic opacity-100">{orderId ? `RS-2024-${orderId.slice(0, 4).toUpperCase()}` : 'Wordt verwerkt...'}</span></p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Section 1: Next Steps */}
                    <div className="md:col-span-2 glass-panel rounded-[3rem] p-10 md:p-12 border-white/5 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute -bottom-24 -left-24 size-64 bg-[#10b77f]/5 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="size-14 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shadow-inner">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black text-3xl">mark_email_read</span>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Volgende <span className="text-[#10b77f]">stappen</span></h2>
                            </div>
                            <p className="text-[13px] text-zinc-500 font-bold uppercase tracking-widest italic leading-relaxed max-w-md opacity-80">
                                We hebben een orderbevestiging gestuurd naar je e-mailadres. Hierin vind je een overzicht van je bestelling en de factuur.
                                <br /><br />
                                Geen mail ontvangen? Controleer ook even je spam-folder.
                            </p>
                        </div>
                        <div className="mt-12 flex items-center gap-4 text-[10px] font-black text-zinc-600 bg-white/5 px-6 py-4 rounded-2xl w-fit border border-white/5 uppercase tracking-[0.2em] italic relative z-10">
                            <span className="material-symbols-outlined text-lg text-[#10b77f] font-black">info</span>
                            <span>Gemiddelde levertijd: <strong className="text-white font-black">3-5 werkdagen</strong> na goedkeuring bestanden.</span>
                        </div>
                    </div>

                    {/* Section 2: View Order */}
                    <div className="md:col-span-1 glass-panel rounded-[3rem] p-10 md:p-12 border-[#10b77f]/30 border-t-8 flex flex-col justify-between relative overflow-hidden group shadow-2xl">
                        <div className="absolute -top-10 -right-10 size-48 bg-[#10b77f]/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="size-14 rounded-2xl bg-zinc-900 border border-[#10b77f]/20 flex items-center justify-center shadow-inner">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black text-3xl">inventory_2</span>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Order</h2>
                            </div>
                            <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest italic mb-10 leading-relaxed opacity-80">
                                Bekijk direct de status en details van je bestelling in je persoonlijke account-dashboard.
                            </p>
                        </div>
                        <Link href={orderId ? `/shop/account/orders/${orderId}` : '/shop/account/orders'} className="bg-[#10b77f] text-[#0A0A0A] font-black py-5 rounded-2xl flex items-center justify-center gap-4 group/btn shadow-[0_20px_40px_rgba(16,183,127,0.3)] hover:shadow-[0_20px_60px_rgba(16,183,127,0.5)] transition-all uppercase tracking-widest italic text-[11px] relative z-10 active:scale-95 transform">
                            Bestelling inzien
                            <span className="material-symbols-outlined font-black transition-transform group-hover/btn:translate-x-3">double_arrow</span>
                        </Link>
                    </div>

                    {/* Section 3: Payment Status */}
                    <div className="md:col-span-1 glass-panel rounded-[3rem] p-10 md:p-12 border-white/5 flex flex-col justify-between relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="size-14 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black text-3xl">payments</span>
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Betaling</h2>
                            </div>
                            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/5 mb-8 group-hover:border-[#10b77f]/30 transition-all duration-700 shadow-inner">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] italic mb-4 opacity-50">
                                    <span>Status</span>
                                    <span className="text-[#10b77f] flex items-center gap-2 not-italic">
                                        {status.toUpperCase()} <span className="material-symbols-outlined text-[16px] font-black">{status === 'betaald' ? 'verified' : 'sync'}</span>
                                    </span>
                                </div>
                                <div className="text-4xl font-black italic tracking-tighter text-[#10b77f] drop-shadow-[0_0_20px_rgba(16,183,127,0.3)]">€ {orderTotal.toFixed(2)}</div>
                            </div>
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic leading-relaxed opacity-60">
                                Je betaling is succesvol verwerkt. We starten de productie zodra je bestanden zijn goedgekeurd.
                            </p>
                        </div>
                    </div>

                    {/* Section 4: Shop More */}
                    <div className="md:col-span-2 glass-panel rounded-[3rem] p-10 md:p-12 border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-12 group transition-all duration-700 hover:border-[#10b77f]/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#10b77f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        <div className="flex-1 relative z-10">
                            <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-4 group-hover:text-[#10b77f] transition-colors duration-500">Plaats nog een bestelling</h2>
                            <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-widest italic mb-10 max-w-sm leading-relaxed opacity-80">
                                Nog andere promotieborden of raamstickers nodig? Voeg ze toe aan een nieuwe order en profiteer van onze combi-kortingen.
                            </p>
                            <Link href="/shop" className="bg-white/5 hover:bg-[#10b77f] hover:text-[#0A0A0A] border border-white/10 text-[#F8FAFC] font-black py-4 px-10 rounded-2xl flex items-center justify-center gap-3 transition-all w-fit uppercase tracking-widest italic text-[10px] group/btn transform hover:scale-105 active:scale-95 shadow-xl">
                                Verder winkelen
                                <span className="material-symbols-outlined font-black transition-transform group-hover/btn:translate-x-2">shopping_cart</span>
                            </Link>
                        </div>
                        <div className="relative shrink-0 w-full md:w-64 h-48 rounded-[2rem] overflow-hidden group-hover:scale-105 transition-all duration-1000 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                            <div className="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-1000" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAJIKEn1zkYrlCzy-_RUb_AkP0epPqalRvFxKlWNO0qCfcEiYBjhtB_U5Eh6tpMJeuoNJO8A1Hq2raNptG1Y4XlgWE2-LvemTlYptVi9xJkBIW4FERSnVV59hQUa1HlSmqNwNefFx2H_WHITqzzExXsOfPZwzgpF4wTgX_k8Azp6ENotzV0wn-umo8DGO1O0RMgPce-KRcuw4yX-uJtkY_bTtnjFfBI5RY08IQxJJt8pGyNeSo1PuP_027cODec96Mnpg_qBbHrPf4')" }}></div>
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
                <div className="flex flex-col items-center gap-6">
                    <div className="size-16 border-[6px] border-[#10b77f]/10 border-t-[#10b77f] rounded-full animate-spin shadow-[0_0_30px_rgba(16,183,127,0.2)]"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic animate-pulse">Bestelling laden...</p>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
