'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const steps = [
    { id: 1, name: 'Winkelmand', path: '/shop/cart', icon: 'shopping_cart' },
    { id: 2, name: 'Bestanden', path: '/shop/checkout/upload', icon: 'upload_file' },
    { id: 3, name: 'Bezorging', path: '/shop/checkout/delivery', icon: 'local_shipping' },
    { id: 4, name: 'Betaling', path: '/shop/checkout/payment', icon: 'payments' },
];

export function CheckoutStepper() {
    const pathname = usePathname();

    // Find current step index
    const currentStepIndex = steps.findIndex(step => pathname === step.path);
    const activeStep = currentStepIndex !== -1 ? steps[currentStepIndex].id : 1;

    return (
        <div className="w-full bg-[#1A1D1C]/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Back Link */}
                    <Link
                        href="/shop"
                        className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-[#0df2a2] transition-colors uppercase tracking-widest group"
                    >
                        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                        Terug naar shop
                    </Link>

                    {/* Stepper Container */}
                    <nav className="flex items-center gap-2 sm:gap-8">
                        {steps.map((step, idx) => {
                            const isCompleted = step.id < activeStep;
                            const isActive = step.id === activeStep;
                            const isLast = idx === steps.length - 1;

                            return (
                                <React.Fragment key={step.id}>
                                    <Link
                                        href={step.path}
                                        className={`flex items-center gap-3 group transition-all ${isActive ? 'opacity-100' : isCompleted ? 'opacity-100 hover:scale-105' : 'opacity-30 cursor-not-allowed'
                                            }`}
                                        onClick={(e) => {
                                            if (!isCompleted && !isActive) e.preventDefault();
                                        }}
                                    >
                                        <div className={`size-8 sm:size-10 rounded-xl flex items-center justify-center font-black text-sm transition-all border ${isActive ? 'bg-[#0df2a2] text-[#0A0A0A] border-[#0df2a2] shadow-[0_0_15px_rgba(13,242,162,0.4)]' :
                                            isCompleted ? 'bg-[#0df2a2]/10 text-[#0df2a2] border-[#0df2a2]/20 group-hover:bg-[#0df2a2]/20' :
                                                'bg-white/5 text-white/40 border-white/10'
                                            }`}>
                                            {isCompleted ? (
                                                <span className="material-symbols-outlined text-[20px]">check</span>
                                            ) : (
                                                step.id
                                            )}
                                        </div>
                                        <div className="hidden sm:flex flex-col">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${isActive ? 'text-[#0df2a2]' : 'text-white/40'
                                                }`}>
                                                Stap 0{step.id}
                                            </span>
                                            <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-white' : 'text-white/60'
                                                }`}>
                                                {step.name}
                                            </span>
                                        </div>
                                    </Link>

                                    {!isLast && (
                                        <div className={`h-px w-4 sm:w-12 transition-colors ${isCompleted ? 'bg-[#0df2a2]/30' : 'bg-white/10'
                                            }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>

                    {/* Desktop Help/Support */}
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                        <span className="size-2 rounded-full bg-[#0df2a2] animate-pulse"></span>
                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Live Support</span>
                    </div>

                    {/* Mobile Spacer */}
                    <div className="md:hidden w-10"></div>
                </div>
            </div>
        </div>
    );
}
