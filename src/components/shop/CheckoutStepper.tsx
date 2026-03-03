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
                        className="flex items-center gap-3 text-[10px] font-black text-zinc-500 hover:text-[#10b77f] transition-all uppercase tracking-[0.2em] group italic"
                    >
                        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-2 font-black">west</span>
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
                                        className={`flex items-center gap-4 group transition-all ${isActive ? 'opacity-100' : isCompleted ? 'opacity-100 hover:scale-105' : 'opacity-30 cursor-not-allowed'
                                            }`}
                                        onClick={(e) => {
                                            if (!isCompleted && !isActive) e.preventDefault();
                                        }}
                                    >
                                        <div className={`size-10 sm:size-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all border ${isActive ? 'bg-[#10b77f] text-[#0A0A0A] border-[#10b77f] shadow-[0_0_30px_rgba(16,183,127,0.3)]' :
                                            isCompleted ? 'bg-[#10b77f]/10 text-[#10b77f] border-[#10b77f]/20 group-hover:bg-[#10b77f]/20' :
                                                'bg-white/5 text-white/40 border-white/10'
                                            }`}>
                                            {isCompleted ? (
                                                <span className="material-symbols-outlined text-[22px] font-black">check</span>
                                            ) : (
                                                step.id
                                            )}
                                        </div>
                                        <div className="hidden sm:flex flex-col">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-1.5 italic ${isActive ? 'text-[#10b77f]' : 'text-zinc-600'
                                                }`}>
                                                Stap 0{step.id}
                                            </span>
                                            <span className={`text-sm font-black tracking-tight uppercase italic ${isActive ? 'text-white' : 'text-zinc-400'
                                                }`}>
                                                {step.name}
                                            </span>
                                        </div>
                                    </Link>

                                    {!isLast && (
                                        <div className={`h-px w-4 sm:w-16 transition-all duration-700 ${isCompleted ? 'bg-[#10b77f]/30' : 'bg-white/10'
                                            }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>

                    {/* Desktop Help/Support */}
                    <div className="hidden md:flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner group/support hover:border-[#10b77f]/30 transition-all">
                        <span className="size-2 rounded-full bg-[#10b77f] animate-pulse shadow-[0_0_10px_rgba(16,183,127,0.5)]"></span>
                        <span className="text-[9px] font-black text-zinc-500 group-hover:text-white uppercase tracking-[0.2em] italic transition-colors">Live Support</span>
                    </div>

                    {/* Mobile Spacer */}
                    <div className="md:hidden w-10"></div>
                </div>
            </div>
        </div>
    );
}
