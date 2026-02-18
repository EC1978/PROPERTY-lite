'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import confetti from 'canvas-confetti';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');

    useEffect(() => {
        // Fire confetti on mount
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#ffffff', '#059669']
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <div className="bg-[#121212] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center">
                {/* Background decorative glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#10B981]/20 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative mb-6">
                    <div className="w-20 h-20 bg-[#10B981] rounded-full mx-auto flex items-center justify-center shadow-lg shadow-[#10B981]/50 animate-bounce-slow">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-2 text-white">Betaling Geslaagd!</h1>
                <p className="text-white/60 mb-8">
                    Bedankt! Je abonnement op <strong>{plan || 'VoiceRealty'}</strong> is nu actief. Je hebt direct toegang tot alle functies.
                </p>

                <div className="bg-white/5 rounded-lg p-4 mb-8 border border-white/5 text-left">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-white/40">Status</span>
                        <span className="text-sm font-semibold text-[#10B981] flex items-center">
                            <span className="w-2 h-2 bg-[#10B981] rounded-full mr-2 animate-pulse" />
                            Actief
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-white/40">Factuurnummer</span>
                        <span className="text-sm font-mono text-white/80">INV-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</span>
                    </div>
                </div>

                <Link
                    href="/dashboard"
                    className="block w-full bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-[#10B981]/20"
                >
                    Ga naar Dashboard
                </Link>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}
