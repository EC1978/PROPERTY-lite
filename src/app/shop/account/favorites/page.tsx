'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getFavorites, toggleFavorite } from './actions'
import toast from 'react-hot-toast'

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchFavorites = async () => {
        setIsLoading(true)
        const result = await getFavorites()
        if (result.success && result.favorites) {
            setFavorites(result.favorites)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchFavorites()
    }, [])

    const handleRemoveFavorite = async (e: React.MouseEvent, productId: string) => {
        e.preventDefault()
        e.stopPropagation()

        const result = await toggleFavorite(productId)
        if (result.success) {
            toast.success('Favoriet verwijderd', { icon: '💔' })
            fetchFavorites()
        } else {
            toast.error(result.error || 'Fout bij verwijderen')
        }
    }
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
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin"></div>
                </div>
            ) : favorites.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {favorites.map((fav) => {
                        const product = fav.shop_products
                        return (
                            <Link href={`/shop/product/${product.slug}`} key={fav.id} className="group relative">
                                <button
                                    onClick={(e) => handleRemoveFavorite(e, product.id)}
                                    className="absolute top-4 right-4 z-20 size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#0df2a2] hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300"
                                    title="Verwijder uit favorieten"
                                >
                                    <span className="material-symbols-outlined text-[20px] fill-1">favorite</span>
                                </button>
                                <article className="bg-[#1A1D1C]/20 backdrop-blur-md border border-white/5 hover:border-[#0df2a2] transition-all duration-300 rounded-[32px] p-6 flex flex-col items-center text-center h-full active:scale-95">
                                    <div className="w-full aspect-square flex items-center justify-center mb-6 overflow-hidden rounded-2xl bg-white/5 relative border border-white/5">
                                        {product.images && product.images[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="size-full object-contain p-4 group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <span className="material-symbols-outlined text-gray-800 text-[48px]">image</span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-black text-white mb-1 group-hover:text-[#0df2a2] transition-colors truncate w-full tracking-tight font-italic uppercase">{product.name}</h3>
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 italic">Product</p>

                                    <div className="mt-auto w-full pt-4 border-t border-white/5 flex items-center justify-between">
                                        <span className="font-bold text-white text-sm">€ {Number(product.base_price).toFixed(2)}</span>
                                        <div className="flex items-center gap-1 text-[#0df2a2]">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Bekijken</span>
                                            <span className="material-symbols-outlined text-[16px]">east</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <span className="material-symbols-outlined text-6xl text-gray-800 mb-4 block">favorite_border</span>
                    <p className="text-gray-500 font-bold mb-6">Je hebt nog geen favorieten gemarkeerd.</p>
                    <Link href="/shop" className="px-8 py-4 bg-[#0df2a2] text-[#0A0A0A] font-black rounded-2xl text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                        Ontdek onze producten
                    </Link>
                </div>
            )}
        </div>
    )
}
