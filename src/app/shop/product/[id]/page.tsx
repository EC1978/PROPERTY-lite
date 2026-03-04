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
    const scrollRef = useRef<HTMLDivElement>(null);

    // Help normalize options (object or array) to a common array format
    const normalizeOptions = (options: any): any[] => {
        if (!options) return [];
        if (Array.isArray(options)) {
            return options.map((cat, idx) => ({
                ...cat,
                id: cat.id || `cat-${idx}`, // Ensure a unique ID exists
                name: cat.name,
                condition: cat.condition, // Pass through the condition
                options: cat.options.map((opt: any) => ({
                    ...opt,
                    hidePrice: opt.hidePrice ?? cat.hidePrice ?? false,
                    desc: opt.desc || '',
                    badge: opt.badge || '',
                    deliveryTime: opt.deliveryTime || '',
                    isDefault: opt.isDefault ?? false
                }))
            }));
        }
        // Legacy Record<string, ProductOption[]>
        return Object.entries(options).map(([name, opts], idx) => ({
            id: `legacy-${idx}-${name.toLowerCase().replace(/\s+/g, '-')}`, // Unique ID per entry
            name: name,
            options: (opts as any[]).map(opt => ({
                ...opt,
                hidePrice: opt.hidePrice ?? false,
                desc: opt.desc || '',
                badge: opt.badge || '',
                deliveryTime: opt.deliveryTime || '',
                isDefault: opt.isDefault ?? false
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
                .eq('is_archived', false)
                .single();

            // Fallback: Try fetching by UUID if slug fails (in case of direct links)
            if (!data && id.length === 36) {
                const { data: idData, error: idError } = await supabase
                    .from('shop_products')
                    .select('*')
                    .eq('id', id)
                    .eq('is_archived', false)
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

                // Initialize selections based on isDefault flag, fallback to index 0
                const initialSelections: Record<string, number> = {};
                normalizedOptions.forEach((cat: any) => {
                    const defaultIdx = cat.options.findIndex((opt: any) => opt.isDefault);
                    initialSelections[cat.id] = defaultIdx !== -1 ? defaultIdx : 0;
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

    // Filter visible options based on internal conditional logic
    const visibleOptions = useMemo(() => {
        if (!productDef?.options) return [];
        return productDef.options.filter((cat: any) => {
            if (!cat.condition || !cat.condition.parentId) return true;
            const parentSelectionIdx = selections[cat.condition.parentId] ?? 0;
            return cat.condition.showIfIndices.includes(parentSelectionIdx);
        });
    }, [productDef, selections]);

    // State for the currently expanded step in the accordion
    const [expandedStep, setExpandedStep] = useState<string | 'quantity'>('quantity');

    // Helper to advance to next step
    const advanceNext = (currentStepId: string) => {
        const visible = visibleOptions;
        const currentIndex = visible.findIndex((cat: any) => cat.id === currentStepId);

        if (currentStepId === 'quantity') {
            if (visible.length > 0) setExpandedStep(visible[0].id);
        } else if (currentIndex !== -1 && currentIndex < visible.length - 1) {
            setExpandedStep(visible[currentIndex + 1].id);
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
        // Important: Only calculate price for VISIBLE categories
        visibleOptions.forEach((cat: any) => {
            const selectionIdx = selections[cat.id] ?? 0;
            const opt = cat.options[selectionIdx];
            if (opt) total += opt.price || 0;
        });
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
            // Only add VISIBLE options to cart
            visibleOptions.forEach((cat: any) => {
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

    const isVideo = (url: string | null) => {
        if (!url) return false
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov']
        return videoExtensions.some(ext => url.toLowerCase().endsWith(ext)) || url.includes('video')
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
            <div className="mx-auto px-4 py-12 w-full">
                {/* Hero Section */}
                <div className="max-w-5xl mx-auto mb-12 lg:mb-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left: Product Gallery */}
                    <div className="space-y-6">
                        <div className="aspect-square max-w-[500px] mx-auto bg-white rounded-[2.5rem] border border-white/10 overflow-hidden group relative shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
                            {activeImage ? (
                                isVideo(activeImage) ? (
                                    <video
                                        key={activeImage}
                                        src={activeImage}
                                        className="w-full h-full object-contain p-4 lg:p-8"
                                        controls
                                        playsInline
                                    />
                                ) : (
                                    <Image
                                        src={activeImage}
                                        alt={productDef.name}
                                        fill
                                        className="object-contain p-10 lg:p-14 transition-transform duration-1000 group-hover:scale-105"
                                        priority
                                    />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-800">
                                    <span className="material-symbols-outlined text-8xl">image</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>

                        {productDef.images && productDef.images.filter(Boolean).length > 1 && (
                            <div className="relative group/gallery max-w-[500px] mx-auto">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (scrollRef.current) {
                                            scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                                        }
                                    }}
                                    className="absolute -left-6 top-1/2 -translate-y-1/2 z-[100] size-12 rounded-full bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-2xl hover:bg-[#10b77f] hover:text-black hover:scale-110 active:scale-90 transition-all cursor-pointer"
                                    aria-label="Previous thumbnails"
                                >
                                    <span className="material-symbols-outlined pointer-events-none text-2xl">chevron_left</span>
                                </button>

                                <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth no-scrollbar">
                                    {productDef.images.filter(Boolean).map((img: string, i: number) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setActiveImage(img)}
                                            className={`relative size-20 rounded-2xl border transition-all flex-shrink-0 bg-zinc-900/50 p-1 overflow-hidden group/thumb ${activeImage === img ? 'border-[#10b77f] ring-4 ring-[#10b77f]/10 shadow-[0_0_15px_rgba(16,183,127,0.15)] scale-105' : 'border-white/5 opacity-40 hover:opacity-100 hover:border-white/10'}`}
                                        >
                                            {isVideo(img) ? (
                                                <div className="w-full h-full relative">
                                                    <video
                                                        src={`${img}#t=0.1`}
                                                        className="w-full h-full object-cover rounded-xl"
                                                        preload="metadata"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                        <span className="material-symbols-outlined text-white text-xl">play_circle</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Image src={img} alt={`Thumbnail ${i}`} fill className="object-contain p-2" />
                                            )}
                                            <div className={`absolute inset-0 bg-primary/10 transition-opacity ${activeImage === img ? 'opacity-100' : 'opacity-0 group-hover/thumb:opacity-100'}`}></div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (scrollRef.current) {
                                            scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                                        }
                                    }}
                                    className="absolute -right-6 top-1/2 -translate-y-1/2 z-[100] size-12 rounded-full bg-black/90 border border-white/20 text-white flex items-center justify-center shadow-2xl hover:bg-[#10b77f] hover:text-black hover:scale-110 active:scale-90 transition-all cursor-pointer"
                                    aria-label="Next thumbnails"
                                >
                                    <span className="material-symbols-outlined pointer-events-none text-2xl">chevron_right</span>
                                </button>
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
                            className="group flex items-center gap-8 px-10 py-5 lg:px-14 lg:py-7 bg-[#10b77f] text-[#0A0A0A] rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#10b77f]/90 transition-all shadow-[0_20px_50px_rgba(16,183,127,0.2)] active:scale-[0.97] mt-8"
                        >
                            Begin Configuratie
                            <span className="material-symbols-outlined group-hover:translate-x-3 transition-transform text-xl">east</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto space-y-6" ref={configRef}>
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
                                        <div className="space-y-6 max-w-[160px]">
                                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-[0.2em] italic opacity-60">Hoeveel stuks heb je nodig?</p>
                                            <div className="relative group">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={quantity}
                                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                                    className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl py-3 px-5 text-white text-2xl font-black outline-none focus:border-[#10b77f]/50 focus:bg-zinc-950 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                                />
                                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">STUKS</span>
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
                        {visibleOptions.map((cat: any, catIdx: number) => {
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
                                                            {opt.image ? (
                                                                opt.image.match(/\.(mp4|webm|ogg|mov)$|^data:video/i) || opt.image.includes('video') ? (
                                                                    <video src={opt.image} className="w-full h-full object-cover" muted playsInline onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                                                ) : (
                                                                    <img src={opt.image} alt={opt.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                )
                                                            ) : opt.icon ? (
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

                    </div>

                    {/* Summary Section (Full Width Bottom Panel) */}
                    <div className="mt-12">
                        <div className="bg-zinc-900/40 rounded-[2.5rem] p-10 border border-white/5 glass-panel relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5 relative z-10">
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Configuratie Samenvatting</h3>
                                <div className="flex items-center gap-2">
                                    <span className="animate-pulse w-2 h-2 rounded-full bg-[#10b77f]"></span>
                                    <span className="text-[10px] font-black text-[#10b77f] uppercase tracking-widest italic">Live Berekening</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                                {/* Product Preview */}
                                <div className="lg:col-span-3">
                                    <div className="aspect-square bg-zinc-950 rounded-3xl border border-white/5 p-4 flex items-center justify-center shadow-inner group-hover:border-[#10b77f]/20 transition-all duration-500">
                                        <img src={productDef.image} alt={productDef.name} className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                                    </div>
                                </div>

                                {/* Options Details */}
                                <div className="lg:col-span-5 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-white italic uppercase tracking-tighter">{quantity} &times; {productDef.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Gekozen specificaties:</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-white/5">
                                        {visibleOptions.map((cat: any) => {
                                            const sel = selections[cat.id] ?? 0;
                                            const opt = cat.options[sel];
                                            return (
                                                <div key={cat.id} className="flex flex-col gap-1 group/line">
                                                    <span className="text-[9px] text-[#10b77f] font-black uppercase tracking-widest italic opacity-50">{cat.name}</span>
                                                    <span className="text-xs text-zinc-200 font-bold italic group-hover/line:text-[#10b77f] transition-colors">{opt.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Pricing & Actions */}
                                <div className="lg:col-span-4 flex flex-col justify-between py-2">
                                    <div className="space-y-4">
                                        <div className="flex items-baseline justify-between">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Totaal excl. btw</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-white italic">€</span>
                                                <span className="text-5xl font-black text-white tracking-tighter italic">{calculateTotal().toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 opacity-60">
                                            <p className="text-[9px] text-zinc-400 font-bold italic uppercase tracking-widest">Gratis verzending binnen NL/BE</p>
                                            <p className="text-[9px] text-zinc-400 font-bold italic uppercase tracking-widest">Inclusief kwaliteitscontrole</p>
                                        </div>
                                    </div>

                                    <div className="pt-8 space-y-4">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={isAddingToCart || !quantity}
                                            className="w-full bg-[#10b77f] text-[#0A0A0A] py-7 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] hover:bg-[#10b77f]/90 transition-all flex items-center justify-center gap-4 disabled:opacity-30 active:scale-[0.97] outline-none shadow-[LRG_SHADOW_RGBA(16,183,127,0.3)] group/btn relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                            {isAddingToCart ? (
                                                <div className="w-5 h-5 border-3 border-[#0A0A0A]/20 border-t-[#0A0A0A] rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined font-black text-2xl group-hover:rotate-12 transition-transform relative z-10">local_mall</span>
                                                    <span className="relative z-10">BESTELLING PLAATSEN</span>
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] hover:text-[#10b77f] transition-colors cursor-pointer italic">Product PDF Specificaties</p>
                                    </div>
                                </div>
                            </div>

                            {/* Accent line at bottom */}
                            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-[#10b77f]/50 to-transparent w-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
