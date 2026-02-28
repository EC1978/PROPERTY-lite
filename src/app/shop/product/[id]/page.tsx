'use client'

import { useState, use, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

export default function ProductConfigurator({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addItem } = useCart();

    const [productDef, setProductDef] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [step, setStep] = useState(1); // 1: Config, 2: Pricing Table
    const [selections, setSelections] = useState({
        formaat: 0,
        materiaal: 0,
        print: 0,
        bevestiging: 0
    });

    const [pricingSelection, setPricingSelection] = useState({
        quantity: 1,
        speed: 'Standaard' // 'Standaard', 'Express', 'Spoed'
    });

    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            const supabase = createClient();

            // Try fetching by slug first
            let { data, error } = await supabase
                .from('shop_products')
                .select('*')
                .eq('slug', id)
                .single();

            // Fallback: Try fetching by UUID if slug fails (in case of direct links)
            if (!data && id.length === 36) {
                const { data: idData, error: idError } = await supabase
                    .from('shop_products')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (idData) {
                    data = idData;
                    error = idError;
                }
            }

            if (data) {
                setProductDef({
                    id: data.slug,
                    dbId: data.id,
                    name: data.name,
                    basePrice: data.base_price,
                    image: data.images ? data.images[0] : '',
                    options: data.options
                });
            } else {
                console.error(`Product not found for ID/Slug: ${id}`, error);
            }
            setIsLoading(false);
        };

        if (id) fetchProduct();
    }, [id]);

    if (!isLoading && !productDef) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4 animate-bounce">error</span>
                <h1 className="text-2xl font-black text-white mb-2 tracking-tight">Product niet gevonden</h1>
                <p className="text-gray-500 mb-8 max-w-sm">
                    Het product dat u probeert te bekijken (<strong>{id}</strong>) kan niet worden gevonden of bestaat niet meer.
                </p>
                <Link href="/shop" className="px-8 py-4 bg-[#0df2a2] text-[#0A0A0A] font-black rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(13,242,162,0.3)]">
                    Terug naar de shop
                </Link>
            </div>
        );
    }

    const currentFormaat = productDef?.options?.formaat ? productDef.options.formaat[selections.formaat] || { price: 0, label: '' } : { price: 0, label: '' };
    const currentMateriaal = productDef?.options?.materiaal ? productDef.options.materiaal[selections.materiaal] || { price: 0, label: '' } : { price: 0, label: '' };
    const currentPrint = productDef?.options?.print ? productDef.options.print[selections.print] || { price: 0, label: '' } : { price: 0, label: '' };
    const currentBevestiging = productDef?.options?.bevestiging ? productDef.options.bevestiging[selections.bevestiging] || { price: 0, label: '' } : { price: 0, label: '' };

    const basePerUnit = (productDef?.basePrice || 0) +
        currentFormaat.price +
        currentMateriaal.price +
        currentPrint.price +
        currentBevestiging.price;

    // Pricing calculation logic
    const calculatePrice = (qty: number, speed: string) => {
        let discountFactor = 1;
        if (qty >= 10) discountFactor = 0.8;
        else if (qty >= 5) discountFactor = 0.9;
        else if (qty >= 2) discountFactor = 0.95;

        let speedMarkup = 1;
        if (speed === 'Express') speedMarkup = 1.25;
        if (speed === 'Spoed') speedMarkup = 1.5;

        return (basePerUnit * qty * discountFactor * speedMarkup);
    };

    const finalTotalPrice = calculatePrice(pricingSelection.quantity, pricingSelection.speed);

    const handleAddToCart = () => {
        if (!productDef) return;

        const dynamicOptions = [];
        if (productDef.options?.formaat) dynamicOptions.push({ name: 'Formaat', value: currentFormaat.label, price: currentFormaat.price });
        if (productDef.options?.materiaal) dynamicOptions.push({ name: 'Materiaal', value: currentMateriaal.label, price: currentMateriaal.price });
        if (productDef.options?.print) dynamicOptions.push({ name: 'Print', value: currentPrint.label, price: currentPrint.price });
        if (productDef.options?.bevestiging) dynamicOptions.push({ name: 'Bevestiging', value: currentBevestiging.label, price: currentBevestiging.price });

        dynamicOptions.push({ name: 'Levering', value: pricingSelection.speed, price: 0 });

        addItem({
            productId: id as string,
            dbId: productDef.dbId,
            name: productDef.name,
            basePrice: basePerUnit,
            quantity: pricingSelection.quantity,
            image: productDef.image,
            options: dynamicOptions
        });
        router.push('/shop/cart');
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-[#0A0A0A] items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-[#0df2a2]/20 border-t-[#0df2a2] animate-spin"></div>
            </div>
        );
    }

    if (!productDef) {
        return (
            <div className="flex min-h-screen bg-[#0A0A0A] items-center justify-center text-white flex-col gap-4">
                <h1 className="text-xl font-bold">Product niet gevonden</h1>
                <Link href="/shop" className="text-[#0df2a2] flex items-center gap-2 hover:underline">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Terug naar shop
                </Link>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col min-h-screen bg-[#0A0A0A]">
            {/* Top Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => step === 2 ? setStep(1) : router.push('/shop')}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-100">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-extrabold tracking-tight text-[#F8FAFC] uppercase">
                        {productDef.name} <span className="text-[#0df2a2]">{step === 1 ? 'Configureer' : 'Afrekenen'}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center bg-white/5 rounded-full px-4 py-1 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <span className={step === 1 ? 'text-[#0df2a2]' : ''}>Stap 1</span>
                        <span className="mx-2">/</span>
                        <span className={step === 2 ? 'text-[#0df2a2]' : ''}>Stap 2</span>
                    </div>
                    <Link href="/shop/cart" className="size-10 rounded-full bg-[#0df2a2]/20 border border-[#0df2a2]/50 text-[#0df2a2] flex items-center justify-center shadow-[0_0_15px_rgba(13,242,162,0.3)]">
                        <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 md:pb-6">

                {/* Left Panel (Always visible preview) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="sticky top-24">
                        <div className="relative rounded-2xl overflow-hidden bg-[#111111] aspect-square flex items-center justify-center border border-white/5 shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0df2a2]/5 to-transparent opacity-50"></div>
                            <div className="relative z-10 w-full h-full p-12">
                                <Image
                                    src={productDef.image}
                                    alt={productDef.name}
                                    fill
                                    className="object-contain drop-shadow-[0_0_30px_rgba(13,242,162,0.2)] p-12"
                                />
                            </div>
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold text-white/50 border border-white/5 uppercase">3D Preview</span>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="mt-6 bg-[#1A1D1C]/60 backdrop-blur-md rounded-xl p-6 border border-white/10">
                            <h3 className="text-sm font-bold mb-4 text-[#0df2a2] flex items-center gap-2 uppercase tracking-widest">
                                <span className="material-symbols-outlined text-[18px]">list_alt</span>
                                Samenvatting
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex justify-between text-xs border-b border-white/5 pb-2">
                                    <span className="text-gray-500">Product</span>
                                    <span className="text-white font-semibold">{productDef.name}</span>
                                </li>
                                {productDef?.options?.formaat && (
                                    <li className="flex justify-between text-xs border-b border-white/5 pb-2">
                                        <span className="text-gray-500">Formaat</span>
                                        <span className="text-white font-semibold">{currentFormaat.label.split(' ')[0]}</span>
                                    </li>
                                )}
                                {productDef?.options?.materiaal && (
                                    <li className="flex justify-between text-xs border-b border-white/5 pb-2">
                                        <span className="text-gray-500">Materiaal</span>
                                        <span className="text-white font-semibold">{currentMateriaal.label.split(' (')[0]}</span>
                                    </li>
                                )}
                                {productDef?.options?.bevestiging && (
                                    <li className="flex justify-between text-xs">
                                        <span className="text-gray-500">Bevestiging</span>
                                        <span className="text-white font-semibold">{currentBevestiging.label}</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Final Action Button (Moved to sticky sidebar) */}
                        {step === 2 && (
                            <div className="mt-6 p-6 bg-[#0df2a2] rounded-xl shadow-[0_0_30px_rgba(13,242,162,0.2)]">
                                <div className="mb-4">
                                    <span className="text-[10px] font-bold text-[#0A0A0A]/60 uppercase tracking-widest block mb-1">Totaalprijs (ex. BTW)</span>
                                    <div className="text-2xl font-extrabold text-[#0A0A0A]">€ {finalTotalPrice.toFixed(2)}</div>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full bg-[#0A0A0A] text-[#0df2a2] py-4 rounded-xl font-extrabold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all shadow-xl active:scale-95"
                                >
                                    ORDER AFRONDEN
                                    <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
                                </button>
                                <p className="text-[9px] text-[#0A0A0A]/60 font-medium text-center mt-3">Gratis verzending in heel Nederland</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel (Changes based on Step) */}
                <div className="lg:col-span-8">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Kies uw <span className="text-[#0df2a2]">opties</span></h2>
                                <p className="text-gray-500 text-sm mb-6">Stel uw product samen voor de beste kwaliteit en prijs.</p>
                            </div>

                            {/* Formaat Card */}
                            {productDef.options?.formaat && (
                                <div className="md:col-span-2 bg-[#1A1D1C]/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 group hover:border-[#0df2a2]/30 transition-all">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[#0df2a2]">aspect_ratio</span>
                                        </div>
                                        <h4 className="font-bold text-lg">Formaat</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {productDef.options.formaat.map((opt: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelections({ ...selections, formaat: idx })}
                                                className={`relative p-4 rounded-xl border text-left transition-all group/btn ${selections.formaat === idx
                                                    ? 'bg-[#0df2a2]/10 border-[#0df2a2] text-white'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <span className="block font-bold text-sm mb-1">{opt.label}</span>
                                                <span className="block text-[10px] text-gray-500">{opt.price > 0 ? `+€${opt.price.toFixed(2)}` : opt.price < 0 ? `-€${Math.abs(opt.price).toFixed(2)}` : 'Basisformaat'}</span>
                                                {selections.formaat === idx && <div className="absolute top-2 right-2 size-2 bg-[#0df2a2] rounded-full shadow-[0_0_8px_#0df2a2]"></div>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Materiaal Card */}
                            {productDef.options?.materiaal && (
                                <div className="bg-[#1A1D1C]/60 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-[#0df2a2]/60">layers</span>
                                        <h4 className="font-bold text-base">Materiaal</h4>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {productDef.options.materiaal.map((opt: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelections({ ...selections, materiaal: idx })}
                                                className={`flex justify-between items-center p-3 rounded-lg border text-xs transition-all ${selections.materiaal === idx
                                                    ? 'bg-[#0df2a2]/10 border-[#0df2a2] text-white'
                                                    : 'bg-transparent border-white/5 text-gray-400 hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className="font-medium">{opt.label}</span>
                                                {opt.price > 0 && <span className="text-[#0df2a2] font-mono">+€{opt.price.toFixed(2)}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bevestiging Card */}
                            {productDef.options?.bevestiging && (
                                <div className="bg-[#1A1D1C]/60 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="material-symbols-outlined text-[#0df2a2]/60">construction</span>
                                        <h4 className="font-bold text-base">Bevestiging</h4>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {productDef.options.bevestiging.map((opt: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelections({ ...selections, bevestiging: idx })}
                                                className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${selections.bevestiging === idx
                                                    ? 'bg-[#0df2a2]/10 border-[#0df2a2] text-white'
                                                    : 'bg-transparent border-white/5 text-gray-400 hover:bg-white/5'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-sm mt-0.5">{opt.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <span className="block font-bold text-xs">{opt.label}</span>
                                                    <span className="block text-[9px] text-gray-500 truncate">{opt.desc}</span>
                                                </div>
                                                {opt.price > 0 && <span className="text-[#0df2a2] font-mono text-[10px]">+€{opt.price.toFixed(2)}</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 pt-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full py-5 bg-[#0df2a2] text-[#0A0A0A] font-extrabold text-lg rounded-2xl shadow-[0_0_20px_rgba(13,242,162,0.3)] hover:shadow-[0_0_30px_rgba(13,242,162,0.5)] hover:scale-[1.01] transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    VOLGENDE STAP: PRIJZEN
                                    <span className="material-symbols-outlined">trending_flat</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <h2 className="text-3xl font-extrabold mb-2 tracking-tight">Kies <span className="text-[#0df2a2]">aantal & levering</span></h2>
                            <p className="text-gray-500 text-sm mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">info</span>
                                De verwachte leverdatum geldt bij aanlevering voor 12:00 uur.
                            </p>

                            <div className="bg-[#1A1D1C]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                                {/* Table Header */}
                                <div className="grid grid-cols-4 border-b border-white/5 bg-[#0A0A0A]/40">
                                    <div className="p-4 text-xs font-bold uppercase text-gray-500 tracking-widest">Oplage</div>
                                    <div className="p-4 border-l border-white/5">
                                        <span className="px-2 py-0.5 rounded text-[8px] bg-emerald-500/20 text-emerald-400 font-bold uppercase block w-fit mb-1">Standaard</span>
                                        <div className="text-[10px] text-white font-bold">10-03-2026</div>
                                    </div>
                                    <div className="p-4 border-l border-white/5">
                                        <span className="px-2 py-0.5 rounded text-[8px] bg-orange-500/20 text-orange-400 font-bold uppercase block w-fit mb-1">Express</span>
                                        <div className="text-[10px] text-white font-bold">09-03-2026</div>
                                    </div>
                                    <div className="p-4 border-l border-white/5">
                                        <span className="px-2 py-0.5 rounded text-[8px] bg-red-500/20 text-red-400 font-bold uppercase block w-fit mb-1">Spoed</span>
                                        <div className="text-[10px] text-white font-bold">06-03-2026</div>
                                    </div>
                                </div>

                                {/* Table Body - 10 Rows */}
                                <div className="">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                                        <div key={qty} className="grid grid-cols-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <div className="p-4 flex items-center text-sm font-bold text-gray-400">{qty} st.</div>

                                            {['Standaard', 'Express', 'Spoed'].map((speed) => {
                                                const price = calculatePrice(qty, speed);
                                                const isActive = pricingSelection.quantity === qty && pricingSelection.speed === speed;
                                                return (
                                                    <button
                                                        key={speed}
                                                        onClick={() => setPricingSelection({ quantity: qty, speed })}
                                                        className={`p-4 border-l border-white/5 text-left transition-all relative ${isActive ? 'bg-[#0df2a2]/10 ring-1 ring-inset ring-[#0df2a2]' : ''}`}
                                                    >
                                                        <div className={`text-sm font-bold ${isActive ? 'text-[#0df2a2]' : 'text-white'}`}>
                                                            € {price.toFixed(2)}
                                                        </div>
                                                        <div className="text-[9px] text-gray-500 mt-0.5">Excl. BTW</div>
                                                        {isActive && <div className="absolute top-2 right-2 size-2 bg-[#0df2a2] rounded-full"></div>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
