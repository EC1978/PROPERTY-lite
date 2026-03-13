'use client';

import { useState } from 'react';
import { X, Send, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendTemplateTestEmail } from './actions';

interface TestTemplateModalProps {
    template: {
        id: string;
        name: string;
    };
    onClose: () => void;
}

export default function TestTemplateModal({ template, onClose }: TestTemplateModalProps) {
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSendTest = async () => {
        if (!email || !email.includes('@')) {
            setResult({ success: false, message: 'Voer een geldig e-mailadres in.' });
            return;
        }

        setIsSending(true);
        setResult(null);

        try {
            const res = await sendTemplateTestEmail(template.id, email);
            if (res.success) {
                setResult({ success: true, message: 'Test e-mail succesvol verzonden!' });
            } else {
                setResult({ success: false, message: res.error || 'Fout bij verzenden.' });
            }
        } catch (error) {
            setResult({ success: false, message: 'Er is een onbekende fout opgetreden.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-[#0df2a2]/10 flex items-center justify-center text-[#0df2a2]">
                                <Send className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Template Testen</h3>
                                <p className="text-sm text-zinc-500 font-medium truncate max-w-[200px]">
                                    {template.name}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">
                                Ontvanger E-mail
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-zinc-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="jouw@email.nl"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-4 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all font-medium"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {result && (
                            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                                result.success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                                {result.success ? <CheckCircle2 className="size-5 shrink-0" /> : <AlertCircle className="size-5 shrink-0" />}
                                <p className="text-sm font-bold">{result.message}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleSendTest}
                                disabled={isSending || !email}
                                className="w-full py-4 rounded-2xl bg-[#0df2a2] text-black font-black hover:bg-[#0bc98a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0df2a2]/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isSending ? (
                                    <>
                                        <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        Versturen...
                                    </>
                                ) : (
                                    <>
                                        <Send className="size-4" />
                                        Verstuur Test Mail
                                    </>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl bg-white/5 text-zinc-400 font-bold hover:text-white hover:bg-white/10 transition-all text-sm"
                            >
                                Annuleren
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 bg-white/[0.02] border-t border-white/5 text-[10px] text-zinc-600 text-center font-bold uppercase tracking-wider">
                    Let op: Variabelen worden ingevuld met test-data.
                </div>
            </div>
        </div>
    );
}
