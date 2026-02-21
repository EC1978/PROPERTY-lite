'use client'

import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'

export default function ShopPage() {
    // userEmail usually comes from server components, for now we mock it or keep it simple
    const userEmail = ""

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
            <Sidebar userEmail={userEmail} />

            <main className="flex-1 md:ml-72 p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-white mb-6">Shop</h1>
                    <div className="bg-[#111] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="size-20 bg-[#0df2a2]/10 rounded-full flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-[#0df2a2] text-[40px]">shopping_cart</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Binnenkort beschikbaar</h2>
                        <p className="text-gray-400 max-w-md">
                            Onze shop is momenteel in onderhoud. Hier kun je binnenkort extra AI-minuten, premium stemmen en meer aanschaffen.
                        </p>
                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
