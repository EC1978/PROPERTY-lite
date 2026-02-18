'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

function CheckoutConfirmationContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const plan = searchParams.get('plan') || 'Professional';
    const [loading, setLoading] = useState(false);

    // Dynamic content based on plan
    const planDetails = {
        'Essential': { price: 49.00, vat: 8.50, subtotal: 40.50, features: ['3 Properties', 'Basic Support'] },
        'Professional': { price: 129.00, vat: 22.39, subtotal: 106.61, features: ['Onbeperkte AI-stemmen', 'CRM-integratie', '15 Woningen'] },
        'Elite': { price: 299.00, vat: 51.89, subtotal: 247.11, features: ['Voice Cloning', 'Priority Support', 'Onbeperkt Woningen'] }
    }[plan] || { price: 0, vat: 0, subtotal: 0, features: [] };

    const handleConfirm = async () => {
        setLoading(true);
        // Simulate processing delay
        try {
            const response = await fetch('/api/checkout/mock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });

            if (response.ok) {
                router.push('/checkout/success?plan=' + plan);
            } else {
                alert('Payment simulation failed');
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#10B981]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <h1 className="text-2xl font-bold mb-6 text-center">Bestelling Controleren</h1>

                <div className="space-y-6">
                    {/* Plan Details */}
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-semibold text-[#10B981]">{plan} Plan</h2>
                            <span className="text-xs text-white/40">Maandelijks</span>
                        </div>
                        <p className="text-sm text-white/60 mb-3">
                            {plan === 'Professional' ? 'Onbeperkt AI-stemgebruik voor woningpresentaties en automatische transcripties.' : 'Toegang tot VoiceRealty AI services.'}
                        </p>
                        <div className="text-xs text-white/40">
                            Eerste afschrijving op: {new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>

                    {/* Invoice Summary */}
                    <div className="space-y-2 border-t border-white/10 pt-4">
                        <h3 className="text-sm uppercase tracking-wider text-white/40 font-semibold mb-2">Factuuroverzicht</h3>
                        <div className="flex justify-between text-sm text-white/60">
                            <span>Subtotaal</span>
                            <span>€{planDetails.subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-sm text-white/60">
                            <span>BTW (21%)</span>
                            <span>€{planDetails.vat.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10 mt-2">
                            <span>Totaal</span>
                            <span>€{planDetails.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center space-x-3 bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="bg-white rounded p-1">
                            {/* Simple Credit Card Icon placeholder or text */}
                            <div className="w-8 h-5 bg-gray-200 rounded-sm" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">Veilig betalen via Mollie</p>
                            <p className="text-xs text-white/40">iDEAL, Creditcard, Apple Pay</p>
                        </div>
                        <div className="text-[#10B981]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4  flex flex-col gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Verwerken...</span>
                                </>
                            ) : (
                                <span>Bevestigen en Betalen</span>
                            )}
                        </button>

                        <Link href="/pricing" className="w-full text-center text-sm text-white/40 hover:text-white transition-colors">
                            Annuleren en terug
                        </Link>
                    </div>

                    <p className="text-[10px] text-center text-white/20 mt-4">
                        Door af te rekenen gaat u akkoord met onze algemene voorwaarden en privacybeleid.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
            </div>
        }>
            <CheckoutConfirmationContent />
        </Suspense>
    );
}
