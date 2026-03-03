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
                    <div className="py-32 text-center glass-panel border border-white/5 rounded-[3rem] animate-in fade-in zoom-in duration-1000 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#10b77f]/5 to-transparent opacity-50"></div>
                        <div className="size-32 bg-[#10b77f]/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-[#10b77f]/20 shadow-[0_0_50px_rgba(16,183,127,0.1)] relative z-10">
                            <span className="material-symbols-outlined text-[#10b77f] text-[64px] font-black">shopping_basket</span>
                        </div>
                        <h3 className="text-4xl font-black mb-4 tracking-tighter text-white uppercase italic relative z-10">Je winkelmand is leeg</h3>
                        <p className="text-zinc-500 mb-12 max-w-sm mx-auto leading-relaxed font-medium italic relative z-10">Tijd om je merk naar een hoger niveau te tillen met onze premium displays.</p>
                        <Link href="/shop" className="inline-flex items-center gap-6 px-12 py-6 bg-[#10b77f] text-[#0A0A0A] font-black rounded-2xl hover:bg-[#10b77f]/90 transition-all shadow-[0_20px_50px_rgba(16,183,127,0.2)] active:scale-95 uppercase tracking-widest text-xs italic relative z-10">
                            Terug naar Shop
                            <span className="material-symbols-outlined font-black">east</span>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Cart Items Section (Left) */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-black flex items-center gap-4 tracking-tighter uppercase italic">
                                    <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,183,127,0.1)]">
                                        <span className="material-symbols-outlined text-[#10b77f] font-black">inventory_2</span>
                                    </div>
                                    Winkelmand <span className="text-[#10b77f] opacity-50 not-italic ml-2">[{items.length}]</span>
                                </h3>
                                <button className="text-[10px] font-black text-[#10b77f] hover:text-[#10b77f]/80 transition-all uppercase tracking-[0.2em] italic border-b border-[#10b77f]/20 pb-1">Winkelmand leegmaken</button>
                            </div>

                            <div className="glass-panel border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                {items.map((item, idx) => (
                                    <div key={item.id} className={`p-8 flex flex-col sm:flex-row gap-8 transition-all hover:bg-white/[0.02] ${idx !== items.length - 1 ? 'border-b border-white/5' : ''} animate-in slide-in-from-left-4 duration-700`}>
                                        <div className="w-full sm:w-40 h-40 rounded-[2rem] bg-zinc-900/60 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5 relative group p-4">
                                            <Image src={item.image} alt={item.name} fill className="object-contain p-6 transition-transform duration-1000 group-hover:scale-110" />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-2">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-black text-xl text-white mb-3 group-hover:text-[#10b77f] transition-colors tracking-tight uppercase italic">{item.name}</h4>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {item.options.map((o, i) => (
                                                            <span key={i} className="px-3 py-1 rounded-lg bg-[#10b77f]/5 border border-[#10b77f]/10 text-[9px] text-[#10b77f] font-black uppercase tracking-widest italic opacity-70">
                                                                {o.value}
                                                            </span>
                                                        ))}
                                                        {item.speed && (
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic ${item.speed === 'Spoed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                                item.speed === 'Express' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                                    'bg-[#10b77f]/10 text-[#10b77f] border border-[#10b77f]/20'
                                                                }`}>
                                                                {item.speed} Levering
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-2xl font-black text-white italic tracking-tighter shadow-glow">
                                                        €{((item.basePrice + item.options.reduce((s: number, o: any) => s + (o.price || 0), 0)) * item.quantity).toFixed(2)}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-600 font-black uppercase italic tracking-widest">Excl. BTW</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-6 px-4 py-2 bg-black/40 rounded-xl border border-white/10 shadow-inner">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="material-symbols-outlined text-[#10b77f] hover:text-white transition-all text-[22px] font-black">remove</button>
                                                    <span className="text-sm font-black w-8 text-center text-white">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="material-symbols-outlined text-[#10b77f] hover:text-white transition-all text-[22px] font-black">add</button>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="flex items-center gap-3 text-[10px] text-zinc-600 hover:text-red-500/80 transition-all font-black uppercase tracking-[0.2em] italic group">
                                                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-12 transition-transform">delete_sweep</span>
                                                    Verwijderen
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Summary Section (Right Sticky Sidebar) */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 pb-20 lg:pb-0">
                            <div className="glass-panel border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b77f]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10b77f]/10 transition-all duration-1000"></div>
                                <h3 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase italic relative z-10">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black">shopping_bag</span>
                                    Overzicht
                                </h3>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                        <span>Artikelen ({items.length})</span>
                                        <span className="text-white not-italic">€{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                        <span>Verzending</span>
                                        <span className="text-[#10b77f] not-italic">GRATIS</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                        <span>BTW (21%)</span>
                                        <span className="text-white not-italic">€{tax.toFixed(2)}</span>
                                    </div>

                                    <div className="pt-8 mt-4 border-t border-white/5">
                                        <div className="flex justify-between items-end mb-10">
                                            <div className="flex flex-col">
                                                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 italic">Totaalbedrag</span>
                                                <span className="text-[8px] text-[#10b77f] font-black uppercase tracking-widest italic opacity-40">Inclusief BTW</span>
                                            </div>
                                            <span className="text-5xl font-black text-[#10b77f] tracking-tighter italic drop-shadow-[0_0_30px_rgba(16,183,127,0.2)]">
                                                €{finalTotal.toFixed(2)}
                                            </span>
                                        </div>

                                        <Link href="/shop/checkout/upload" className="w-full bg-[#10b77f] hover:bg-[#10b77f]/90 text-[#0A0A0A] font-black py-6 rounded-2xl shadow-[0_20px_40px_rgba(16,183,127,0.25)] flex items-center justify-center gap-4 transition-all transform hover:scale-[1.02] active:scale-95 group/btn text-xs uppercase tracking-widest italic">
                                            Afrekenen
                                            <span className="material-symbols-outlined font-black transition-transform group-hover/btn:translate-x-3">east</span>
                                        </Link>

                                        <div className="mt-8 space-y-4">
                                            <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-black uppercase tracking-widest italic opacity-50">
                                                <span className="material-symbols-outlined text-[#10b77f] text-[16px] font-black">verified</span>
                                                Veilig betalen via iDEAL & Creditcard
                                            </div>
                                            <div className="flex items-center gap-4 text-[9px] text-zinc-500 font-black uppercase tracking-widest italic opacity-50">
                                                <span className="material-symbols-outlined text-[#10b77f] text-[16px] font-black">local_shipping</span>
                                                Gratis bezorging in heel NL & BE
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Promotional card / Help */}
                            <div className="glass-panel border-white/5 rounded-3xl p-6 flex items-center gap-5 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#10b77f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-[#10b77f]/30 transition-all">
                                    <span className="material-symbols-outlined text-zinc-500 group-hover:text-[#10b77f] transition-all font-black">support_agent</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-white mb-1 uppercase tracking-widest italic">Hulp nodig?</p>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase opacity-60">Onze agenten helpen je graag.</p>
                                </div>
                                <button className="ml-auto text-[10px] font-black text-[#10b77f] uppercase tracking-[0.2em] italic border border-[#10b77f]/20 px-4 py-2 rounded-xl hover:bg-[#10b77f] hover:text-[#0A0A0A] transition-all relative z-10">Chat</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
