import { CartProvider } from '@/context/CartContext'
import ShopAccountSidebar from '@/components/shop/ShopAccountSidebar'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return (
        <CartProvider>
            <div className="flex min-h-screen bg-[#0A0A0A] text-[#F8FAFC]">
                <ShopAccountSidebar />
                <main className="flex-1 md:ml-72 min-h-screen overflow-x-hidden pb-20">
                    {children}
                </main>
            </div>
        </CartProvider>
    )
}
