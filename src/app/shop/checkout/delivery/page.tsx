'use client'

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useState, useEffect } from 'react';
import { CheckoutStepper } from '@/components/shop/CheckoutStepper';
import { AddressForm } from '@/components/shop/AddressForm';
import { createClient } from '@/utils/supabase/client';

export default function CheckoutDeliveryPage() {
    const router = useRouter();
    const { total } = useCart();
    const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
    const [selectedBillingAddress, setSelectedBillingAddress] = useState<string | null>(null);
    const [isBillingSame, setIsBillingSame] = useState(true);
    const [selectedTiming, setSelectedTiming] = useState('standaard');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [addresses, setAddresses] = useState<any[]>([]);

    useEffect(() => {
        const fetchAddresses = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('user_addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (data) {
                setAddresses(data);
                // Select default address if it exists, otherwise the first one
                const defaultAddr = data.find(a => a.is_default);
                if (defaultAddr) {
                    setSelectedAddress(defaultAddr.id);
                    setSelectedBillingAddress(defaultAddr.id);
                } else if (data.length > 0) {
                    setSelectedAddress(data[0].id);
                    setSelectedBillingAddress(data[0].id);
                }
            }
            setIsLoading(false);
        };

        fetchAddresses();
    }, []);

    const handleSaveAddress = async (newAddr: any) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // If this is set as default, we need to unset other defaults first
        if (newAddr.is_default) {
            await supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', user.id);
        }

        const { data, error } = await supabase
            .from('user_addresses')
            .insert({
                user_id: user.id,
                name: newAddr.bedrijf || `${newAddr.voornaam} ${newAddr.achternaam}`,
                contact: `${newAddr.voornaam} ${newAddr.achternaam}`,
                street: `${newAddr.straat} ${newAddr.nummer}`,
                postcode: newAddr.postcode,
                zipcode: newAddr.postcode,
                city: newAddr.plaats,
                is_default: newAddr.is_default || false
            })
            .select()
            .single();

        if (data) {
            setAddresses(prev => [data, ...prev.map(a => newAddr.is_default ? { ...a, is_default: false } : a)]);
            if (!selectedAddress) setSelectedAddress(data.id);
            if (!selectedBillingAddress) setSelectedBillingAddress(data.id);
            setShowAddressForm(false);
        }
    };

    const handleProceedToPayment = () => {
        if (!selectedAddress) {
            alert('Selecteer eerst een bezorgadres.');
            return;
        }
        if (!isBillingSame && !selectedBillingAddress) {
            alert('Selecteer eerst een factuuradres.');
            return;
        }

        const checkoutData = {
            shippingAddressId: selectedAddress,
            billingAddressId: isBillingSame ? selectedAddress : selectedBillingAddress,
            isBillingSame,
            selectedTiming
        };

        localStorage.setItem('voicerealty_checkout', JSON.stringify(checkoutData));
        router.push('/shop/checkout/payment');
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#F8FAFC] font-sans pb-32">
            <CheckoutStepper />

            {showAddressForm && (
                <AddressForm
                    onClose={() => setShowAddressForm(false)}
                    onSave={handleSaveAddress}
                />
            )}

            <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Delivery Options */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Section 1: Bezorgadres */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#0df2a2]">location_on</span>
                                </div>
                                <h3 className="text-xl font-extrabold tracking-tight">Kies uw <span className="text-[#0df2a2]">bezorgadres</span></h3>
                            </div>

                            {isLoading ? (
                                <div className="p-12 text-center glass-panel rounded-[2rem] border-white/5">
                                    <div className="size-10 border-4 border-[#10b77f]/20 border-t-[#10b77f] rounded-full animate-spin mx-auto mb-4 shadow-[0_0_20px_rgba(16,183,127,0.2)]"></div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">Adressen laden...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {addresses.map((addr) => (
                                        <label key={addr.id} className={`group relative flex cursor-pointer rounded-[2.5rem] border-2 p-8 transition-all duration-700 hover:scale-[1.02] overflow-hidden ${selectedAddress === addr.id ? 'glass-panel border-[#10b77f] shadow-[0_20px_50px_rgba(16,183,127,0.15)]' : 'glass-panel border-white/5 hover:border-white/20'}`}>
                                            {selectedAddress === addr.id && (
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b77f]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                            )}
                                            <input
                                                type="radio"
                                                name="address"
                                                checked={selectedAddress === addr.id}
                                                onChange={() => setSelectedAddress(addr.id)}
                                                className="mt-1.5 h-6 w-6 appearance-none rounded-full border-2 border-zinc-700 bg-transparent checked:border-[#10b77f] checked:bg-[#10b77f] focus:ring-0 relative before:content-[''] before:absolute before:inset-[4px] before:rounded-full before:bg-[#0A0A0A] before:opacity-0 checked:before:opacity-100 transition-all cursor-pointer z-10"
                                            />
                                            <div className="ml-6 flex flex-1 flex-col z-10">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="block text-lg font-black text-white tracking-tighter uppercase italic truncate max-w-[150px]">{addr.name}</span>
                                                    {addr.is_default && (
                                                        <span className="text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-[0.2em] bg-[#10b77f] text-[#0A0A0A] italic">Standaard</span>
                                                    )}
                                                </div>
                                                <span className="block text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic leading-relaxed truncate">{addr.street}, {addr.city}</span>
                                                <span className="block text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em] italic mt-2 opacity-60">{addr.contact}</span>
                                            </div>
                                            {selectedAddress === addr.id && (
                                                <div className="absolute top-6 right-6 text-[#10b77f]">
                                                    <span className="material-symbols-outlined text-[24px] font-black drop-shadow-[0_0_10px_rgba(16,183,127,0.5)]">verified</span>
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                    {/* New Address Card */}
                                    <button
                                        onClick={() => setShowAddressForm(true)}
                                        className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.01] hover:bg-[#10b77f]/2 hover:border-[#10b77f]/40 transition-all duration-700 group min-h-[140px]"
                                    >
                                        <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#10b77f] group-hover:text-[#0A0A0A] transition-all duration-500 shadow-inner">
                                            <span className="material-symbols-outlined text-zinc-600 group-hover:text-inherit font-black text-[28px]">add_location_alt</span>
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 group-hover:text-white uppercase tracking-[0.2em] transition-colors italic">Nieuw adres toevoegen</span>
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Section 2: Bezorgmoment */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,183,127,0.1)]">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black">schedule</span>
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Kies uw <span className="text-[#10b77f]">levermoment</span></h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <label className={`flex flex-col cursor-pointer rounded-[2.5rem] border-2 p-8 transition-all duration-700 hover:scale-[1.02] overflow-hidden ${selectedTiming === 'standaard' ? 'glass-panel border-[#10b77f] shadow-[0_20px_40px_rgba(16,183,127,0.1)]' : 'glass-panel border-white/5 hover:border-white/20'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <input
                                                type="radio"
                                                name="timing"
                                                checked={selectedTiming === 'standaard'}
                                                onChange={() => setSelectedTiming('standaard')}
                                                className="h-6 w-6 appearance-none rounded-full border-2 border-zinc-700 bg-transparent checked:border-[#10b77f] checked:bg-[#10b77f] focus:ring-0 relative before:content-[''] before:absolute before:inset-[4px] before:rounded-full before:bg-[#0A0A0A] before:opacity-0 checked:before:opacity-100 transition-all cursor-pointer"
                                            />
                                            <span className="text-[10px] font-black text-[#10b77f] tracking-[0.2em] uppercase italic">Gratis</span>
                                        </div>
                                        <span className="text-xl font-black text-white tracking-tighter uppercase italic">Standaard Levering</span>
                                        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic mt-2 opacity-60">Verwachte levering: 10 maart</span>
                                    </label>

                                    <label className={`flex flex-col cursor-pointer rounded-[2.5rem] border-2 p-8 transition-all duration-700 hover:scale-[1.02] overflow-hidden ${selectedTiming === 'ochtend' ? 'glass-panel border-[#10b77f] shadow-[0_20px_40px_rgba(16,183,127,0.1)]' : 'glass-panel border-white/5 hover:border-white/20'}`}>
                                        <div className="flex justify-between items-start mb-6">
                                            <input
                                                type="radio"
                                                name="timing"
                                                checked={selectedTiming === 'ochtend'}
                                                onChange={() => setSelectedTiming('ochtend')}
                                                className="h-6 w-6 appearance-none rounded-full border-2 border-zinc-700 bg-transparent checked:border-[#10b77f] checked:bg-[#10b77f] focus:ring-0 relative before:content-[''] before:absolute before:inset-[4px] before:rounded-full before:bg-[#0A0A0A] before:opacity-0 checked:before:opacity-100 transition-all cursor-pointer"
                                            />
                                            <span className="text-[10px] font-black text-white/40 tracking-[0.2em] uppercase italic">+€10,00</span>
                                        </div>
                                        <span className="text-xl font-black text-white tracking-tighter uppercase italic">Ochtend Levering</span>
                                        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest italic mt-2 opacity-60">Gegarandeerd voor 10:00 uur</span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Extra Opties */}
                        <section className="space-y-6">
                            <div className="glass-panel border-white/5 rounded-[2rem] p-10 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#10b77f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-6">
                                        <div className="size-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-inner group-hover:border-[#10b77f]/30 transition-all">
                                            <span className="material-symbols-outlined text-zinc-500 group-hover:text-[#10b77f] font-black text-[28px] transition-colors">person_pin</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-white text-lg uppercase tracking-tight italic">Factuuradres is gelijk</p>
                                            <p className="text-[11px] text-zinc-500 font-bold uppercase italic opacity-60">Bespaar tijd bij het afrekenen</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer scale-110">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isBillingSame}
                                            onChange={(e) => setIsBillingSame(e.target.checked)}
                                        />
                                        <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0A0A0A] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-800 after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-[#10b77f] peer-checked:after:bg-[#0A0A0A] shadow-inner"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Billing Address Selection (when not same) */}
                            {!isBillingSame && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-8 rounded-lg bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#10b77f] text-sm">receipt_long</span>
                                        </div>
                                        <h3 className="text-lg font-extrabold tracking-tight italic uppercase">Kies uw <span className="text-[#10b77f]">factuuradres</span></h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {addresses.map((addr) => (
                                            <label key={addr.id} className={`group relative flex cursor-pointer rounded-[2rem] border p-6 transition-all duration-500 overflow-hidden ${selectedBillingAddress === addr.id ? 'glass-panel border-[#10b77f]/50 bg-[#10b77f]/5' : 'glass-panel border-white/5 hover:border-white/10'}`}>
                                                <input
                                                    type="radio"
                                                    name="billing_address"
                                                    checked={selectedBillingAddress === addr.id}
                                                    onChange={() => setSelectedBillingAddress(addr.id)}
                                                    className="mt-1 h-5 w-5 appearance-none rounded-full border-2 border-zinc-700 bg-transparent checked:border-[#10b77f] checked:bg-[#10b77f] focus:ring-0 relative before:content-[''] before:absolute before:inset-[3px] before:rounded-full before:bg-[#0A0A0A] before:opacity-0 checked:before:opacity-100 transition-all cursor-pointer z-10"
                                                />
                                                <div className="ml-4 flex flex-1 flex-col z-10">
                                                    <span className="block text-sm font-black text-white tracking-tighter uppercase italic">{addr.name}</span>
                                                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic mt-1">{addr.street}, {addr.city}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="glass-panel border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b77f]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10b77f]/10 transition-all duration-1000"></div>
                            <h3 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase italic relative z-10">
                                <span className="material-symbols-outlined text-[#10b77f] font-black">receipt_long</span>
                                Bestelling
                            </h3>

                            <div className="space-y-6 mb-10 relative z-10">
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>Producten (totaal)</span>
                                    <span className="text-white not-italic font-black">€ {(total * 1.21).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>Bezorging ({selectedTiming})</span>
                                    <span className={`not-italic font-black uppercase tracking-widest ${selectedTiming === 'standaard' ? 'text-[#10b77f]' : 'text-white'}`}>
                                        {selectedTiming === 'standaard' ? 'GRATIS' : '€ 10.00'}
                                    </span>
                                </div>
                                <div className="pt-8 mt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 italic">Te betalen</span>
                                        <span className="text-[8px] text-[#10b77f] font-black uppercase tracking-widest italic opacity-40">Inclusief 21% BTW</span>
                                    </div>
                                    <span className="text-4xl font-black text-[#10b77f] tracking-tighter italic drop-shadow-[0_0_30px_rgba(16,183,127,0.2)] text-right">
                                        € {(total * 1.21 + (selectedTiming === 'ochtend' ? 10 : 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleProceedToPayment}
                                className="w-full bg-[#10b77f] hover:bg-[#10b77f]/90 text-[#0A0A0A] font-black py-6 rounded-2xl shadow-[0_20px_40px_rgba(16,183,127,0.2)] flex items-center justify-center gap-4 transition-all uppercase tracking-widest text-[11px] group/btn italic"
                            >
                                NAAR BETALING
                                <span className="material-symbols-outlined font-black transition-transform group-hover/btn:translate-x-2">payments</span>
                            </button>

                            <div className="mt-8 pt-6 border-t border-white/5 space-y-6 relative z-10">
                                <div className="flex items-start gap-3 opacity-30">
                                    <span className="material-symbols-outlined text-zinc-500 text-[18px] font-black">info</span>
                                    <p className="text-[9px] text-zinc-500 leading-relaxed font-black uppercase tracking-widest italic">U kunt uw adresgegevens en levermethode later nog inzien in uw account.</p>
                                </div>
                                <Link href="/shop/cart" className="flex items-center gap-3 text-[10px] font-black text-[#10b77f] hover:text-[#10b77f]/80 transition-all uppercase tracking-[0.2em] italic group/back">
                                    <span className="material-symbols-outlined text-[18px] font-black transition-transform group-hover/back:-translate-x-2">west</span>
                                    Terug naar winkelmand
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
