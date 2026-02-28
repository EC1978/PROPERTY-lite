'use client'

import Link from 'next/link';
import Image from 'next/image';
import ShopAccountSidebar from '@/components/shop/ShopAccountSidebar';
import MobileNav from '@/components/layout/MobileNav';
import { useCart } from '@/context/CartContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ShopCategoryPage() {
    const { items } = useCart();
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('shop_products')
                .select('*')
                .order('name');

            if (data) {
                // Map the DB structure to the expected frontend structure
                const formattedProducts = data.map(p => ({
                    id: p.slug,
                    name: p.name,
                    image: p.images && p.images.length > 0 ? p.images[0] : ''
                }));
                setProducts(formattedProducts);
            }
            setIsLoading(false);
        };

        fetchProducts();
    }, []);

    return (
        <>
            <nav className="px-6 pt-8 pb-4" data-purpose="breadcrumb">
                <div className="flex items-center text-xs uppercase tracking-widest text-gray-500 font-semibold gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span>/</span>
                    <span className="text-[#F8FAFC]">Producten</span>
                </div>
            </nav>

            <header className="px-6 mb-8 md:max-w-5xl md:mx-auto" data-purpose="page-title">
                <h1 className="text-4xl font-bold mb-2 tracking-tight text-[#F8FAFC]">Producten</h1>
                <div className="flex justify-between items-end">
                    <p className="text-sm text-gray-400">Toont alle {products.length} resultaten</p>

                    <div className="relative" data-purpose="sorting-filter">
                        <select className="bg-transparent border-none text-xs font-semibold text-[#0df2a2] focus:ring-0 cursor-pointer pr-8 py-0 outline-none">
                            <option className="bg-[#0A0A0A]">Standaard sortering</option>
                            <option className="bg-[#0A0A0A]">Nieuwste eerst</option>
                            <option className="bg-[#0A0A0A]">Prijs: laag naar hoog</option>
                            <option className="bg-[#0A0A0A]">Prijs: hoog naar laag</option>
                        </select>
                    </div>
                </div>
            </header>

            <section className="px-4 md:px-6 md:max-w-7xl md:mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6" data-purpose="product-listing">
                {products.map((product) => (
                    <Link href={`/shop/product/${product.id}`} key={product.id} className="group">
                        <article className="bg-[#FFFFFF]/[0.03] backdrop-blur-md border border-white/10 hover:border-[#0df2a2] transition-all duration-300 rounded-2xl p-4 flex flex-col items-center text-center h-full active:scale-95">
                            <div className="w-full aspect-square flex items-center justify-center mb-4 overflow-hidden rounded-lg bg-white/5 relative">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                    sizes="(max-width: 768px) 50vw, 33vw"
                                />
                            </div>
                            <h3 className="text-sm md:text-base font-semibold mb-3 text-white truncate w-full">{product.name}</h3>
                            <div className="mt-auto w-full pt-2">
                                <button className="w-full py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg border border-[#0df2a2] text-[#0df2a2] group-hover:bg-[#0df2a2] group-hover:text-[#0A0A0A] group-hover:shadow-[0_0_10px_rgba(13,242,162,0.5)] transition-all">
                                    Bekijk Opties
                                </button>
                            </div>
                        </article>
                    </Link>
                ))}
            </section>

            {/* Floating cart action (only shown on shop pages for quick access) */}
            <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
                <Link href="/shop/cart" className="relative w-14 h-14 bg-[#0df2a2] rounded-full shadow-[0_0_20px_rgba(13,242,162,0.4)] hover:shadow-[0_0_25px_rgba(13,242,162,0.6)] flex items-center justify-center text-[#0A0A0A] hover:scale-105 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold size-5 flex items-center justify-center rounded-full border-2 border-[#0A0A0A]">
                            {cartItemCount}
                        </span>
                    )}
                </Link>
            </div>
            <MobileNav />
        </>
    );
}
