
import Link from 'next/link';

export default function OnboardingPage() {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white h-screen w-full flex flex-col overflow-hidden selection:bg-primary selection:text-white relative">
            {/* Status Bar Area (simulated) */}
            <div className="w-full h-12 shrink-0 bg-transparent flex items-end justify-between px-6 pb-2 text-xs font-medium dark:text-white/60 relative z-20">
                <span>9:41</span>
                <div className="flex gap-1.5 items-center">
                    <span className="material-symbols-outlined text-[16px] font-bold">signal_cellular_alt</span>
                    <span className="material-symbols-outlined text-[16px]">wifi</span>
                    <span className="material-symbols-outlined text-[16px]">battery_full</span>
                </div>
            </div>
            {/* Main Content Container */}
            <div className="flex-1 flex flex-col relative z-10">
                {/* Header / Logo */}
                <div className="w-full px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-primary">
                        <span className="material-symbols-outlined text-3xl">graphic_eq</span>
                        <span className="text-white font-semibold tracking-tight text-sm uppercase opacity-90">VoiceRealty AI</span>
                    </div>
                    <button className="text-white/40 text-sm font-medium hover:text-white transition-colors">Skip</button>
                </div>
                {/* Visual Anchor: Abstract 3D Form */}
                <div className="flex-1 flex items-center justify-center relative w-full">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,183,141,0.2)_0%,rgba(10,10,10,0)_70%)] animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
                    {/* 3D Shape Representation */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 z-10 flex items-center justify-center">
                        {/* Outer Ring */}
                        <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                        {/* Inner Ring */}
                        <div className="absolute inset-4 border border-primary/40 rounded-full animate-[spin_15s_linear_infinite_reverse] border-dashed"></div>
                        {/* Core Orb */}
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-[#052e25] shadow-[0_0_60px_rgba(16,183,141,0.6)] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,rgba(16,183,141,0.5)_0px,transparent_50%),radial-gradient(at_100%_100%,rgba(50,103,90,0.3)_0px,transparent_50%)]"></div>
                            <span className="material-symbols-outlined text-white/90 text-5xl drop-shadow-lg z-20">smart_toy</span>
                        </div>
                        {/* Floating Elements */}
                        <div className="absolute top-10 right-10 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white] animate-bounce delay-75"></div>
                        <div className="absolute bottom-12 left-12 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#10b78d] animate-bounce delay-300"></div>
                    </div>
                </div>
                {/* Content Block */}
                <div className="w-full px-6 pb-8 flex flex-col items-center text-center z-20">
                    <h1 className="text-white font-display font-bold text-3xl sm:text-4xl leading-[1.15] tracking-tight mb-4 max-w-[300px] sm:max-w-md">
                        Welkom bij de toekomst van vastgoed.
                    </h1>
                    <p className="text-gray-400 font-body text-base sm:text-lg leading-relaxed max-w-[320px] sm:max-w-md mb-8">
                        In 3 stappen transformeren we je brochures naar intelligente Voice AI-agenten.
                    </p>
                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="h-1.5 w-6 rounded-full bg-primary shadow-[0_0_8px_rgba(16,183,141,0.6)]"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                        <div className="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                    </div>
                    {/* Primary Action Button */}
                    <button className="w-full max-w-sm bg-primary hover:bg-primary-dark text-white font-medium text-lg py-4 rounded-xl shadow-[0_4px_20px_rgba(16,183,141,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 group">
                        <span>Start de tour</span>
                        <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </button>
                </div>
                {/* Safe Area Padding */}
                <div className="h-4 w-full"></div>
            </div>
            {/* Background texture for subtle noise/depth */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDDmvbGd5aRnc-Gn4uovfNjNXLmqWfLcSuHPegQWSqEZnmYNHWbBWAC8-w0RFNQXKvUg-vFK1zIGkfOcN-Et0Qeox5FSS60Juh-14Q1-VvwSREYhyrcK4TMETk4j79looT7ESjqYJEb15NGw1CsinWihzLXF8Gu5sQoLHRnFLnKlhkbQ9FdfWdslhW41AdskA_j3__wwlaS4aAw1B_Mz--c6i9WlUavICTCqSdZ0-Mhcyw3o4lIJuhEgnaN_WAA3ZJEg2R0_Xh-G14')]"></div>
        </div>
    );
}
