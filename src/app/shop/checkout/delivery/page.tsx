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
                } else if (data.length > 0) {
                    setSelectedAddress(data[0].id);
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
                postcode: newAddr.postcode, // Note: I should use the correct column name from DB
                zipcode: newAddr.postcode,
                city: newAddr.plaats,
                is_default: newAddr.is_default || false
            })
            .select()
            .single();

        if (data) {
            setAddresses(prev => [data, ...prev.map(a => newAddr.is_default ? { ...a, is_default: false } : a)]);
            setSelectedAddress(data.id);
            setShowAddressForm(false);
        }
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
                                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                                    <div className="size-8 border-2 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Adressen laden...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {addresses.map((addr) => (
                                        <label key={addr.id} className={`group relative flex cursor-pointer rounded-2xl border-2 p-5 transition-all hover:scale-[1.01] ${selectedAddress === addr.id ? 'border-[#0df2a2] bg-[#0df2a2]/5 shadow-[0_0_20px_rgba(13,242,162,0.1)]' : 'border-white/5 bg-[#1A1D1C]/60 hover:border-white/20'}`}>
                                            <input
                                                type="radio"
                                                name="address"
                                                checked={selectedAddress === addr.id}
                                                onChange={() => setSelectedAddress(addr.id)}
                                                className="mt-1 h-5 w-5 appearance-none rounded-full border-2 border-slate-600 bg-transparent checked:border-[#0df2a2] checked:bg-[#0df2a2] focus:ring-0 relative before:content-[''] before:absolute before:inset-[3.5px] before:rounded-full before:bg-[#0A0A0A] before:opacity-0 checked:before:opacity-100 transition-all cursor-pointer"
                                            />
                                            <div className="ml-4 flex flex-1 flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="block text-sm font-extrabold text-[#F8FAFC] tracking-tight truncate max-w-[150px]">{addr.name}</span>
                                                    {addr.is_default && (
                                                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest bg-[#0df2a2] text-[#0A0A0A]">Standaard</span>
                                                    )}
                                                </div>
                                                <span className="block text-xs text-gray-500 leading-relaxed truncate">{addr.street}, {addr.city}</span>
                                                <span className="block text-[10px] text-gray-400 mt-1">{addr.contact}</span>
                                            </div>
                                            {selectedAddress === addr.id && (
                                                <div className="absolute top-4 right-4 text-[#0df2a2]">
                                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                    {/* New Address Card */}
                                    <button
                                        onClick={() => setShowAddressForm(true)}
                                        className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#0df2a2]/30 transition-all group min-h-[110px]"
                                    >
                                        <div className="size-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#0df2a2]/10 transition-colors">
                                            <span className="material-symbols-outlined text-gray-500 group-hover:text-[#0df2a2]">add_location_alt</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 group-hover:text-white uppercase tracking-widest">Nieuw adres toevoegen</span>
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Section 2: Bezorgmoment */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#0df2a2]">schedule</span>
                                </div>
                                <h3 className="text-xl font-extrabold tracking-tight">Kies uw <span className="text-[#0df2a2]">levermoment</span></h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={`flex flex-col cursor-pointer rounded-2xl border-2 p-6 transition-all hover:scale-[1.01] ${selectedTiming === 'standaard' ? 'border-[#0df2a2] bg-[#0df2a2]/5' : 'border-white/5 bg-[#1A1D1C]/60 hover:border-white/20'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <input
                                            type="radio"
                                            name="timing"
                                            checked={selectedTiming === 'standaard'}
                                            onChange={() => setSelectedTiming('standaard')}
                                            className="h-5 w-5 appearance-none rounded-full border-2 border-slate-600 bg-transparent checked:border-[#0df2a2] checked:bg-[#0df2a2] focus:ring-0 relative before:content-[''] before:absolute before:inset-[3.5px] before:rounded-full before:bg-[#0A0A0A] before:opacity-0 checked:before:opacity-100 transition-all cursor-pointer"
                                        />
                                        <span className="text-xs font-black text-[#0df2a2] tracking-widest uppercase">Gratis</span>
                                    </div>
                                    <span className="text-lg font-extrabold text-white tracking-tight">Standaard Levering</span>
                                    <span className="text-xs text-gray-500 mt-1">Verwachte levering: 10 maart</span>
                                </label>

                                <label className={`flex flex-col cursor-pointer rounded-2xl border-2 p-6 transition-all hover:scale-[1.01] ${selectedTiming === 'ochtend' ? 'border-[#0df2a2] bg-[#0df2a2]/5' : 'border-white/5 bg-[#1A1D1C]/60 hover:border-white/20'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <input
                                            type="radio"
                                            name="timing"
                                            checked={selectedTiming === 'ochtend'}
                                            onChange={() => setSelectedTiming('ochtend')}
                                            className="h-5 w-5 appearance-none rounded-full border-2 border-slate-600 bg-transparent checked:border-[#0df2a2] checked:bg-[#0df2a2] focus:ring-0 relative before:content-[''] before:absolute before:inset-[3.5px] before:rounded-full before:bg-[#0A0A0A] before:opacity-0 checked:before:opacity-100 transition-all cursor-pointer"
                                        />
                                        <span className="text-xs font-black text-white/40 tracking-widest uppercase">+€10,00</span>
                                    </div>
                                    <span className="text-lg font-extrabold text-white tracking-tight">Ochtend Levering</span>
                                    <span className="text-xs text-gray-500 mt-1">Gegarandeerd voor 10:00 uur</span>
                                </label>
                            </div>
                        </section>

                        {/* Section 3: Extra Opties */}
                        <section className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-full bg-white/5 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-gray-400">person_pin</span>
                                    </div>
                                    <div>
                                        <p className="font-extrabold text-white tracking-tight">Factuuradres is gelijk aan bezorgadres</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Bespaar tijd bij het afrekenen</p>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input defaultChecked type="checkbox" className="sr-only peer" />
                                    <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white/40 after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-[#0df2a2] peer-checked:after:bg-[#0A0A0A] peer-checked:after:opacity-100"></div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="bg-[#1A1D1C]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0df2a2]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 tracking-tight">
                                <span className="material-symbols-outlined text-[#0df2a2]">receipt_long</span>
                                Besteloverzicht
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>Producten (totaal)</span>
                                    <span className="text-white font-bold">€ {(total * 1.21).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>Bezorging ({selectedTiming})</span>
                                    <span className={selectedTiming === 'standaard' ? 'text-[#0df2a2] font-bold' : 'text-white font-bold'}>
                                        {selectedTiming === 'standaard' ? 'GRATIS' : '€ 10.00'}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Te betalen</span>
                                        <span className="text-[9px] text-white/30 font-medium italic">Inclusief 21% BTW</span>
                                    </div>
                                    <span className="text-3xl font-black text-[#0df2a2] tracking-tighter drop-shadow-[0_0_15px_rgba(13,242,162,0.3)] text-right">
                                        € {(total * 1.21 + (selectedTiming === 'ochtend' ? 10 : 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <Link href="/shop/checkout/payment" className="w-full bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-[#0A0A0A] font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(13,242,162,0.2)] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 group/btn text-lg">
                                NAAR BETALING
                                <span className="material-symbols-outlined font-bold transition-transform group-hover/btn:translate-x-1">payments</span>
                            </Link>

                            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-gray-500 text-[18px]">info</span>
                                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">U kunt uw adresgegevens en levermethode later nog inzien in uw account.</p>
                                </div>
                                <Link href="/shop/cart" className="flex items-center gap-2 text-xs font-bold text-[#0df2a2]/60 hover:text-[#0df2a2] transition-colors uppercase tracking-widest text-[10px]">
                                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
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
