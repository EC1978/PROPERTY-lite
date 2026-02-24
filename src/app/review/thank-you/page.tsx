"use client";

import { ArrowRight, CheckCircle2, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ThankYouPage() {
    const router = useRouter();

    return (
        <div className="bg-[#0A0A0A] font-display text-white min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6">
            {/* Subtle Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#10b77f]/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#10b77f]/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Main Content Container */}
            <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-8 items-center">

                {/* Header Section */}
                <div className="flex flex-col items-center text-center">
                    <div className="text-white mb-6">
                        <CheckCircle2
                            className="w-20 h-20 text-[#10b77f] drop-shadow-[0_0_15px_rgba(16,183,127,0.6)]"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h1 className="text-white text-3xl font-bold tracking-tight mb-3">
                        Bedankt voor uw feedback!
                    </h1>
                    <p className="text-gray-400 text-base leading-relaxed max-w-[320px]">
                        Uw beoordeling helpt ons om onze service voor makelaars continu te verbeteren.
                    </p>
                </div>

                {/* Glassmorphic Info Card */}
                <div className="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col items-center gap-4 shadow-2xl">
                    <div className="flex items-center justify-center bg-[#10b77f]/20 w-12 h-12 rounded-full mb-2">
                        <Info className="text-[#10b77f]" size={24} />
                    </div>
                    <div className="text-center">
                        <p className="text-white text-lg font-semibold mb-1">Wist u dat?</p>
                        <p className="text-gray-400 text-sm leading-relaxed px-4">
                            Dankzij feedback zoals die van u kan onze AI steeds beter vragen beantwoorden en anticiperen op de behoeften van kopers.
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="w-full mt-4 flex flex-col gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-[#10b77f] hover:bg-[#10b77f]/90 text-[#0A0A0A] font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#10b77f]/20 flex items-center justify-center gap-2 group"
                    >
                        Terug naar home
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-gray-500 text-xs text-center mt-6">
                        VoiceRealty AI © 2024
                    </p>
                </div>
            </div>
        </div>
    );
}
