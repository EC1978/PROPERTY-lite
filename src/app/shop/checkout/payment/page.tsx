'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { CheckoutStepper } from '@/components/shop/CheckoutStepper';
import { createClient } from '@/utils/supabase/client';

export default function CheckoutPaymentPage() {
    const router = useRouter();
    const { items, subtotal, shipping, total, clearCart, designUrl, setDesignUrl } = useCart();
    const [selectedPayment, setSelectedPayment] = useState('ideal');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // Fetch user details on mount
    useEffect(() => {
        const fetchUserData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('full_name, email')
                    .eq('id', user.id)
                    .single();
                setUserData({ ...user, ...profile });
            }
        };
        fetchUserData();
    }, []);

    // Assume standard 21% VAT and arbitrary shipping rules defined in previous steps
    const tax = (total * 0.21);
    const finalTotal = total + tax;

    const handlePlaceOrder = async () => {
        setIsPlacingOrder(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('U moet ingelogd zijn om een bestelling te plaatsen.');
                setIsPlacingOrder(false);
                return;
            }

            // Create order
            const billingName = userData?.full_name || user.email || 'Klant';

            // Determine status based on simulated choice
            // iDEAL = Paid (Demo), Bank = Pending (Later)
            const finalStatus = selectedPayment === 'ideal' ? 'paid' : 'pending';

            const { data: order, error: orderError } = await supabase
                .from('shop_orders')
                .insert({
                    user_id: user.id,
                    status: finalStatus,
                    total_amount: finalTotal,
                    tax_amount: tax,
                    shipping_cost: shipping,
                    payment_method: selectedPayment,
                    billing_address: { name: billingName, city: 'Online Bestelling' },
                    shipping_address: { name: billingName, city: 'Online Bestelling' },
                    design_url: designUrl
                })
                .select()
                .single();

            if (orderError || !order) throw orderError || new Error('Order creation failed');

            // Create order items
            const orderItems = items.map(item => {
                const itemOptionsTotal = item.options.reduce((sum, opt) => sum + (opt.price || 0), 0);
                const unitPrice = item.basePrice + itemOptionsTotal;
                return {
                    order_id: order.id,
                    product_id: item.dbId,
                    quantity: item.quantity,
                    unit_price: unitPrice,
                    total_price: unitPrice * item.quantity,
                    selected_options: item.options
                };
            });

            const { error: itemsError } = await supabase
                .from('shop_order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            clearCart();
            setDesignUrl(null);
            router.push(`/shop/checkout/success?order_id=${order.id}`);

        } catch (error) {
            console.error('Error placing order:', error);
            alert('Er is een fout opgetreden bij het plaatsen van de bestelling.');
            setIsPlacingOrder(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#F8FAFC] font-sans pb-32">
            <CheckoutStepper />

            <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Payment & Billing */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Section 1: Factuuradres */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,183,127,0.1)]">
                                        <span className="material-symbols-outlined text-[#10b77f] font-black">fact_check</span>
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tighter uppercase italic">Factuur <span className="text-[#10b77f]">Gegevens</span></h3>
                                </div>
                                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black tracking-[0.2em] uppercase transition-all flex items-center gap-3 italic">
                                    <span className="material-symbols-outlined text-[18px] font-black">edit_note</span>
                                    Wijzigen
                                </button>
                            </div>

                            <div className="glass-panel border-white/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row gap-10 items-center group hover:border-[#10b77f]/30 transition-all duration-700 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b77f]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10b77f]/10 transition-all duration-1000"></div>

                                <div className="flex-1 relative z-10 w-full md:w-auto">
                                    <div className="flex items-center gap-4 mb-3">
                                        <p className="font-black text-white text-2xl tracking-tighter uppercase italic">{userData?.full_name || 'Uw Naam'}</p>
                                        <span className="px-3 py-1 rounded-lg bg-[#10b77f]/10 border border-[#10b77f]/20 text-[8px] font-black text-[#10b77f] uppercase tracking-[0.2em] italic">GEAUTO-RISEERD</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic opacity-60 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">alternate_email</span>
                                        {userData?.email || 'uw-email@adres.nl'}
                                    </p>

                                    <div className="mt-8 flex items-center gap-4 pt-8 border-t border-white/5">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="size-6 rounded-full border border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                    <span className="material-symbols-outlined text-[12px] text-zinc-600">person</span>
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] italic opacity-50">Geadresseerd aan hoofdgebruiker</span>
                                    </div>
                                </div>

                                <div className="relative shrink-0 w-full md:w-48 h-48 rounded-[2rem] overflow-hidden group-hover:scale-105 transition-all duration-1000 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10"></div>
                                    <div className="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 transition-all duration-1000 border border-white/10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjulycpi-Qq-_tFdo0m26dlzT1FDj2LFbg6y-GWKfWzShafffBtZ_yjiHdKV5-C9N__blHuBuyroTFnZGjubKEVr7FJoVccGcrYjc38qRsYEOOcmdoDOlaQwwLle9A2bUxs7feCWSkcKWKECuDpUdxCBUWqp7WvRin1GdShOj9LFYwjb5f2cAslwmuBUGwoFS_r91qwgW-gdbKOTgiEaEsEL4Q7L8WT0dVNO4ZNJPbeI8Py2coFjF_bmYr8hB2_ybEhGvR5wl-NS4')" }}></div>
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <span className="text-[10px] font-black text-[#10b77f] uppercase tracking-widest italic drop-shadow-md">PROFILE VERIFIED</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Betaalmethode */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,183,127,0.1)]">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black">account_balance_wallet</span>
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Kies uw <span className="text-[#10b77f]">betaalmethode</span></h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    { id: 'ideal', name: 'iDEAL', icon: 'account_balance', desc: 'Directe veilige betaling' },
                                    { id: 'bank', name: 'Handmatige overschrijving', icon: 'payments', desc: 'Overboeking via bank' },
                                ].map((method) => (
                                    <label key={method.id} className={`group relative flex items-center p-8 rounded-[2.5rem] cursor-pointer transition-all duration-700 hover:scale-[1.02] border-2 overflow-hidden ${selectedPayment === method.id ? 'glass-panel border-[#10b77f] shadow-[0_20px_50px_rgba(16,183,127,0.1)]' : 'glass-panel border-white/5 hover:border-white/20'}`}>
                                        <input type="radio" name="payment" className="hidden" checked={selectedPayment === method.id} onChange={() => setSelectedPayment(method.id)} />

                                        {selectedPayment === method.id && (
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b77f]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                        )}

                                        <div className={`size-16 rounded-[1.5rem] flex items-center justify-center mr-8 transition-all duration-700 border ${selectedPayment === method.id ? 'bg-[#10b77f] text-[#0A0A0A] border-[#10b77f] shadow-[0_0_25px_rgba(16,183,127,0.3)]' : 'bg-white/5 text-zinc-600 border-white/5 group-hover:border-white/10'}`}>
                                            <span className="material-symbols-outlined text-[32px] font-black">{method.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className={`block text-xl font-black uppercase tracking-tighter italic ${selectedPayment === method.id ? 'text-white' : 'text-zinc-400'}`}>{method.name}</span>
                                            <span className="block text-[10px] text-zinc-500 font-black uppercase tracking-widest italic mt-1.5 opacity-60 leading-none">{method.id === 'ideal' ? 'VOORKEUR' : 'BESCHIKBAAR'} • {method.desc}</span>
                                        </div>
                                        {selectedPayment === method.id && (
                                            <div className="absolute top-6 right-6 text-[#10b77f] animate-in zoom-in duration-500">
                                                <span className="material-symbols-outlined font-black text-[24px] drop-shadow-[0_0_10px_rgba(16,183,127,0.5)]">verified</span>
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Section 4: Newsletter & Privacy */}
                        <section className="glass-panel border-white/5 rounded-[2rem] p-8 md:p-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#10b77f]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-start gap-6 relative z-10">
                                <div className="relative inline-flex items-center cursor-pointer mt-1">
                                    <input type="checkbox" id="newsletter" className="w-6 h-6 rounded-lg border-white/10 bg-white/5 text-[#10b77f] focus:ring-[#10b77f] focus:ring-offset-[#0A0A0A] cursor-pointer shadow-inner" />
                                </div>
                                <label htmlFor="newsletter" className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic leading-relaxed cursor-pointer selection:bg-[#10b77f]/20 opacity-80 group-hover:opacity-100 transition-all">
                                    Ik ontvang graag de wekelijkse VoiceRealty nieuwsbrief met exclusieve vastgoedmarketing tips, updates over nieuwe producten en persoonlijke aanbiedingen.
                                </label>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="glass-panel border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b77f]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10b77f]/10 transition-all duration-1000"></div>
                            <h3 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase italic relative z-10">
                                <span className="material-symbols-outlined text-[#10b77f] font-black">verified_user</span>
                                Betalen
                            </h3>

                            <div className="space-y-6 mb-10 relative z-10">
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>Totaal excl. BTW</span>
                                    <span className="text-white not-italic font-black">€ {(total).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>Verzending</span>
                                    <span className={shipping > 0 ? "text-white not-italic font-black text-right" : "text-[#10b77f] not-italic font-black uppercase tracking-widest"}>
                                        {shipping > 0 ? `€ ${shipping.toFixed(2)}` : 'Gratis'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>BTW (21%)</span>
                                    <span className="text-white not-italic font-black">€ {tax.toFixed(2)}</span>
                                </div>
                                <div className="pt-8 mt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 italic">Totaalbedrag</span>
                                        <span className="text-[8px] text-[#10b77f] font-black uppercase tracking-widest italic opacity-40">Inclusief BTW</span>
                                    </div>
                                    <span className="text-4xl font-black text-[#10b77f] tracking-tighter italic drop-shadow-[0_0_30px_rgba(16,183,127,0.2)] text-right">
                                        € {finalTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={isPlacingOrder}
                                className="w-full bg-[#10b77f] hover:bg-[#10b77f]/90 text-[#0A0A0A] font-black py-6 rounded-2xl shadow-[0_20px_40px_rgba(16,183,127,0.2)] flex items-center justify-center gap-4 transition-all uppercase tracking-widest text-[11px] group/btn italic disabled:opacity-50 disabled:cursor-not-allowed">
                                {isPlacingOrder ? 'VERWERKEN...' : 'BESTELLING PLAATSEN'}
                                <span className={isPlacingOrder ? "w-6 h-6 border-4 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" : "material-symbols-outlined font-black transition-transform group-hover/btn:rotate-12"}>
                                    {isPlacingOrder ? '' : 'lock'}
                                </span>
                            </button>

                            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-4 justify-center grayscale opacity-20 hover:opacity-100 transition-all duration-700">
                                <div className="h-8 px-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic text-zinc-500">iDEAL</div>
                                <div className="h-8 px-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic text-zinc-500">VISA</div>
                                <div className="h-8 px-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest italic text-zinc-500">MASTERCARD</div>
                            </div>
                        </div>

                        <div className="glass-panel border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#10b77f]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex items-center gap-5 text-zinc-500 mb-4 group-hover:text-white transition-colors relative z-10">
                                <span className="material-symbols-outlined text-[24px] text-[#10b77f] font-black drop-shadow-[0_0_10px_rgba(16,183,127,0.3)]">verified</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Kopersbescherming</span>
                            </div>
                            <p className="text-[10px] text-zinc-600 leading-relaxed font-black uppercase tracking-widest italic opacity-50 relative z-10">U bestelt veilig bij VoiceRealty. Al onze betalingen worden verwerkt door een beveiligde SSL verbinding en gecontroleerd door Mollie.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
