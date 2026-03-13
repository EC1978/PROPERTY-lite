'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateEmailTemplate } from './actions';
import { Save, ChevronLeft, Mail, Info, Eye, Bell, Send, Power } from 'lucide-react';
import Link from 'next/link';
import { processTemplate } from '@/utils/template-processor';

interface EmailEditorProps {
    template: {
        id: string;
        name: string;
        subject: string;
        html_body: string;
        type?: string;
        description?: string;
        is_active?: boolean;
    };
}

export default function EmailEditor({ template }: EmailEditorProps) {
    const [subject, setSubject] = useState(template.subject);
    const [htmlBody, setHtmlBody] = useState(template.html_body);
    const [description, setDescription] = useState(template.description || '');
    const [isActive, setIsActive] = useState(template.is_active ?? true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        
        const result = await updateEmailTemplate(template.id, { 
            subject, 
            html_body: htmlBody,
            description,
            is_active: isActive 
        });
        
        if (result.success) {
            setMessage({ type: 'success', text: 'Template succesvol bijgewerkt!' });
            router.refresh();
        } else {
            setMessage({ type: 'error', text: result.error || 'Er is iets misgegaan.' });
        }
        setIsSaving(false);
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'email': return 'E-mail';
            case 'notification': return 'Notificatie';
            case 'both': return 'Beide';
            default: return 'E-mail';
        }
    };

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'email': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'notification': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'both': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-white/5 text-zinc-400 border-white/10';
        }
    };

    const getTypeIcon = () => {
        switch (template.type) {
            case 'notification': return <Bell className="size-4 text-amber-400" />;
            case 'both': return <Send className="size-4 text-purple-400" />;
            default: return <Mail className="size-4 text-[#0df2a2]" />;
        }
    };

    // Preview data for placeholders
    const previewData = {
        agent_name: 'Erdem',
        lead_name: 'Test Lead',
        office_name: 'VoiceRealty HQ',
        property_address: 'Keizersgracht 123, Amsterdam',
        appointment_date: '15 Maart 2026',
        appointment_time: '14:00',
        titel: 'Bezichtiging gepland',
        message: 'Er is een nieuwe bezichtiging gepland voor uw woning.',
        link: '#'
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/admin/emails"
                        className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft className="size-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <h1 className="text-2xl font-bold text-white">{template.name}</h1>
                            {template.type && (
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeBadgeClass(template.type)}`}>
                                    {getTypeLabel(template.type)}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-zinc-500 font-medium italic">Template ID: {template.id}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Active Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="peer sr-only"
                        />
                        <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0df2a2] relative"></div>
                        <span className="text-xs font-bold text-zinc-400">{isActive ? 'Actief' : 'Inactief'}</span>
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0df2a2] text-black font-bold hover:bg-[#0bc98a] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#0df2a2]/20 active:scale-95"
                    >
                        {isSaving ? (
                            <span className="flex items-center gap-2">
                                 <div className="size-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                 Opslaan...
                            </span>
                        ) : (
                            <>
                                <Save className="size-4" />
                                Wijzigingen Opslaan
                            </>
                        )}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl border ${
                    message.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                } animate-in zoom-in duration-300 font-semibold text-center`}>
                    {message.text}
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Editor Section */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-8 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-[#0df2a2]/10 flex items-center justify-center">
                                {getTypeIcon()}
                            </div>
                            Template Editor
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">Beschrijving</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-zinc-300 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all text-sm"
                                    placeholder="Korte beschrijving van deze template..."
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">Onderwerp / Titel</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all font-medium"
                                    placeholder="Bijv. Welkom bij VoiceRealty!"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase tracking-widest font-black text-zinc-500 mb-2 ml-1">Template Content (HTML/JSON)</label>
                                <textarea
                                    value={htmlBody}
                                    onChange={(e) => setHtmlBody(e.target.value)}
                                    rows={15}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] outline-none transition-all font-mono text-sm leading-relaxed resize-none"
                                    placeholder="Schrijf hier je content..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-[2rem] p-6">
                        <div className="flex gap-4">
                            <Info className="size-5 text-blue-500 shrink-0" />
                            <div className="space-y-2">
                                <h4 className="font-bold text-blue-500 text-sm">Dynamische Placeholders</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Gebruik dubbele accolades om data in te vullen. Beschikbare tags:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        '{{lead_name}}', 
                                        '{{property_address}}', 
                                        '{{agent_name}}', 
                                        '{{office_name}}',
                                        '{{appointment_date}}',
                                        '{{appointment_time}}',
                                        '{{link}}',
                                        '{{titel}}',
                                        '{{bericht}}'
                                    ].map(tag => (
                                        <code key={tag} className="px-2 py-1 bg-white/5 rounded text-[10px] text-zinc-300 border border-white/5 font-bold">{tag}</code>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2 font-medium italic">
                                    * Enkele accolades {`{tag}`} worden ook ondersteund voor compatibiliteit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/5 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl h-full flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                <Eye className="size-4" />
                                Live Preview
                            </h3>
                            <div className="flex gap-1.5">
                                <div className="size-2 rounded-full bg-red-500/20" />
                                <div className="size-2 rounded-full bg-amber-500/20" />
                                <div className="size-2 rounded-full bg-emerald-500/20" />
                            </div>
                        </div>
                        
                        <div className="flex-1 p-8 overflow-auto bg-white min-h-[500px]">
                            {/* Processed HTML for preview */}
                            <div 
                                className="text-black"
                                dangerouslySetInnerHTML={{ __html: processTemplate(htmlBody, previewData) }} 
                            />
                        </div>
                        
                        <div className="p-4 bg-[#0A0A0A] border-t border-white/5 text-[10px] text-zinc-600 text-center font-medium italic">
                            Let op: Dit is een gesimuleerde weergave. Variabelen zijn ingevuld met testdata.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
