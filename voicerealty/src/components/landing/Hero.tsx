import Link from 'next/link';

interface HeroProps {
    backgroundImage?: string | null
}

export default function Hero({ backgroundImage }: HeroProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 aspect-[4/5] sm:aspect-square md:aspect-[2/1] lg:aspect-[2.4/1] w-full flex flex-col justify-between">
            {backgroundImage && (
                <div
                    className="absolute inset-y-0 right-0 w-full md:w-3/4 z-0 opacity-60 animate-in fade-in duration-1000"
                    style={{
                        backgroundImage: `url(${backgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'right center',
                        maskImage: 'linear-gradient(to left, black 40%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 100%)'
                    }}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A0A0A]/80 z-0"></div>
            <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-[#10b77f]/20 bg-[#10b77f]/10 px-3 py-1 text-xs font-semibold text-[#10b77f] mb-4">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b77f] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b77f]"></span>
                    </span>
                    Live Demo Beschikbaar
                </div>
                <h2 className="text-4xl font-black leading-[1.1] tracking-tight mb-3 text-white">
                    Geef je woning <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">een stem</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
                    De high-end SaaS voor makelaars. Transformeer vastgoedpresentaties met AI Voice-agenten.
                </p>
            </div>
            <div className="relative z-10 flex-1 flex items-center justify-center py-6">
                <div className="relative w-full h-32 flex items-center justify-center">
                    <div className="absolute left-4 w-16 h-16 border-2 border-white/20 rounded-lg grid grid-cols-3 gap-1 p-1 opacity-40">
                        <div className="col-span-1 row-span-1 bg-white rounded-sm"></div>
                        <div className="col-span-1 row-span-2 bg-white rounded-sm"></div>
                        <div className="col-span-1 row-span-1 bg-white rounded-sm"></div>
                        <div className="col-span-1 row-span-1 bg-white rounded-sm"></div>
                        <div className="col-span-2 row-span-1 bg-white rounded-sm"></div>
                    </div>
                    <div className="h-[1px] w-full bg-gradient-to-r from-white/10 via-[#10b77f]/50 to-white/10 absolute"></div>
                    <div className="absolute right-4 flex gap-1 items-center h-16">
                        <div className="w-1 h-4 bg-[#10b77f] rounded-full animate-[pulse_1s_ease-in-out_infinite]"></div>
                        <div className="w-1 h-8 bg-[#10b77f] rounded-full animate-[pulse_1.2s_ease-in-out_infinite]"></div>
                        <div className="w-1 h-12 bg-[#10b77f] rounded-full animate-[pulse_0.8s_ease-in-out_infinite]"></div>
                        <div className="w-1 h-6 bg-[#10b77f] rounded-full animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                        <div className="w-1 h-10 bg-[#10b77f] rounded-full animate-[pulse_1.1s_ease-in-out_infinite]"></div>
                    </div>
                </div>
            </div>
            <div className="relative z-10">
                <Link href="/register" className="w-full flex items-center justify-center gap-2 bg-[#10b77f] hover:bg-[#10b77f]/90 text-[#0A0A0A] font-bold h-12 rounded-xl transition-all active:scale-[0.98]">
                    <span>Probeer Demo</span>
                    <span className="material-symbols-outlined text-lg font-bold">arrow_forward</span>
                </Link>
            </div>
        </div>
    );
}
