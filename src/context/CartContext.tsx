'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItemOption {
    name: string;
    value: string;
    price?: number;
}

export interface CartItem {
    id: string; // Unique ID for the cart line item (can be a hash of product id + options)
    productId: string; // The slug
    dbId: string; // The UUID from Supabase
    name: string;
    basePrice: number;
    options: CartItemOption[];
    quantity: number;
    image: string;
    speed?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    designUrl: string | null;
    designFileName: string | null;
    designFileSize: number | null;
    setDesignUrl: (url: string | null, name?: string | null, size?: number | null) => void;
    subtotal: number;
    shipping: number;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [designUrl, setDesignUrl] = useState<string | null>(null);
    const [designFileName, setDesignFileName] = useState<string | null>(null);
    const [designFileSize, setDesignFileSize] = useState<number | null>(null);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
        const itemOptionsTotal = item.options.reduce((optSum, opt) => optSum + (opt.price || 0), 0);
        return sum + ((item.basePrice + itemOptionsTotal) * item.quantity);
    }, 0);

    // Static shipping for now, could be dynamic later
    const shipping = 0;
    const total = subtotal + shipping;

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('voicerealty_cart');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setItems(parsed.items || []);
                setDesignUrl(parsed.designUrl || null);
                setDesignFileName(parsed.designFileName || null);
                setDesignFileSize(parsed.designFileSize || null);
            } catch (e) {
                console.error("Failed to load cart", e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('voicerealty_cart', JSON.stringify({
            items,
            designUrl,
            designFileName,
            designFileSize
        }));
    }, [items, designUrl, designFileName, designFileSize]);

    const addItem = React.useCallback((newItem: Omit<CartItem, 'id'>) => {
        setItems(prev => {
            // Very basic distinct hash for item + selected options
            const optionsHash = newItem.options.map(o => `${o.name}:${o.value}`).sort().join('|');
            const speedSuffix = newItem.speed ? `-${newItem.speed}` : '';
            const newId = `${newItem.productId}-${optionsHash}${speedSuffix}`;

            const existing = prev.find(i => i.id === newId);
            if (existing) {
                return prev.map(i => i.id === newId ? { ...i, quantity: i.quantity + newItem.quantity } : i);
            }
            return [...prev, { ...newItem, id: newId }];
        });
    }, []);

    const removeItem = React.useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const updateQuantity = React.useCallback((id: string, quantity: number) => {
        if (quantity <= 0) {
            setItems(prev => prev.filter(i => i.id !== id));
            return;
        }
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    }, []);

    const clearCart = React.useCallback(() => setItems([]), []);

    return (
        <CartContext.Provider value={{
            items, addItem, removeItem, updateQuantity, clearCart,
            designUrl, designFileName, designFileSize,
            setDesignUrl: (url, name = null, size = null) => {
                setDesignUrl(url);
                setDesignFileName(name);
                setDesignFileSize(size);
            },
            subtotal, shipping, total
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
