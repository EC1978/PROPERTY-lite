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
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setShowPreview(false)}></div>
                    <div className="relative w-full h-full max-w-6xl bg-[#1A1D1C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#0df2a2]">visibility</span>
                                <span className="text-sm font-black uppercase tracking-widest">{designFileName}</span>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="size-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex-1 bg-black">
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
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#0df2a2]">upload_file</span>
                                </div>
                                <h3 className="text-xl font-extrabold tracking-tight">Bestanden <span className="text-[#0df2a2]">aanleveren</span></h3>
                            </div>

                            {!designUrl ? (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className={`relative border-2 border-dashed rounded-3xl p-12 lg:p-20 flex flex-col items-center justify-center transition-all ${isUploading ? 'border-[#0df2a2] bg-[#0df2a2]/5' : 'border-white/10 bg-[#1A1D1C]/40 hover:border-[#0df2a2]/30 hover:bg-[#1A1D1C]/60'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />

                                    {isUploading ? (
                                        <div className="text-center py-10">
                                            <div className="w-16 h-16 border-4 border-[#0df2a2]/20 border-t-[#0df2a2] rounded-full animate-spin mx-auto mb-6"></div>
                                            <p className="text-lg font-bold text-white uppercase tracking-widest">Bestand uploaden...</p>
                                            <p className="text-xs text-gray-500 mt-2 italic">Bezig met verwerken in Supabase Storage</p>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <div className="size-20 rounded-2xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(13,242,162,0.1)]">
                                                <span className="material-symbols-outlined text-[#0df2a2] text-[40px]">picture_as_pdf</span>
                                            </div>
                                            <h4 className="text-xl font-extrabold mb-2 tracking-tight">Kies uw ontwerp</h4>
                                            <p className="text-gray-500 text-sm mb-10 max-w-xs mx-auto leading-relaxed font-medium">Sleep uw PDF hiernaartoe of klik op de button om een bestand te uploaden.</p>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-10 py-5 bg-[#0df2a2] text-[#0A0A0A] rounded-2xl font-black hover:scale-105 transition-all shadow-[0_10px_30px_rgba(13,242,162,0.2)] uppercase tracking-widest text-xs flex items-center gap-3 mx-auto"
                                            >
                                                <span className="material-symbols-outlined font-black">add_circle</span>
                                                PDF Uploaden
                                            </button>

                                            <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Vector PDF</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Max 50MB</span>
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
                                    <div className="bg-[#1A1D1C]/60 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 group hover:border-[#0df2a2]/30 transition-all shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0df2a2]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                        <div className="size-20 rounded-2xl bg-[#0df2a2]/10 border border-[#0df2a2]/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(13,242,162,0.1)] group-hover:bg-[#0df2a2]/20 transition-all">
                                            <span className="material-symbols-outlined text-[#0df2a2] text-[40px]">picture_as_pdf</span>
                                        </div>

                                        <div className="flex-1 text-center md:text-left min-w-0">
                                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                                                <h4 className="font-extrabold text-white text-lg truncate tracking-tight">{designFileName || 'mijn-ontwerp.pdf'}</h4>
                                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black text-white/40 uppercase tracking-widest">DESIGN</span>
                                            </div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{formatFileSize(designFileSize)} • PDF Document</p>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            {/* Desktop Preview Trigger */}
                                            <button
                                                onClick={() => setShowPreview(true)}
                                                className="hidden md:flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                Voorbeeld
                                            </button>

                                            {/* Mobile PDF Link */}
                                            <a
                                                href={designUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="md:hidden flex-1 items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black tracking-widest uppercase flex"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                                Bekijk PDF
                                            </a>

                                            <button
                                                onClick={() => setDesignUrl(null)}
                                                className="size-12 rounded-xl flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 transition-all"
                                                title="Bestand verwijderen"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-[#0df2a2]/5 border border-[#0df2a2]/20 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                                        <div className="size-16 rounded-xl bg-[#0df2a2]/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(13,242,162,0.1)]">
                                            <span className="material-symbols-outlined text-[#0df2a2] text-[32px]">task_alt</span>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <h4 className="font-extrabold text-white mb-1 uppercase tracking-tight">Bestand succesvol gekoppeld!</h4>
                                            <p className="text-xs text-gray-500 italic">Uw ontwerp PDF is veilig klaargezet voor de drukkerij. Klik op 'Ga door' om uw bestelling af te ronden.</p>
                                        </div>
                                        <Link
                                            href="/shop/checkout/delivery"
                                            className="w-full md:w-auto px-10 py-4 bg-[#0df2a2] text-[#0A0A0A] font-black rounded-xl hover:scale-105 transition-all shadow-xl uppercase tracking-widest text-[12px] flex items-center justify-center gap-3"
                                        >
                                            Ga Door
                                            <span className="material-symbols-outlined font-black">arrow_forward</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Extra info/guidelines */}
                        <section className="bg-white/[0.03] border border-white/5 rounded-2xl p-8">
                            <h4 className="text-xs font-black text-white/60 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">info</span>
                                Aanleverspecificaties
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.1em]">Kleurprofiel</p>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Gebruik CMYK (FOGRA39) voor de beste kleurweergave op fysiek materiaal.</p>
                                </div>
                                <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
                                    <p className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.1em]">Afloop & Marges</p>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Zorg voor minimal 3mm afloop rondom en houd teksten 5mm van de rand.</p>
                                </div>
                                <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
                                    <p className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.1em]">Bestandstype</p>
                                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Sla uw vector bestand op als PDF/X-1a:2001 voor gegarandeerde kwaliteit.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="bg-[#1A1D1C]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0df2a2]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <h3 className="text-xl font-extrabold mb-8 flex items-center gap-3 tracking-tight">
                                <span className="material-symbols-outlined text-[#0df2a2]">receipt_long</span>
                                Besteloverzicht
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>Producten (totaal)</span>
                                    <span className="text-white font-bold">€ {total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>Verzending</span>
                                    <span className="text-[#0df2a2] font-bold uppercase transition-all group-hover:tracking-widest">Gratis</span>
                                </div>
                                <div className="flex justify-between text-gray-400 font-medium text-sm">
                                    <span>BTW (21%)</span>
                                    <span className="text-white font-bold">€ {tax.toFixed(2)}</span>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Te betalen</span>
                                        <span className="text-[9px] text-white/30 font-medium italic">Inclusief 21% BTW</span>
                                    </div>
                                    <span className="text-3xl font-black text-[#0df2a2] tracking-tighter drop-shadow-[0_0_15px_rgba(13,242,162,0.3)]">
                                        € {finalTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5">
                                <Link href="/shop/cart" className="flex items-center gap-2 text-xs font-bold text-[#0df2a2]/60 hover:text-[#0df2a2] transition-colors uppercase tracking-widest text-[10px]">
                                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                    Terug naar winkelmand
                                </Link>
                            </div>
                        </div>

                        {/* Help Box */}
                        <div className="bg-[#1A1D1C]/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                            <div className="size-10 rounded-full bg-[#0df2a2]/5 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[#0df2a2] text-[20px]">help_center</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Problemen met uploaden?</p>
                                <p className="text-[9px] text-gray-500 font-medium leading-relaxed">Mail uw ontwerp naar studio@voicerealty.ai onder vermelding van uw email.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
