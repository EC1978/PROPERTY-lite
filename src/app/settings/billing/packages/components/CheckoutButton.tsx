'use client'

import { useState } from 'react'
import { createCheckoutSession } from '../../actions'

type CheckoutButtonProps = {
    planName: string
    cta: string
    className: string
}

export default function CheckoutButton({ planName, cta, className }: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleCheckout = async () => {
        setIsLoading(true)
        try {
            const result = await createCheckoutSession(planName)
            if (result.success && result.url) {
                window.location.href = result.url
            } else {
                alert(result.message || 'Fout bij starten betaalsessie')
                setIsLoading(false)
            }
        } catch (error) {
            console.error('Checkout error:', error)
            alert('Fout bij starten betaalsessie')
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleCheckout}
            disabled={isLoading}
            className={`block text-center w-full py-3.5 px-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {isLoading ? 'Laden...' : cta}
        </button>
    )
}
