'use client'

import Link from 'next/link';
import Image from 'next/image';
import ShopAccountSidebar from '@/components/shop/ShopAccountSidebar';
import MobileNav from '@/components/layout/MobileNav';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toggleFavorite, getFavorites } from './account/favorites/actions';
import toast from 'react-hot-toast';

export default function ShopCategoryPage() {
    const { items } = useCart();
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userFavorites, setUserFavorites] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const supabase = createClient();
            
            // Fetch Products
            const { data: productsData, error: productsError } = await supabase
                .from('shop_products')
                .select('*')
                .eq('is_archived', false)
                .order('name');

            if (productsData) {
                const formattedProducts = productsData.map(p => ({
                    id: p.slug,
                    dbId: p.id,
                    name: p.name,
                    price: p.base_price,
                    image: p.images && p.images.length > 0 ? p.images[0] : ''
                }));
                setProducts(formattedProducts);
            }

            // Fetch User Favorites
            const favResult = await getFavorites();
            if (favResult.success && favResult.favorites) {
                setUserFavorites(favResult.favorites.map((f: any) => f.product_id));
            }
            
            setIsLoading(false);
        };

        fetchData();
    }, []);

    const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
        e.preventDefault();
        e.stopPropagation();

        // We also need the DB ID to toggle if we're using slugs for URLs
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const result = await toggleFavorite(product.dbId);
        if (result.success) {
            if (result.action === 'added') {
                setUserFavorites(prev => [...prev, product.dbId]);
                toast.success('Toegevoegd aan favorieten', { icon: '❤️' });
            } else {
                setUserFavorites(prev => prev.filter(id => id !== product.dbId));
                toast.success('Verwijderd uit favorieten', { icon: '💔' });
            }
        } else {
            toast.error(result.error || 'Fout bij bijwerken favorieten');
        }
    };

    return (
        <>
            <nav className="px-6 pt-8 pb-4" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black gap-3 italic">
                    <Link href="/dashboard" className="hover:text-[#10b77f] transition-all cursor-pointer">Dashboard</Link>
                    <span className="opacity-30">/</span>
                    <span className="text-white">Producten</span>
                </div>
            </nav>

            <header className="px-6 mb-8 md:max-w-5xl md:mx-auto" data-purpose="page-title">
                <h1 className="text-5xl font-black mb-4 tracking-tighter text-white uppercase italic selection:bg-[#10b77f] selection:text-black">Producten</h1>
                <div className="flex justify-between items-center">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic opacity-50">Toont alle {products.length} resultaten</p>

                    <div className="relative" data-purpose="sorting-filter">
                        <select
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#10b77f] focus:ring-0 cursor-pointer pr-8 py-0 outline-none italic"
                            suppressHydrationWarning
                        >
                            <option className="bg-[#0A0A0A]">Standaard sortering</option>
                            <option className="bg-[#0A0A0A]">Nieuwste eerst</option>
                            <option className="bg-[#0A0A0A]">Prijs: laag naar hoog</option>
                            <option className="bg-[#0A0A0A]">Prijs: hoog naar laag</option>
                        </select>
                    </div>
                </div>
            </header>

            <section className="px-4 md:px-6 md:max-w-7xl md:mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6" data-purpose="product-listing">
                {products.map((product) => (
                    <Link href={`/shop/product/${product.id}`} key={product.id} className="group relative">
                        <button
                            onClick={(e) => handleToggleFavorite(e, product.id)}
                            className="absolute top-4 right-4 z-20 size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:bg-[#10b77f] hover:text-[#0A0A0A] hover:border-[#10b77f] transition-all duration-300"
                        >
                            <span className={`material-symbols-outlined text-[20px] ${userFavorites.includes(product.dbId) ? 'fill-1 text-[#0df2a2]' : ''}`}>
                                favorite
                            </span>
                        </button>
                        <article className="glass-panel hover:border-[#10b77f]/40 transition-all duration-700 rounded-[2.5rem] p-6 flex flex-col items-center text-center h-full active:scale-95 group-hover:shadow-[0_40px_80px_rgba(16,183,127,0.05)] border-white/5 bg-zinc-900/40 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#10b77f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="w-full aspect-square flex items-center justify-center mb-6 overflow-hidden rounded-[2rem] bg-zinc-900/60 relative border border-white/5 p-4">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-6 group-hover:scale-110 transition-transform duration-1000"
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                />
                            </div>
                            <h3 className="text-[14px] font-black mb-2 text-white truncate w-full uppercase tracking-tight">{product.name}</h3>
                            <p className="text-[11px] text-[#10b77f] font-black italic tracking-widest mb-6 opacity-80 uppercase">Vanaf €{product.price.toFixed(2)}</p>
                            <div className="mt-auto w-full">
                                <button className="w-full py-3.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl border border-[#10b77f]/30 text-[#10b77f] group-hover:bg-[#10b77f] group-hover:text-[#0A0A0A] group-hover:shadow-[0_0_20px_rgba(16,183,127,0.3)] transition-all relative z-10 italic">
                                    Bekijk Opties
                                </button>
                            </div>
                        </article>
                    </Link>
                ))}
            </section>

            {/* Floating cart action */}
            <div className="fixed bottom-20 md:bottom-8 right-8 z-50">
                <Link href="/shop/cart" className="relative size-16 bg-[#10b77f] rounded-full shadow-[0_20px_50px_rgba(16,183,127,0.3)] hover:shadow-[0_25px_60px_rgba(16,183,127,0.5)] flex items-center justify-center text-[#0A0A0A] hover:scale-110 active:scale-90 transition-all group">
                    <span className="material-symbols-outlined text-3xl font-black group-hover:rotate-12 transition-transform">shopping_cart</span>
                    {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-white text-[#0A0A0A] text-[10px] font-black size-6 flex items-center justify-center rounded-full border-4 border-[#0A0A0A]">
                            {cartItemCount}
                        </span>
                    )}
                </Link>
            </div>
            <MobileNav />
        </>
    );
}
