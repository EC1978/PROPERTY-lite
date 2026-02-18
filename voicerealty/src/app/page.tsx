import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  // Fetch current hero image setting
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'hero_image')
    .maybeSingle();

  let heroImage = null;
  if (setting?.value) {
    if (typeof setting.value === 'string') {
      heroImage = setting.value;
    } else if (typeof setting.value === 'object' && (setting.value as any).url) {
      heroImage = (setting.value as any).url;
    }
  }

  console.log('Landing Page - Hero Image:', heroImage);

  return (
    <div className="relative min-h-screen flex flex-col w-full max-w-7xl mx-auto bg-[#f6f8f7] dark:bg-[#0A0A0A] shadow-2xl overflow-hidden font-sans">

      {/* Background Orbs */}
      <div className="fixed top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#10b77f]/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-[#10b77f]/10 rounded-full blur-[80px] pointer-events-none z-0"></div>

      <Header />

      <main className="relative z-10 flex flex-col gap-4 px-4 pb-8">

        {/* Entree Label */}
        <div className="flex items-center justify-center gap-3 py-1 opacity-80">
          <div className="flex gap-1.5">
            <div className="h-1 w-4 rounded-full bg-[#10b77f] shadow-[0_0_8px_rgba(16,183,127,0.4)]"></div>
            <div className="h-1 w-1.5 rounded-full bg-white/10"></div>
            <div className="h-1 w-1.5 rounded-full bg-white/10"></div>
          </div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Entree</span>
        </div>

        <Hero backgroundImage={heroImage} />
        <Features />
        <Pricing />

        {/* Trusted By Footer */}
        <div className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4 overflow-hidden mt-2">
          <span className="text-xs font-medium text-gray-500 shrink-0">VERTROUWD DOOR</span>
          <div className="flex gap-6 opacity-30 grayscale items-center">
            <span className="text-sm font-bold tracking-widest font-serif text-white">REMAX</span>
            <span className="text-sm font-bold tracking-tighter text-white">ERA</span>
            <span className="text-sm font-bold italic text-white">C21</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8 mb-2">VoiceRealty AI © 2026</p>

      </main>
    </div>
  );
}
