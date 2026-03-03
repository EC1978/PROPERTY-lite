'use client'

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CheckoutStepper } from '@/components/shop/CheckoutStepper';
import { createClient } from '@/utils/supabase/client';

export default function CheckoutUploadPage() {
    const router = useRouter();
    const { total, designUrl, setDesignUrl, designFileName, designFileSize } = useCart();
    const [isUploading, setIsUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Assume standard 21% VAT
    const tax = total * 0.21;
    const finalTotal = total + tax;

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Alleen PDF bestanden zijn toegestaan. Upload a.u.b. een PDF ontwerp.');
            e.target.value = ''; // Reset input
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError('Het bestand is te groot. De maximale grootte is 50MB.');
            e.target.value = ''; // Reset input
            return;
        }

        setError(null);
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        const supabase = createClient();

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Je moet ingelogd zijn om bestanden te uploaden.');
                setIsUploading(false);
                return;
            }

            const fileExt = 'pdf';
            const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('design_uploads')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('design_uploads')
                .getPublicUrl(filePath);

            setDesignUrl(publicUrl, file.name, file.size);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(`Upload mislukt: ${err.message || 'Onbekende fout'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setError('Alleen PDF bestanden zijn toegestaan.');
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                setError('Het bestand is te groot. De maximale grootte is 50MB.');
                return;
            }
            await uploadFile(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#F8FAFC] font-sans pb-32">
            <CheckoutStepper />

            {/* Preview Modal (Desktop) */}
            {showPreview && designUrl && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500">
                    <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setShowPreview(false)}></div>
                    <div className="relative w-full h-full max-w-6xl glass-panel border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/40">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black">visibility</span>
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em] italic text-white">{designFileName}</span>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="size-12 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition-all border border-white/10 group"
                            >
                                <span className="material-symbols-outlined font-black group-hover:rotate-90 transition-transform">close</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-black/40">
                            <iframe
                                src={`${designUrl}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="Large PDF Preview"
                            />
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Upload Area */}
                    <div className="lg:col-span-8 space-y-8">
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-12 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,183,127,0.1)]">
                                    <span className="material-symbols-outlined text-[#10b77f] font-black">upload_file</span>
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase italic">Bestanden <span className="text-[#10b77f]">aanleveren</span></h3>
                            </div>

                            {!designUrl ? (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className={`relative border-2 border-dashed rounded-[3rem] p-12 lg:p-24 flex flex-col items-center justify-center transition-all duration-700 overflow-hidden ${isUploading ? 'border-[#10b77f] bg-[#10b77f]/5' : 'border-white/10 glass-panel hover:border-[#10b77f]/40 hover:bg-[#10b77f]/2'
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#10b77f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />

                                    {isUploading ? (
                                        <div className="text-center py-10 relative z-10">
                                            <div className="w-20 h-20 border-4 border-[#10b77f]/20 border-t-[#10b77f] rounded-full animate-spin mx-auto mb-8 shadow-[0_0_30px_rgba(16,183,127,0.2)]"></div>
                                            <p className="text-xl font-black text-white uppercase tracking-widest italic">Bestand uploaden...</p>
                                            <p className="text-[10px] text-zinc-500 mt-3 font-black uppercase tracking-widest opacity-50 italic">Bezig met verwerken in onze cloud</p>
                                        </div>
                                    ) : (
                                        <div className="text-center relative z-10 group/drop">
                                            <div className="size-24 rounded-[2rem] bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,183,127,0.1)] group-hover/drop:scale-110 transition-transform duration-700">
                                                <span className="material-symbols-outlined text-[#10b77f] text-[48px] font-black">picture_as_pdf</span>
                                            </div>
                                            <h4 className="text-3xl font-black mb-4 tracking-tighter uppercase italic">Kies uw ontwerp</h4>
                                            <p className="text-zinc-500 text-[11px] mb-12 max-w-xs mx-auto leading-relaxed font-black uppercase tracking-widest italic opacity-60">Sleep uw PDF hiernaartoe of klik op de button om een bestand te uploaden.</p>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-12 py-6 bg-[#10b77f] text-[#0A0A0A] rounded-2xl font-black hover:bg-[#10b77f]/90 transition-all shadow-[0_20px_50px_rgba(16,183,127,0.2)] uppercase tracking-widest text-[10px] flex items-center gap-4 mx-auto group/btn italic"
                                            >
                                                <span className="material-symbols-outlined font-black group-hover/btn:rotate-90 transition-transform">add_circle</span>
                                                PDF Uploaden
                                            </button>

                                            <div className="mt-16 flex items-center justify-center gap-10 opacity-30">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-[20px] text-[#10b77f] font-black">verified</span>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Vector PDF</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-[20px] text-[#10b77f] font-black">inventory</span>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Max 50MB</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="absolute bottom-6 left-6 right-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <span className="material-symbols-outlined text-red-500">error</span>
                                            <p className="text-xs font-bold text-red-400">{error}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Premium File Card */}
                                    <div className="glass-panel border-white/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 group hover:border-[#10b77f]/40 transition-all duration-700 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b77f]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10b77f]/10 transition-all duration-1000"></div>

                                        <div className="size-24 rounded-[2rem] bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(16,183,127,0.1)] group-hover:bg-[#10b77f]/20 transition-all duration-700 relative z-10">
                                            <span className="material-symbols-outlined text-[#10b77f] text-[48px] font-black">picture_as_pdf</span>
                                        </div>

                                        <div className="flex-1 text-center md:text-left min-w-0 relative z-10">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                                                <h4 className="font-black text-white text-xl uppercase tracking-tighter italic">{designFileName || 'mijn-ontwerp.pdf'}</h4>
                                                <span className="px-3 py-1 rounded-lg bg-[#10b77f]/10 border border-[#10b77f]/20 text-[8px] font-black text-[#10b77f] uppercase tracking-[0.2em] italic">ONTWERP BESTAND</span>
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] italic opacity-60">{formatFileSize(designFileSize)} • PDF Document</p>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                                            {/* Desktop Preview Trigger */}
                                            <button
                                                onClick={() => setShowPreview(true)}
                                                className="hidden md:flex flex-1 md:flex-none items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[9px] font-black tracking-[0.2em] uppercase transition-all italic"
                                            >
                                                <span className="material-symbols-outlined text-[20px] font-black">visibility</span>
                                                Voorbeeld
                                            </button>

                                            {/* Mobile PDF Link */}
                                            <a
                                                href={designUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="md:hidden flex-1 items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black tracking-[0.2em] uppercase flex italic"
                                            >
                                                <span className="material-symbols-outlined text-[20px] font-black">open_in_new</span>
                                                Bekijk PDF
                                            </a>

                                            <button
                                                onClick={() => setDesignUrl(null)}
                                                className="size-14 rounded-2xl flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all group/del"
                                                title="Bestand verwijderen"
                                            >
                                                <span className="material-symbols-outlined text-[24px] font-black group-hover:rotate-12 transition-transform">delete_sweep</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="glass-panel border-[#10b77f]/20 bg-[#10b77f]/2 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-[0_20px_50px_rgba(16,183,127,0.05)]">
                                        <div className="size-16 rounded-2xl bg-[#10b77f]/10 border border-[#10b77f]/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,183,127,0.1)]">
                                            <span className="material-symbols-outlined text-[#10b77f] text-[32px] font-black">verified</span>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h4 className="font-black text-white mb-2 uppercase tracking-tight italic">Bestand succesvol gekoppeld!</h4>
                                            <p className="text-[11px] text-zinc-500 font-medium italic leading-relaxed">Uw ontwerp is veilig klaargezet voor de drukkerij. We controleren de technische specificaties handmatig voor productie.</p>
                                        </div>
                                        <Link
                                            href="/shop/checkout/delivery"
                                            className="w-full md:w-auto px-12 py-5 bg-[#10b77f] text-[#0A0A0A] font-black rounded-2xl hover:bg-[#10b77f]/90 transition-all shadow-[0_20px_40px_rgba(16,183,127,0.2)] uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 italic group/next"
                                        >
                                            Ga Door
                                            <span className="material-symbols-outlined font-black transition-transform group-hover/next:translate-x-3">east</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Extra info/guidelines */}
                        <section className="glass-panel border-white/5 rounded-[2rem] p-10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#10b77f]/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h4 className="text-[10px] font-black text-zinc-500 mb-8 uppercase tracking-[0.2em] flex items-center gap-3 italic">
                                <span className="material-symbols-outlined text-[20px] text-[#10b77f] font-black">info</span>
                                Aanleverspecificaties
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-[#10b77f] uppercase tracking-[0.1em] italic">Kleurprofiel</p>
                                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic opacity-80">Gebruik CMYK (FOGRA39) voor de beste kleurweergave op fysiek materiaal.</p>
                                </div>
                                <div className="space-y-3 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-10">
                                    <p className="text-[9px] font-black text-[#10b77f] uppercase tracking-[0.1em] italic">Afloop & Marges</p>
                                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic opacity-80">Zorg voor minimal 3mm afloop rondom en houd teksten 5mm van de rand.</p>
                                </div>
                                <div className="space-y-3 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-10">
                                    <p className="text-[9px] font-black text-[#10b77f] uppercase tracking-[0.1em] italic">Bestandstype</p>
                                    <p className="text-[11px] text-zinc-500 font-medium leading-relaxed italic opacity-80">Sla uw vector bestand op als PDF/X-1a:2001 voor gegarandeerde kwaliteit.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="glass-panel border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-[#10b77f]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#10b77f]/10 transition-all duration-1000"></div>
                            <h3 className="text-2xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase italic relative z-10">
                                <span className="material-symbols-outlined text-[#10b77f] font-black">receipt_long</span>
                                Bestelling
                            </h3>

                            <div className="space-y-6 mb-10 relative z-10">
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>Producten</span>
                                    <span className="text-white not-italic font-black">€ {total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>Verzending</span>
                                    <span className="text-[#10b77f] not-italic font-black uppercase tracking-widest">Gratis</span>
                                </div>
                                <div className="flex justify-between text-zinc-500 font-black uppercase tracking-widest text-[10px] italic">
                                    <span>BTW (21%)</span>
                                    <span className="text-white not-italic font-black">€ {tax.toFixed(2)}</span>
                                </div>
                                <div className="pt-8 mt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 italic">Te betalen</span>
                                        <span className="text-[8px] text-[#10b77f] font-black uppercase tracking-widest italic opacity-40">Inclusief BTW</span>
                                    </div>
                                    <span className="text-4xl font-black text-[#10b77f] tracking-tighter italic drop-shadow-[0_0_30px_rgba(16,183,127,0.2)]">
                                        € {finalTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                                <Link href="/shop/cart" className="flex items-center gap-3 text-[10px] font-black text-[#10b77f] hover:text-[#10b77f]/80 transition-all uppercase tracking-[0.2em] italic group/back">
                                    <span className="material-symbols-outlined text-[18px] font-black transition-transform group-hover/back:-translate-x-2">west</span>
                                    Terug naar winkelmand
                                </Link>
                            </div>
                        </div>

                        {/* Help Box */}
                        <div className="glass-panel border-white/5 rounded-[2rem] p-6 flex items-center gap-5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#10b77f]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:border-[#10b77f]/30 transition-all">
                                <span className="material-symbols-outlined text-zinc-500 group-hover:text-[#10b77f] transition-all font-black">support_agent</span>
                            </div>
                            <div className="relative z-10 flex-1">
                                <p className="text-[10px] font-black text-white mb-1 uppercase tracking-widest italic">Hulp nodig?</p>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase italic opacity-60">studio@voicerealty.ai</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
