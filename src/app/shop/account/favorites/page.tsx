'use client'

import Link from 'next/link'
import { useState } from 'react'

const DUMMY_FAVORITES = [
    {
        id: 'beachflags',
        name: 'Beachflags',
        price: '45.00',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYgsaWzFQgxvZTSiPkK30eSfArAQImbr25piFoeqEl13Bwl2KTstJDc7z5fsDOEy4-9pJGtFWKlysCgihiYNRnobe8dypYTVIBIgUREqfkHJlg6Jb5A6h7OFYMPa2HqRAZ8gQR5dyJuVEDbkZ18ke4A0ZP4g2nsySZHB5siMB1XjXXjQXUHQFeAOLVW-_3iECsWstj63yQEbG-2KWqJp5sEDGcacS3697ZC3pPdvrGWZSpfHKqxr0FQKRL8ZBC9qNEPZr2XTgV3vo',
        category: 'Promotie'
    },
    {
        id: 'dropflags',
        name: 'Dropflags',
        price: '48.00',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAv8XvMVtEwPrmmSjf4PowiQT294UaIpm56xnhXbWJ5kZFk8SseUZzx68dbFgpggpbaW1SYw6hPa2qwPv5mC9b51dZchdn1_pdqSvUcqwDR2AEJlDCwc7FZfhCz8uyJigHD2vUF5Fki6J6ZGBjGHyjOvOXFCj2nVli3TOs39c9iPVtLCC-g1CjRbnlN6mUCLCJS_uIueG2Eq2Fh9eFDku5VRmoGfXcDJovYYECXfKFNt5Iw8X1kD3DWvhkzj2nx2Lw-MyiITOw-OaI',
        category: 'Promotie'
    }
]

export default function FavoritesPage() {
    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Favorieten</span>
                </div>
            </nav>

            {/* Page Title */}
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn favorieten</h1>
            </div>

            {/* Favorites Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {DUMMY_FAVORITES.map((product) => (
                    <Link href={`/shop/product/${product.id}`} key={product.id} className="group">
                        <article className="bg-[#1A1D1C]/20 backdrop-blur-md border border-white/5 hover:border-[#0df2a2] transition-all duration-300 rounded-[32px] p-6 flex flex-col items-center text-center h-full active:scale-95">
                            <div className="w-full aspect-square flex items-center justify-center mb-6 overflow-hidden rounded-2xl bg-white/5 relative border border-white/5">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="size-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <span className="material-symbols-outlined text-gray-800 text-[48px]">image</span>
                                )}
                            </div>
                            <h3 className="text-sm font-black text-white mb-1 group-hover:text-[#0df2a2] transition-colors truncate w-full tracking-tight">{product.name}</h3>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">{product.category}</p>

                            <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="font-bold text-white text-sm">€ {product.price}</span>
                                <span className="material-symbols-outlined text-[#0df2a2] fill-1 text-[20px]">favorite</span>
                            </div>
                        </article>
                    </Link>
                ))}
            </div>
        </div>
    )
}
