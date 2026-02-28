'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { CheckoutStepper } from '@/components/shop/CheckoutStepper';
import { createClient } from '@/utils/supabase/client';

export default function CheckoutPaymentPage() {
    const router = useRouter();
    const { items, total, clearCart, designUrl, setDesignUrl } = useCart();
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
                    shipping_cost: 0,
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
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#0df2a2]">fact_check</span>
                                    </div>
                                    <h3 className="text-xl font-extrabold tracking-tight">Factuurgegevens</h3>
                                </div>
                                <button className="text-xs font-bold text-[#0df2a2] hover:underline uppercase tracking-widest">Wijzigen</button>
                            </div>

                            <div className="bg-[#1A1D1C]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center group hover:border-[#0df2a2]/30 transition-all">
                                <div className="flex-1">
                                    <p className="font-extrabold text-white text-lg tracking-tight mb-1">{userData?.full_name || 'Uw Naam'}</p>
                                    <p className="text-sm text-gray-500 leading-relaxed italic">{userData?.email || 'uw-email@adres.nl'}</p>
                                    <div className="mt-4 flex gap-4">
                                        <div className="text-[10px] font-black text-white/40 uppercase tracking-widest px-2 py-1 bg-white/5 rounded">Gegevens uit profiel</div>
                                    </div>
                                </div>
                                <div className="w-full md:w-32 h-32 rounded-xl bg-cover bg-center border border-white/10 shadow-xl opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBjulycpi-Qq-_tFdo0m26dlzT1FDj2LFbg6y-GWKfWzShafffBtZ_yjiHdKV5-C9N__blHuBuyroTFnZGjubKEVr7FJoVccGcrYjc38qRsYEOOcmdoDOlaQwwLle9A2bUxs7feCWSkcKWKECuDpUdxCBUWqp7WvRin1GdShOj9LFYwjb5f2cAslwmuBUGwoFS_r91qwgW-gdbKOTgiEaEsEL4Q7L8WT0dVNO4ZNJPbeI8Py2coFjF_bmYr8hB2_ybEhGvR5wl-NS4')" }}>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: Betaalmethode */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#0df2a2]">account_balance_wallet</span>
                                </div>
                                <h3 className="text-xl font-extrabold tracking-tight">Kies uw <span className="text-[#0df2a2]">betaalmethode</span></h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'ideal', name: 'iDEAL (Simulation)', icon: 'account_balance', desc: 'Demo: Bestelling direct op "Betaald"' },
                                    { id: 'bank', name: 'Bankoverschrijving', icon: 'payments', desc: 'Demo: Bestelling op "Openstaand"' },
                                ].map((method) => (
                                    <label key={method.id} className={`relative flex items-center p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] border-2 ${selectedPayment === method.id ? 'bg-[#0df2a2]/5 border-[#0df2a2] shadow-[0_0_20px_rgba(13,242,162,0.1)]' : 'bg-[#1A1D1C]/60 border-white/5 hover:border-white/20'}`}>
                                        <input type="radio" name="payment" className="hidden" checked={selectedPayment === method.id} onChange={() => setSelectedPayment(method.id)} />
                                        <div className={`size-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${selectedPayment === method.id ? 'bg-[#0df2a2] text-[#0A0A0A]' : 'bg-white/5 text-gray-500'}`}>
                                            <span className="material-symbols-outlined text-[28px]">{method.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className={`block font-extrabold tracking-tight ${selectedPayment === method.id ? 'text-white' : 'text-gray-400'}`}>{method.name}</span>
                                            <span className="block text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{method.desc}</span>
                                        </div>
                                        {selectedPayment === method.id && (
                                            <div className="text-[#0df2a2] animate-in zoom-in duration-300">
                                                <span className="material-symbols-outlined">check_circle</span>
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </section>

                        {/* Section 4: Newsletter & Privacy */}
                        <section className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <input type="checkbox" id="newsletter" className="mt-1.5 w-5 h-5 rounded border-white/10 bg-white/5 text-[#0df2a2] focus:ring-[#0df2a2] focus:ring-offset-[#0A0A0A] cursor-pointer" />
                                <label htmlFor="newsletter" className="text-xs text-gray-500 leading-relaxed cursor-pointer font-medium selection:bg-[#0df2a2]/30">
                                    Ik ontvang graag de wekelijkse VoiceRealty nieuwsbrief met exclusieve vastgoedmarketing tips, updates over nieuwe producten en persoonlijke aanbiedingen.
                                </label>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="bg-[#1A1D1C]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0df2a2]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 tracking-tight">
                                <span className="material-symbols-outlined text-[#0df2a2]">verified_user</span>
                                Bestelling Afronden
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>Totaal excl. BTW</span>
                                    <span className="text-white font-bold">€ {(total).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>Verzending</span>
                                    <span className="text-[#0df2a2] font-bold uppercase">Gratis</span>
                                </div>
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>BTW (21%)</span>
                                    <span className="text-white font-bold">€ {tax.toFixed(2)}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Totaalbedrag</span>
                                        <span className="text-[9px] text-white/30 font-medium italic">Inclusief BTW</span>
                                    </div>
                                    <span className="text-3xl font-black text-[#0df2a2] tracking-tighter drop-shadow-[0_0_15px_rgba(13,242,162,0.3)] text-right">
                                        € {finalTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={isPlacingOrder}
                                className="w-full bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-[#0A0A0A] font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(13,242,162,0.2)] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 group/btn text-lg uppercase tracking-tighter disabled:opacity-50 disabled:cursor-not-allowed">
                                {isPlacingOrder ? 'VERWERKEN...' : 'BESTELLING PLAATSEN'}
                                <span className={isPlacingOrder ? "w-5 h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" : "material-symbols-outlined font-bold transition-transform group-hover/btn:translate-x-1"}>
                                    {isPlacingOrder ? '' : 'lock'}
                                </span>
                            </button>

                            <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-4 justify-center grayscale opacity-40">
                                <div className="h-6 w-10 bg-white/10 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest">iDEAL</div>
                                <div className="h-6 w-10 bg-white/10 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest">VISA</div>
                                <div className="h-6 w-10 bg-white/10 rounded flex items-center justify-center text-[8px] font-black uppercase tracking-widest">MAST</div>
                            </div>
                        </div>

                        <div className="bg-[#1A1D1C]/30 border border-white/5 rounded-2xl p-5">
                            <div className="flex items-center gap-3 text-white/40 mb-3">
                                <span className="material-symbols-outlined text-[18px]">verified</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Kopersbescherming</span>
                            </div>
                            <p className="text-[10px] text-gray-600 leading-relaxed font-medium">U bestelt veilig bij VoiceRealty. Al onze betalingen worden verwerkt door een beveiligde SSL verbinding.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
