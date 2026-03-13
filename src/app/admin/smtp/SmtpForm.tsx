'use client';

import { useState } from 'react';
import { updateSmtpSettings, sendTestEmail } from './actions';
import { Save, Server, Shield, Mail, User, Send, CheckCircle2, AlertCircle as AlertIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SmtpFormProps {
    initialSettings: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
        from_email: string;
        from_name: string;
    } | null;
}

export default function SmtpForm({ initialSettings }: SmtpFormProps) {
    const [formData, setFormData] = useState({
        host: initialSettings?.host || '',
        port: initialSettings?.port || 587,
        secure: initialSettings?.secure ?? true,
        user: initialSettings?.user || '',
        pass: initialSettings?.pass || '',
        from_email: initialSettings?.from_email || '',
        from_name: initialSettings?.from_name || ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const [isTesting, setIsTesting] = useState(false);
    const [testRecipient, setTestRecipient] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);

    const handleTest = async () => {
        if (!testRecipient) {
            setTestResult({ success: false, message: 'Voer een ontvanger e-mailadres in.' });
            return;
        }
        setIsTesting(true);
        setTestResult(null);
        
        const result = await sendTestEmail(formData, testRecipient);
        
        if (result.success) {
            setTestResult({ success: true, message: 'Test e-mail succesvol verzonden! Controleer je inbox.' });
        } else {
            setTestResult({ success: false, message: `Fout: ${result.error}` });
        }
        setIsTesting(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const result = await updateSmtpSettings(formData);

        if (result.success) {
            setMessage({ type: 'success', text: 'SMTP instellingen succesvol opgeslagen.' });
            router.refresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Er is een fout opgetreden.' });
        }
        setIsSaving(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
                <div className={`p-4 rounded-2xl border ${
                    message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                } font-semibold text-center animate-in fade-in`}>
                   {message.text}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Server Connectivity */}
                <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Server className="size-5 text-[#0df2a2]" />
                        Server Verbinding
                    </h3>
                    
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">SMTP Host</label>
                        <input
                            type="text"
                            name="host"
                            value={formData.host}
                            onChange={handleChange}
                            required
                            placeholder="bijv. smtp.mailgun.org"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">Poort</label>
                            <input
                                type="number"
                                name="port"
                                value={formData.port}
                                onChange={handleChange}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer mt-6">
                                <input
                                    type="checkbox"
                                    name="secure"
                                    checked={formData.secure}
                                    onChange={handleChange}
                                    className="peer sr-only"
                                />
                                <span className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2a2] relative inline-block"></span>
                                <span className="text-sm font-semibold text-white">SSL/TLS Secure</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Authentication */}
                <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="size-5 text-[#0df2a2]" />
                        Authenticatie
                    </h3>
                    
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">Gebruikersnaam</label>
                        <input
                            type="text"
                            name="user"
                            value={formData.user}
                            onChange={handleChange}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">Wachtwoord</label>
                        <input
                            type="password"
                            name="pass"
                            value={formData.pass}
                            onChange={handleChange}
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Sender Details */}
                <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-5 md:col-span-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Mail className="size-5 text-[#0df2a2]" />
                        Afzender Gegevens (Platform Standaard)
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1 flex items-center gap-1">
                                <User className="size-3" /> Zichtbare Naam
                            </label>
                            <input
                                type="text"
                                name="from_name"
                                value={formData.from_name}
                                onChange={handleChange}
                                required
                                placeholder="bijv. VoiceRealty Systeem"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">E-mailadres Afzender</label>
                            <input
                                type="email"
                                name="from_email"
                                value={formData.from_email}
                                onChange={handleChange}
                                required
                                placeholder="bijv. noreply@voicerealty.nl"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Connection Section */}
            <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Send className="size-5 text-blue-400" />
                        Verbinding Testen
                    </h3>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="email"
                            placeholder="Ontvanger test e-mail..."
                            value={testRecipient}
                            onChange={(e) => setTestRecipient(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 outline-none transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleTest}
                        disabled={isTesting}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold disabled:opacity-50 transition-all shrink-0"
                    >
                        {isTesting ? (
                            <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : <Send className="size-4" />}
                        Verstuur Test
                    </button>
                </div>

                {testResult && (
                    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
                        testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                    } animate-in fade-in slide-in-from-top-2`}>
                        {testResult.success ? <CheckCircle2 className="size-5 mt-0.5" /> : <AlertIcon className="size-5 mt-0.5" />}
                        <p className="text-sm font-medium">{testResult.message}</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#0df2a2] text-black font-bold hover:bg-[#0bc98a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0df2a2]/20 active:scale-95"
                >
                    {isSaving ? (
                        <span className="flex items-center gap-2">
                             <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                             Bewerken...
                        </span>
                    ) : (
                        <>
                            <Save className="size-5" />
                            Instellingen Opslaan
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
