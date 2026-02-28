'use client'

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CheckoutStepper } from '@/components/shop/CheckoutStepper';

export default function ShoppingCartPage() {
    const { items, updateQuantity, removeItem, subtotal, shipping, total } = useCart();
    const router = useRouter();

    const tax = subtotal * 0.21;
    const finalTotal = total + tax;

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#F8FAFC] font-sans pb-32">
            <CheckoutStepper />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

                {items.length === 0 ? (
                    <div className="py-20 text-center bg-[#1A1D1C]/40 backdrop-blur-xl border border-white/5 rounded-3xl">
                        <div className="size-24 bg-[#0df2a2]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#0df2a2]/20">
                            <span className="material-symbols-outlined text-[#0df2a2] text-[48px]">shopping_cart</span>
                        </div>
                        <h3 className="text-2xl font-extrabold mb-3 tracking-tight text-white">Je winkelmand is nog leeg</h3>
                        <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed">Het lijkt erop dat je nog geen producten hebt toegevoegd. Bekijk onze premium vastgoed displays voor je volgende opdracht.</p>
                        <Link href="/shop" className="inline-flex items-center gap-3 px-8 py-4 bg-[#0df2a2] text-[#0A0A0A] font-extrabold rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(13,242,162,0.3)]">
                            BEKIJK PRODUCTEN
                            <span className="material-symbols-outlined">trending_flat</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Cart Items Section (Left) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-extrabold flex items-center gap-3 tracking-tight">
                                    <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#0df2a2]">inventory_2</span>
                                    </div>
                                    Jouw Bestelling <span className="text-white/40 font-medium">({items.length})</span>
                                </h3>
                                <button className="text-xs font-bold text-[#0df2a2]/60 hover:text-[#0df2a2] transition-colors">WINKELMAND LEEGMAKEN</button>
                            </div>

                            <div className="bg-[#1A1D1C]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                                {items.map((item, idx) => (
                                    <div key={item.id} className={`p-6 flex flex-col sm:flex-row gap-6 transition-all hover:bg-white/[0.02] ${idx !== items.length - 1 ? 'border-b border-white/5' : ''}`}>
                                        <div className="w-full sm:w-32 h-32 rounded-2xl bg-black/40 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 relative group">
                                            <Image src={item.image} alt={item.name} fill className="object-contain p-4 transition-transform group-hover:scale-110" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-extrabold text-lg text-white mb-1 group-hover:text-[#0df2a2] transition-colors tracking-tight">{item.name}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.options.map((o, i) => (
                                                            <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                                {o.value}
                                                            </span>
                                                        ))}
                                                        {item.speed && (
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.speed === 'Spoed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                item.speed === 'Express' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                                    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                                }`}>
                                                                {item.speed} Levering
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-xl font-black text-[#0df2a2]">
                                                        €{((item.basePrice + item.options.reduce((s: number, o: any) => s + (o.price || 0), 0)) * item.quantity).toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 font-medium">Excl. BTW</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-4 px-3 py-1.5 bg-black/40 rounded-xl border border-white/10">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="material-symbols-outlined text-[#0df2a2] hover:text-white transition-colors text-[20px]">remove</button>
                                                    <span className="text-sm font-black w-6 text-center text-white">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="material-symbols-outlined text-[#0df2a2] hover:text-white transition-colors text-[20px]">add</button>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="flex items-center gap-2 text-xs text-red-500/60 hover:text-red-400 transition-colors font-bold uppercase tracking-widest">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    Verwijder
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary Section (Right Sticky Sidebar) */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 pb-20 lg:pb-0">
                            <div className="bg-[#1A1D1C]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0df2a2]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 tracking-tight">
                                    <span className="material-symbols-outlined text-[#0df2a2]">shopping_bag</span>
                                    Betaaloverzicht
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-gray-400 font-medium">
                                        <span>Artikelen ({items.length})</span>
                                        <span className="text-white font-bold">€{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400 font-medium">
                                        <span>Verzending</span>
                                        <span className="text-[#0df2a2] font-bold">GRATIS</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400 font-medium">
                                        <span>BTW (21%)</span>
                                        <span className="text-white font-bold">€{tax.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/5">
                                        <div className="flex justify-between items-end mb-8">
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Totaalbedrag</span>
                                                <span className="text-xs text-white/30 font-medium italic">Inclusief BTW</span>
                                            </div>
                                            <span className="text-4xl font-black text-[#0df2a2] tracking-tighter drop-shadow-[0_0_15px_rgba(13,242,162,0.3)]">
                                                €{finalTotal.toFixed(2)}
                                            </span>
                                        </div>

                                        <Link href="/shop/checkout/upload" className="w-full bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-[#0A0A0A] font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(13,242,162,0.2)] flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95 group/btn text-lg">
                                            BESTELLING AFRONDEN
                                            <span className="material-symbols-outlined font-bold transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
                                        </Link>

                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                                <span className="material-symbols-outlined text-[#0df2a2] text-[14px]">verified</span>
                                                Veilig betalen via iDEAL & Creditcard
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                                                <span className="material-symbols-outlined text-[#0df2a2] text-[14px]">local_shipping</span>
                                                Gratis bezorging in heel NL & BE
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Promotional card / Help */}
                            <div className="bg-[#1A1D1C]/30 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                                <div className="size-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-gray-400">support_agent</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white mb-0.5">Hulp nodig?</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Onze experts staan klaar om je te helpen.</p>
                                </div>
                                <button className="ml-auto text-[10px] font-black text-[#0df2a2] uppercase tracking-widest">Chat</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
