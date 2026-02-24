import ReviewForm from "@/components/reviews/ReviewForm";
import Image from "next/image";

export default async function PropertyReviewPage({ params }: { params: Promise<{ propertyId: string }> }) {
    const { propertyId } = await params;

    return (
        <div className="bg-[#0A0A0A] font-display text-white antialiased min-h-screen flex flex-col items-center justify-start pb-12">
            {/* Top App Bar / Header */}
            <div className="w-full max-w-md flex items-center justify-between p-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#10b77f] flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">record_voice_over</span>
                    </div>
                    <span className="font-bold tracking-tight text-sm uppercase">VoiceRealty AI</span>
                </div>
                <button className="text-white/60">
                    <span className="material-symbols-outlined">more_horiz</span>
                </button>
            </div>

            <main className="w-full max-w-md px-6 flex-1 flex flex-col pt-4">
                {/* Frosted Glass Container */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden mb-8">
                    {/* Decoration: Subtle Top Gradient */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#10b77f]/50 to-transparent"></div>

                    {/* Circular Property Thumbnail Placeholder (mock) */}
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full border-2 border-[#10b77f]/30 p-1">
                            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800">
                                <img
                                    src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80"
                                    alt="Property"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#10b77f] text-[#0A0A0A] text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full whitespace-nowrap shadow-md shadow-[#10b77f]/20">
                            Verkocht
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold leading-tight mb-4">Hoe was uw ervaring?</h1>
                    <p className="text-white/70 text-sm leading-relaxed mb-8 px-2">
                        Zou u een moment willen nemen om uw ervaring met onze AI agent en de bezichtiging met ons te delen?
                    </p>

                    <ReviewForm propertyId={propertyId} />
                </div>

                {/* Contextual Details */}
                <div className="mt-2 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 w-full">
                        <div className="w-14 h-14 rounded-lg bg-zinc-800 overflow-hidden shrink-0 shadow-inner">
                            <img
                                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&q=80"
                                alt="House details"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Verkocht Object</p>
                            <p className="text-sm font-semibold truncate">Keizersgracht 123, Amsterdam</p>
                        </div>
                    </div>
                </div>

                {/* Minimalist Footer */}
                <footer className="mt-auto pt-16 text-center pb-8 border-b border-white/10 mb-8">
                    <div className="flex justify-center flex-col gap-6 text-white/30">
                        <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium pb-4 border-b border-white/5 mx-12">
                            © 2024 VoiceRealty AI Group
                        </p>
                    </div>
                </footer>
            </main>
        </div>
    );
}
