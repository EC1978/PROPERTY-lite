'use client'

import { useState, use, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import ImageUpload from '@/components/ImageUpload';

export default function ProductConfigurator({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { addItem } = useCart();

    const [productDef, setProductDef] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const [quantity, setQuantity] = useState(1);
    const [deliverySpeed, setDeliverySpeed] = useState('Standaard');
    const [selections, setSelections] = useState<Record<string, number>>({});
    const [customImages, setCustomImages] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [activeImage, setActiveImage] = useState<string>('');
    const configRef = useRef<HTMLDivElement>(null);

    // Help normalize options (object or array) to a common array format
    const normalizeOptions = (options: any): any[] => {
        if (!options) return [];
        if (Array.isArray(options)) {
            return options.map(cat => ({
                ...cat,
                options: cat.options.map((opt: any) => ({
                    ...opt,
                    // If safety fallback is needed, map cat.hidePrice to opt.hidePrice for backward compatibility
                    hidePrice: opt.hidePrice ?? cat.hidePrice ?? false,
                    desc: opt.desc || '',
                    badge: opt.badge || '',
                    deliveryTime: opt.deliveryTime || ''
                }))
            }));
        }
        // Legacy Record<string, ProductOption[]>
        return Object.entries(options).map(([name, opts]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            options: (opts as any[]).map(opt => ({
                ...opt,
                hidePrice: opt.hidePrice ?? false,
                desc: opt.desc || '',
                badge: opt.badge || '',
                deliveryTime: opt.deliveryTime || ''
            }))
        }));
    };

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
                const normalizedOptions = normalizeOptions(data.options);
                setProductDef({
                    id: data.slug,
                    dbId: data.id,
                    name: data.name,
                    basePrice: data.base_price,
                    image: data.images ? data.images[0] : '',
                    images: data.images || [],
                    options: normalizedOptions
                });
                if (data.images && data.images.length > 0) {
                    setActiveImage(data.images[0]);
                }

                // Initialize selections by index
                const initialSelections: Record<string, number> = {};
                normalizedOptions.forEach((cat: any) => {
                    initialSelections[cat.id] = 0;
                });
                setSelections(initialSelections);
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
                <h1 className="text-2xl font-black text-white mb-2 tracking-tight uppercase">Product niet gevonden</h1>
                <p className="text-zinc-500 mb-8 max-w-sm">
                    Het product dat u probeert te bekijken (<strong>{id}</strong>) kan niet worden gevonden of bestaat niet meer.
                </p>
                <Link href="/shop" className="px-8 py-4 bg-[#10b77f] text-[#0A0A0A] font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,183,127,0.3)]">
                    Terug naar de shop
                </Link>
            </div>
        );
    }

    // State for the currently expanded step in the accordion
    const [expandedStep, setExpandedStep] = useState<string | 'quantity' | 'upload'>('quantity');

    // Helper to advance to next step
    const advanceNext = (currentStepId: string) => {
        const normalized = productDef?.options || [];
        const currentIndex = normalized.findIndex((cat: any) => cat.id === currentStepId);

        if (currentStepId === 'quantity') {
            if (normalized.length > 0) setExpandedStep(normalized[0].id);
            else setExpandedStep('upload');
        } else if (currentIndex !== -1 && currentIndex < normalized.length - 1) {
            setExpandedStep(normalized[currentIndex + 1].id);
        } else {
            setExpandedStep('upload');
        }
    };

    const handleSelectOption = (catId: string, optIdx: number) => {
        setSelections(prev => ({ ...prev, [catId]: optIdx }));
        // Auto-advance to next step with slight delay for visual feedback
        setTimeout(() => advanceNext(catId), 400);
    };

    // Dynamic Price Calculation
    const calculateBasePerUnit = () => {
        let total = productDef?.basePrice || 0;
        if (productDef?.options) {
            productDef.options.forEach((cat: any) => {
                const selectionIdx = selections[cat.id] ?? 0;
                const opt = cat.options[selectionIdx];
                if (opt) total += opt.price || 0;
            });
        }
        return total;
    };

    const basePerUnit = calculateBasePerUnit();

    // Pricing calculation logic for bulk and speed
    const calculateTotal = () => {
        let discountFactor = 1;
        if (quantity >= 10) discountFactor = 0.8;
        else if (quantity >= 5) discountFactor = 0.9;
        else if (quantity >= 2) discountFactor = 0.95;

        let speedMarkup = 1;
        if (deliverySpeed === 'Express') speedMarkup = 1.25;
        if (deliverySpeed === 'Spoed') speedMarkup = 1.5;

        return (basePerUnit * quantity * discountFactor * speedMarkup);
    };

    const handleAddToCart = async () => {
        if (!productDef) return;
        setIsAddingToCart(true);

        try {
            const dynamicOptions: any[] = [];
            if (productDef.options) {
                productDef.options.forEach((cat: any) => {
                    const selectionIdx = selections[cat.id] ?? 0;
                    const opt = cat.options[selectionIdx];
                    if (opt) {
                        dynamicOptions.push({
                            name: cat.name,
                            value: opt.label,
                            price: opt.price
                        });
                    }
                });
            }

            dynamicOptions.push({ name: 'Levering', value: deliverySpeed, price: 0 });
            if (notes) dynamicOptions.push({ name: 'Opmerkingen', value: notes, price: 0 });

            addItem({
                productId: productDef.id,
                dbId: productDef.dbId,
                name: productDef.name,
                basePrice: productDef.basePrice,
                quantity: quantity,
                image: productDef.image,
                options: dynamicOptions,
                customImages: customImages,
                speed: deliverySpeed,
                notes: notes
            });
            router.push('/shop/cart');
        } catch (err) {
            console.error("Error adding to cart:", err);
        } finally {
            setIsAddingToCart(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-[#0A0A0A] items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#10b77f]/20 border-t-[#10b77f] animate-spin shadow-[0_0_20px_rgba(16,183,127,0.2)]"></div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col min-h-screen bg-[#0A0A0A] text-white">
            {/* Top Header */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/shop')}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-zinc-900 transition-all border border-white/5 group"
                    >
                        <span className="material-symbols-outlined text-zinc-400 group-hover:text-white transition-colors">arrow_back</span>
                    </button>
                    <h1 className="text-[11px] font-black tracking-[0.3em] text-white uppercase italic">
                        {productDef.name} <span className="text-[#10b77f] not-italic ml-2">Samenstellen</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/shop/cart" className="size-11 rounded-full bg-[#10b77f]/10 border border-[#10b77f]/20 text-[#10b77f] flex items-center justify-center hover:bg-[#10b77f]/20 transition-all shadow-[0_0_15px_rgba(16,183,127,0.1)] group relative">
                        <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                        <div className="absolute -top-1 -right-1 size-4 bg-[#10b77f] rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-[9px] font-black text-[#0A0A0A]">
                            +
                        </div>
                    </Link>
                </div>
            </header>

            {/* Product Configuration Flow */}
            <div className="max-w-[1400px] mx-auto px-4 py-12 w-full">
                {/* Hero Section */}
                <div className="mb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left: Product Gallery */}
                    <div className="space-y-8">
                        <div className="aspect-[4/5] bg-zinc-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden group relative glass-panel shadow-[0_40px_80px_rgba(0,0,0,0.2)]">
                            {activeImage ? (
                                <Image
                                    src={activeImage}
                                    alt={productDef.name}
                                    fill
                                    className="object-contain p-10 lg:p-14 transition-transform duration-1000 group-hover:scale-105"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                    <span className="material-symbols-outlined text-8xl">image</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {productDef.images && productDef.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                                {productDef.images.map((img: string, i: number) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(img)}
                                        className={`relative size-12 rounded-xl border transition-all flex-shrink-0 bg-zinc-900/50 p-1 overflow-hidden ${activeImage === img ? 'border-[#10b77f] ring-4 ring-[#10b77f]/10 shadow-[0_0_15px_rgba(16,183,127,0.15)] scale-105' : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/10'}`}
                                    >
                                        <Image src={img} alt={`Thumbnail ${i}`} fill className="object-contain p-1" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Product Intro */}
                    <div className="lg:pt-20 space-y-12">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#10b77f]/10 text-[#10b77f] text-[9px] font-black uppercase tracking-[0.3em] border border-[#10b77f]/10">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b77f] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b77f]"></span>
                                </span>
                                Handcrafted Selection
                            </div>
                            <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter leading-none uppercase italic selection:bg-[#10b77f] selection:text-black break-words max-w-full">
                                {productDef.name}
                            </h2>
                        </div>

                        <p className="text-zinc-500 text-xl max-w-sm font-medium leading-relaxed italic border-l-4 border-[#10b77f]/30 pl-8 transition-all hover:border-[#10b77f] cursor-default">
                            Breng je merk tot leven. Stel je eigen <span className="text-zinc-300">{productDef.name.toLowerCase()}</span> samen met onze premium configurator.
                        </p>

                        <button
                            onClick={() => {
                                setExpandedStep('quantity');
                                configRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="group flex items-center gap-8 px-14 py-7 bg-[#10b77f] text-[#0A0A0A] rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#10b77f]/90 transition-all shadow-[0_20px_50px_rgba(16,183,127,0.2)] active:scale-[0.97] mt-8"
                        >
                            Begin Configuratie
                            <span className="material-symbols-outlined group-hover:translate-x-3 transition-transform text-xl">east</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-6" ref={configRef}>
                    {/* Configuration Steps */}
                    <div className="space-y-4">
                        {/* Step 1: Quantity */}
                        <div className={`rounded-[2rem] border transition-all duration-500 overflow-hidden ${expandedStep === 'quantity' ? 'border-[#10b77f]/30 glass-panel shadow-[0_20px_60px_rgba(16,183,127,0.05)] ring-1 ring-[#10b77f]/10' : 'border-white/5 bg-zinc-900/40 hover:border-white/10'}`}>
                            <button
                                onClick={() => setExpandedStep('quantity')}
                                className="w-full text-left p-8 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${expandedStep === 'quantity' ? 'bg-[#10b77f] text-[#0A0A0A] shadow-[0_0_20px_rgba(16,183,127,0.4)]' : 'bg-zinc-800 text-zinc-500'}`}>01</div>
                                    <div>
                                        <h3 className="text-white font-black uppercase tracking-widest text-[11px]">Aantal</h3>
                                        {expandedStep !== 'quantity' && (
                                            <p className="text-[10px] text-[#10b77f] font-black uppercase tracking-widest mt-1 opacity-70 italic">{quantity} stuks geselecteerd</p>
                                        )}
                                    </div>
                                </div>
                                {expandedStep !== 'quantity' && (
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[#10b77f] text-lg font-bold">check_circle</span>
                                        <span className="material-symbols-outlined text-zinc-600 group-hover:text-[#10b77f] text-sm transition-colors">edit_square</span>
                                    </div>
                                )}
                            </button>

                            {expandedStep === 'quantity' && (
                                <div className="px-8 pb-10 border-t border-white/5 pt-10 animate-in fade-in slide-in-from-top-6 duration-700">
                                    <div className="flex flex-col gap-10">
                                        <div className="space-y-6 max-w-sm">
                                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-[0.2em] italic opacity-60">Hoeveel stuks heb je nodig?</p>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                                    className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-6 px-8 text-white text-4xl font-black outline-none focus:border-[#10b77f]/50 focus:bg-zinc-950 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                                />
                                                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">STUKS</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => advanceNext('quantity')}
                                            className="w-full sm:w-auto px-12 py-5 bg-[#10b77f] hover:bg-[#10b77f]/90 text-[#0A0A0A] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#10b77f]/20 active:scale-[0.98] outline-none"
                                        >
                                            Verder naar product opties
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dynamics Steps from Product Options */}
                        {productDef.options.map((cat: any, catIdx: number) => {
                            const stepNum = catIdx + 2;
                            const isExpanded = expandedStep === cat.id;
                            const selectedOptIdx = selections[cat.id] ?? 0;
                            const selectedOpt = cat.options[selectedOptIdx];

                            return (
                                <div key={cat.id} className={`rounded-[2rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'border-[#10b77f]/30 glass-panel shadow-[0_20px_60px_rgba(16,183,127,0.05)] ring-1 ring-[#10b77f]/10' : 'border-white/5 bg-zinc-900/40 hover:border-white/10'}`}>
                                    <button
                                        onClick={() => setExpandedStep(cat.id)}
                                        className="w-full text-left p-8 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${isExpanded ? 'bg-[#10b77f] text-[#0A0A0A] shadow-[0_0_20px_rgba(16,183,127,0.4)]' : 'bg-zinc-800 text-zinc-500'}`}>
                                                {stepNum < 10 ? `0${stepNum}` : stepNum}
                                            </div>
                                            <div>
                                                <h3 className="text-white font-black uppercase tracking-widest text-[11px]">{cat.name}</h3>
                                                {!isExpanded && selectedOpt && (
                                                    <p className="text-[10px] text-[#10b77f] font-black uppercase tracking-widest mt-1 opacity-70 italic">{selectedOpt.label} geselecteerd</p>
                                                )}
                                            </div>
                                        </div>
                                        {!isExpanded && (
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-[#10b77f] text-lg font-bold animate-in zoom-in duration-700">check_circle</span>
                                                <span className="material-symbols-outlined text-zinc-600 group-hover:text-[#10b77f] text-sm transition-colors">edit_square</span>
                                            </div>
                                        )}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-8 pb-10 border-t border-white/5 pt-10 animate-in fade-in slide-in-from-top-6 duration-700">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                                                {cat.options.map((opt: any, idx: number) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSelectOption(cat.id, idx)}
                                                        className={`relative p-4 rounded-[1.5rem] border transition-all hover:shadow-xl hover:-translate-y-0.5 h-full flex flex-col gap-3 group ${selections[cat.id] === idx
                                                            ? 'border-[#10b77f] bg-[#10b77f]/5 ring-1 ring-[#10b77f]/10 shadow-[0_10px_30px_rgba(16,183,127,0.1)]'
                                                            : 'border-white/5 bg-zinc-950/30 hover:border-white/20'
                                                            }`}
                                                    >
                                                        {opt.badge && (
                                                            <div className="absolute top-0 left-4 -translate-y-1/2 bg-[#10b77f] text-[#0A0A0A] text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-widest z-10 italic">
                                                                {opt.badge}
                                                            </div>
                                                        )}

                                                        <div className="w-full aspect-square bg-zinc-900/40 rounded-xl flex items-center justify-center overflow-hidden relative border border-white/5">
                                                            {opt.icon ? (
                                                                <span className="material-symbols-outlined text-3xl text-zinc-700 group-hover:text-[#10b77f] transition-all duration-700">{opt.icon}</span>
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <span className="material-symbols-outlined text-3xl text-zinc-800">image</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 flex flex-col">
                                                            <span className="block font-black text-[10px] mb-1 text-white leading-tight uppercase tracking-wide">{opt.label}</span>

                                                            <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                                                                {!opt.hidePrice ? (
                                                                    <span className="text-[9px] text-[#10b77f] font-black uppercase tracking-widest italic">
                                                                        {opt.price > 0 ? `+€${opt.price.toFixed(2)}` : opt.price < 0 ? `-€${Math.abs(opt.price).toFixed(2)}` : 'Inbegrepen'}
                                                                    </span>
                                                                ) : <div />}
                                                            </div>
                                                        </div>

                                                        {selections[cat.id] === idx && (
                                                            <div className="absolute top-3 right-3 flex items-center justify-center size-5 bg-[#10b77f] rounded-full shadow-[0_0_10px_rgba(16,183,127,0.5)] z-20">
                                                                <span className="material-symbols-outlined text-[#0A0A0A] text-[12px] font-black">check</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Step Final: Upload */}
                        <div className={`rounded-[2rem] border transition-all duration-500 overflow-hidden ${expandedStep === 'upload' ? 'border-[#10b77f]/30 glass-panel shadow-[0_20px_60px_rgba(16,183,127,0.05)] ring-1 ring-[#10b77f]/10' : 'border-white/5 bg-zinc-900/40 hover:border-white/10'}`}>
                            <button
                                onClick={() => setExpandedStep('upload')}
                                className="w-full text-left p-8 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 ${expandedStep === 'upload' ? 'bg-[#10b77f] text-[#0A0A0A] shadow-[0_0_20px_rgba(16,183,127,0.4)]' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {productDef.options.length + 2 < 10 ? `0${productDef.options.length + 2}` : productDef.options.length + 2}
                                    </div>
                                    <h3 className="text-white font-black uppercase tracking-widest text-[11px]">Bestanden & Opmerkingen</h3>
                                </div>
                            </button>

                            {expandedStep === 'upload' && (
                                <div className="px-8 pb-10 border-t border-white/5 pt-10 animate-in fade-in slide-in-from-top-6 duration-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest italic opacity-60">Ontwerp uploaden</h4>
                                                <p className="text-xs text-zinc-500 font-medium leading-relaxed italic border-l-2 border-[#10b77f]/20 pl-4 transition-all hover:border-[#10b77f]">Upload je bestanden voor een optimale kwaliteit.</p>
                                            </div>
                                            <div className="glass-panel p-6 rounded-3xl border border-white/5">
                                                <ImageUpload
                                                    onUpload={(url: string) => setCustomImages([...customImages, url])}
                                                />
                                            </div>
                                            {customImages.length > 0 && (
                                                <div className="flex flex-wrap gap-4 pt-2">
                                                    {customImages.map((url, i) => (
                                                        <div key={i} className="relative w-28 h-28 rounded-3xl overflow-hidden border border-white/10 shadow-xl group glass-panel">
                                                            <img src={url} alt="Uploaded" className="w-full h-full object-cover p-2" />
                                                            <button
                                                                onClick={() => setCustomImages(prev => prev.filter((_, idx) => idx !== i))}
                                                                className="absolute inset-0 bg-[#10b77f]/80 items-center justify-center hidden group-hover:flex transition-all duration-500"
                                                            >
                                                                <span className="material-symbols-outlined text-[#0A0A0A] font-black text-3xl">delete</span>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest italic opacity-60">Extra informatie</h4>
                                                <p className="text-xs text-zinc-500 font-medium leading-relaxed italic border-l-2 border-[#10b77f]/20 pl-4 transition-all hover:border-[#10b77f]">Heb je nog specifieke wensen of instructies?</p>
                                            </div>
                                            <textarea
                                                placeholder="Bijv: Logo graag in het midden uitgelijnd..."
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                className="w-full h-[220px] bg-zinc-950/50 border border-white/10 rounded-3xl p-8 text-[13px] text-zinc-300 outline-none focus:border-[#10b77f]/50 focus:bg-zinc-950 transition-all shadow-inner placeholder:text-zinc-700 italic"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Section (New Bottom Panel) */}
                    <div className="mt-12 space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left: Summary Recap */}
                            <div className="bg-zinc-900/40 rounded-[2.5rem] p-10 border border-white/5 glass-panel relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Samenvatting</h3>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic opacity-50">Product</span>
                                </div>

                                <div className="flex gap-8 items-start relative z-10">
                                    <div className="size-24 bg-zinc-950 rounded-2xl border border-white/5 p-2 flex-shrink-0">
                                        <img src={productDef.image} alt={productDef.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black text-white leading-tight">{quantity} &times; {productDef.name}</p>
                                            {productDef.options.map((cat: any) => {
                                                const sel = selections[cat.id] ?? 0;
                                                const opt = cat.options[sel];
                                                return (
                                                    <div key={cat.id} className="flex gap-4 text-[10px] leading-tight group/line">
                                                        <span className="text-zinc-500 font-bold w-16 uppercase tracking-tight italic">{cat.name}</span>
                                                        <span className="text-zinc-300 font-medium italic group-hover/line:text-[#10b77f] transition-colors">{opt.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[9px] text-[#10b77f] font-black uppercase tracking-widest cursor-pointer hover:underline italic">Aanleverspecificaties</p>
                                    </div>
                                </div>

                                <div className="mt-12 space-y-4 relative z-10">
                                    <div className="flex items-end justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic leading-none mb-3">Totaal excl. btw</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-black text-white italic">€</span>
                                                <span className="text-4xl font-black text-white tracking-tighter italic">{calculateTotal().toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[9px] text-zinc-500 font-bold italic uppercase tracking-widest">Verzendkosten (gratis)</p>
                                            <p className="text-[9px] text-zinc-500 font-bold italic uppercase tracking-widest">Verpakkingskosten (inbegrepen)</p>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex flex-col gap-4">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isAddingToCart || !quantity || (customImages.length === 0 && productDef.name !== 'Ander Product')}
                                            className="w-full bg-[#10b77f] text-[#0A0A0A] py-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#10b77f]/90 transition-all flex items-center justify-center gap-4 disabled:opacity-30 active:scale-[0.97] outline-none shadow-[0_20px_40px_rgba(16,183,127,0.2)] group/btn"
                                        >
                                            {isAddingToCart ? (
                                                <div className="w-5 h-5 border-3 border-[#0A0A0A]/20 border-t-[#0A0A0A] rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined font-black text-xl group-hover:rotate-12 transition-transform">local_mall</span>
                                                    Toevoegen aan winkelwagen
                                                </>
                                            )}
                                        </button>
                                        <button className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] hover:text-white transition-colors italic">Samenstelling opslaan</button>
                                    </div>

                                    <div className="pt-6 flex items-center gap-3 opacity-40">
                                        <span className="material-symbols-outlined text-[#10b77f] text-sm font-black">info</span>
                                        <p className="text-[9px] font-black text-[#10b77f] uppercase tracking-widest italic">Profiteer van korting bij hoge volumes.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Delivery Dates */}
                            <div className="bg-zinc-900/40 rounded-[2.5rem] p-10 border border-white/5 glass-panel h-full">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 relative z-10">
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Beschikbare leverdatums</h3>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic opacity-50">Logistiek</span>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    {[
                                        { day: 'Donderdag', date: '5 mrt', price: 11.83, icon: 'local_shipping' },
                                        { day: 'Vrijdag', date: '6 mrt', price: 8.87, icon: 'local_shipping' },
                                        { day: 'Zaterdag', date: '7 mrt', price: 4.43, icon: 'local_shipping' },
                                        { day: 'Maandag', date: '9 mrt', price: 4.43, icon: 'local_shipping' },
                                        { day: 'Dinsdag', date: '10 mrt', price: 0, label: 'Geen spoedkosten', icon: 'local_shipping' }
                                    ].map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setDeliverySpeed(item.price > 5 ? 'Spoed' : item.price > 0 ? 'Express' : 'Standaard')}
                                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group ${((item.price > 5 && deliverySpeed === 'Spoed') ||
                                                (item.price > 0 && item.price <= 5 && deliverySpeed === 'Express') ||
                                                (item.price === 0 && deliverySpeed === 'Standaard'))
                                                ? 'bg-[#10b77f]/5 border-[#10b77f]/30' : 'bg-zinc-950/20 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`p-3 rounded-xl transition-all ${((item.price > 5 && deliverySpeed === 'Spoed') ||
                                                    (item.price > 0 && item.price <= 5 && deliverySpeed === 'Express') ||
                                                    (item.price === 0 && deliverySpeed === 'Standaard'))
                                                    ? 'bg-[#10b77f]/10 text-[#10b77f]' : 'bg-zinc-900 text-zinc-600 group-hover:text-zinc-400'}`}>
                                                    <span className="material-symbols-outlined text-xl font-bold">{item.icon}</span>
                                                </div>
                                                <p className="text-[11px] font-black text-white italic uppercase tracking-tight">{item.day} {item.date}</p>
                                            </div>
                                            <div className="text-right">
                                                {item.price > 0 ? (
                                                    <span className="text-[10px] font-black text-white italic">€ {item.price.toFixed(2)}</span>
                                                ) : (
                                                    <span className="text-[9px] font-black text-[#10b77f] uppercase tracking-widest italic">{item.label}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-8 text-[9px] text-zinc-500 font-bold italic uppercase tracking-widest leading-relaxed opacity-60">
                                    Je kiest de gewenste datum tijdens het afronden van je bestelling.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
